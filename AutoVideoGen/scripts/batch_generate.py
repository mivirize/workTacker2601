"""
Batch Video Generation Orchestrator

Reads pending tasks from the database (or a JSON file) and sequentially
generates videos via the VM automation in create_video_on_vm.py.

Features:
- Resume support (only picks up status='planned' tasks)
- Stale task recovery (processing > 30 min reset to planned)
- Per-batch logging to logs/batch_{timestamp}.log
- Retry logic with configurable max_retries
- Dry-run mode for previewing pending tasks
- CLI with --from-db, --from-json, --status, --dry-run

Usage:
    python scripts/batch_generate.py --from-db --limit 5
    python scripts/batch_generate.py --from-json scripts/test_intj.json
    python scripts/batch_generate.py --from-db --type INTJ --delay 60
    python scripts/batch_generate.py --from-db --dry-run
    python scripts/batch_generate.py --status
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_DEFAULT_VM_IP = os.environ.get("VM_HOST", "192.168.1.28")


@dataclass(frozen=True)
class BatchConfig:
    """Immutable configuration for batch video generation."""

    vm_ip: str = _DEFAULT_VM_IP
    vm_port: int = 8888
    cdp_port: int = 9222
    db_path: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "database.db"
    )
    max_retries: int = 3
    delay_between_videos: int = 30
    output_dir: str = "C:/Users/rmiak/OneDrive/\u30c9\u30ad\u30e5\u30e1\u30f3\u30c8"
    log_dir: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "logs"
    )
    stale_timeout_minutes: int = 30


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class BatchResult:
    """Immutable result of a single video generation attempt."""

    task_id: int
    title: str
    status: str  # 'success', 'failed', 'skipped'
    file_path: Optional[str] = None
    error: Optional[str] = None
    duration_seconds: float = 0.0


# ---------------------------------------------------------------------------
# BatchVideoGenerator
# ---------------------------------------------------------------------------

class BatchVideoGenerator:
    """Orchestrates sequential video generation from a queue of tasks."""

    def __init__(self, config: BatchConfig | None = None) -> None:
        self._config = config or BatchConfig()
        self._logger = logging.getLogger("batch_generate")
        self._results: list[BatchResult] = []

    # -- public properties --------------------------------------------------

    @property
    def config(self) -> BatchConfig:
        return self._config

    # -- public entry points ------------------------------------------------

    def run_from_db(
        self,
        limit: int | None = None,
        types: list[str] | None = None,
    ) -> list[BatchResult]:
        """Run batch generation from the database queue."""
        self._setup_logging()
        self._recover_stale_tasks()

        tasks = self._get_pending_tasks(limit=limit, types=types)
        if not tasks:
            self._logger.info("No pending tasks found in database.")
            return []

        self._logger.info("Found %d pending task(s).", len(tasks))
        return self._process_tasks(tasks)

    def run_from_json(self, json_path: str) -> list[BatchResult]:
        """Run batch generation from a JSON file."""
        self._setup_logging()

        path = Path(json_path)
        if not path.exists():
            self._logger.error("JSON file not found: %s", json_path)
            return []

        with open(path, "r", encoding="utf-8") as fh:
            raw_tasks = json.load(fh)

        tasks = [
            {
                "id": idx,
                "title": t["title"],
                "script": t["script"],
                "summary": t.get("summary", ""),
            }
            for idx, t in enumerate(raw_tasks, start=1)
        ]

        self._logger.info(
            "Loaded %d task(s) from %s.", len(tasks), json_path,
        )
        return self._process_tasks(tasks, from_db=False)

    def run_single(self, task: dict) -> BatchResult:
        """Generate a single video from a task dict."""
        self._setup_logging()
        return self._execute_task(task, video_num=1, from_db=False)

    def get_progress(self) -> dict:
        """Return progress counters from the most recent run."""
        total = len(self._results)
        completed = sum(1 for r in self._results if r.status == "success")
        failed = sum(1 for r in self._results if r.status == "failed")
        skipped = sum(1 for r in self._results if r.status == "skipped")
        return {
            "total": total,
            "completed": completed,
            "failed": failed,
            "skipped": skipped,
            "remaining": total - completed - failed - skipped,
        }

    def print_summary(self, results: list[BatchResult]) -> None:
        """Print a human-readable summary of batch results."""
        completed = sum(1 for r in results if r.status == "success")
        failed = sum(1 for r in results if r.status == "failed")
        skipped = sum(1 for r in results if r.status == "skipped")
        total_time = sum(r.duration_seconds for r in results)

        lines = [
            "",
            "=" * 60,
            f"BATCH SUMMARY: {completed} success, {failed} failed, "
            f"{skipped} skipped / {len(results)} total",
            f"Total time: {total_time:.1f}s",
            "=" * 60,
        ]

        for r in results:
            tag = {
                "success": "OK",
                "failed": "FAIL",
                "skipped": "SKIP",
            }.get(r.status, "???")
            detail = r.file_path or r.error or ""
            lines.append(
                f"  [{tag}] #{r.task_id}: {r.title}"
                + (f" ({detail})" if detail else ""),
            )

        lines.append("=" * 60)
        output = "\n".join(lines)

        self._logger.info(output)
        print(output)

    # -- DB operations (raw sqlite3) ----------------------------------------

    def _get_pending_tasks(
        self,
        limit: int | None = None,
        types: list[str] | None = None,
    ) -> list[dict]:
        """Read pending tasks from the database."""
        conn = sqlite3.connect(str(self._config.db_path))
        conn.row_factory = sqlite3.Row
        try:
            query = (
                "SELECT id, title, summary, script "
                "FROM videos WHERE status = 'planned' "
            )
            params: list = []

            if types:
                placeholders = ",".join("?" for _ in types)
                like_clauses = " OR ".join(
                    "title LIKE ?" for _ in types
                )
                query += f" AND ({like_clauses})"
                params.extend(f"%{t}%" for t in types)

            query += " ORDER BY id ASC"

            if limit is not None and limit > 0:
                query += " LIMIT ?"
                params.append(limit)

            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def _update_task_status(
        self,
        task_id: int,
        status: str,
        file_path: str | None = None,
        error: str | None = None,
    ) -> None:
        """Update the status of a task in the database."""
        conn = sqlite3.connect(str(self._config.db_path))
        try:
            now = datetime.now(timezone.utc).isoformat()

            if status == "processing":
                conn.execute(
                    "UPDATE videos SET status = ?, assigned_at = ? "
                    "WHERE id = ?",
                    (status, now, task_id),
                )
            elif status == "downloaded":
                conn.execute(
                    "UPDATE videos SET status = ?, file_path = ?, "
                    "completed_at = ? WHERE id = ?",
                    (status, file_path, now, task_id),
                )
            elif status in ("planned", "failed"):
                # Failure path: increment retry_count, decide status
                conn.execute(
                    "UPDATE videos SET "
                    "  status = CASE "
                    "    WHEN retry_count + 1 < ? THEN 'planned' "
                    "    ELSE 'failed' "
                    "  END, "
                    "  retry_count = retry_count + 1, "
                    "  error_message = ? "
                    "WHERE id = ?",
                    (self._config.max_retries, error, task_id),
                )
            else:
                conn.execute(
                    "UPDATE videos SET status = ? WHERE id = ?",
                    (status, task_id),
                )

            conn.commit()
        finally:
            conn.close()

    def _recover_stale_tasks(self) -> int:
        """Reset tasks stuck in 'processing' for too long."""
        conn = sqlite3.connect(str(self._config.db_path))
        try:
            timeout_sql = (
                f"-{self._config.stale_timeout_minutes} minutes"
            )
            cursor = conn.execute(
                "UPDATE videos SET "
                "  status = 'planned', "
                "  assigned_at = NULL, "
                "  error_message = 'Recovered from stale processing state' "
                "WHERE status = 'processing' "
                "  AND assigned_at < datetime('now', ?)",
                (timeout_sql,),
            )
            conn.commit()
            count = cursor.rowcount
            if count > 0:
                self._logger.info(
                    "Recovered %d stale task(s).", count,
                )
            return count
        finally:
            conn.close()

    # -- VM connectivity ----------------------------------------------------

    def _check_vm_ready(self) -> bool:
        """Ping the VM remote_control.py server."""
        url = (
            f"http://{self._config.vm_ip}:{self._config.vm_port}/status"
        )
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("status") == "running"
        except (urllib.error.URLError, OSError, ValueError) as exc:
            self._logger.error("VM not reachable: %s", exc)
            return False

    # -- video creation wrapper ---------------------------------------------

    def _create_video(
        self,
        title: str,
        script: str,
        suffix: str = "",
    ) -> tuple[bool, str]:
        """
        Call the core video-generation logic from create_video_on_vm.

        Returns (success, file_path_or_error).
        """
        try:
            # Import the generate_video function from the sibling module
            scripts_dir = Path(__file__).parent
            if str(scripts_dir) not in sys.path:
                sys.path.insert(0, str(scripts_dir))

            from create_video_on_vm import generate_video  # type: ignore

            success = generate_video(title=title, script=script)
            if success:
                return (True, f"{self._config.output_dir}/{title}.mp4")
            return (False, "generate_video returned False")
        except Exception as exc:
            return (False, str(exc))

    # -- orchestration helpers ----------------------------------------------

    def _process_tasks(
        self,
        tasks: list[dict],
        from_db: bool = True,
    ) -> list[BatchResult]:
        """Process a list of tasks sequentially."""
        if not self._check_vm_ready():
            self._logger.error(
                "VM is not reachable at %s:%d. Aborting.",
                self._config.vm_ip,
                self._config.vm_port,
            )
            return []

        self._results = []
        total = len(tasks)

        for idx, task in enumerate(tasks, start=1):
            self._logger.info(
                "--- Task %d/%d: [ID:%s] %s ---",
                idx,
                total,
                task.get("id", "?"),
                task.get("title", "untitled"),
            )

            result = self._execute_task(
                task, video_num=idx, from_db=from_db,
            )
            self._results.append(result)

            # Wait between videos (skip after last)
            if idx < total:
                self._wait_between_videos()

        self.print_summary(self._results)
        return self._results

    def _execute_task(
        self,
        task: dict,
        video_num: int = 1,
        from_db: bool = True,
    ) -> BatchResult:
        """Execute a single video generation task."""
        task_id = task.get("id", 0)
        title = task.get("title", "untitled")
        script = task.get("script", "")

        if from_db:
            self._update_task_status(task_id, "processing")

        start = time.time()
        try:
            success, detail = self._create_video(
                title=title, script=script,
            )
            duration = time.time() - start

            if success:
                self._logger.info(
                    "Task %d completed in %.1fs: %s",
                    task_id, duration, detail,
                )
                if from_db:
                    self._update_task_status(
                        task_id, "downloaded", file_path=detail,
                    )
                return BatchResult(
                    task_id=task_id,
                    title=title,
                    status="success",
                    file_path=detail,
                    duration_seconds=duration,
                )

            self._logger.warning(
                "Task %d failed after %.1fs: %s",
                task_id, duration, detail,
            )
            if from_db:
                self._update_task_status(
                    task_id, "failed", error=detail,
                )
            return BatchResult(
                task_id=task_id,
                title=title,
                status="failed",
                error=detail,
                duration_seconds=duration,
            )

        except Exception as exc:
            duration = time.time() - start
            error_msg = str(exc)
            self._logger.error(
                "Task %d raised exception after %.1fs: %s",
                task_id, duration, error_msg,
            )
            if from_db:
                self._update_task_status(
                    task_id, "failed", error=error_msg,
                )
            return BatchResult(
                task_id=task_id,
                title=title,
                status="failed",
                error=error_msg,
                duration_seconds=duration,
            )

    def _wait_between_videos(self) -> None:
        """Sleep between video generation attempts."""
        delay = self._config.delay_between_videos
        if delay > 0:
            self._logger.info(
                "Waiting %ds before next video...", delay,
            )
            time.sleep(delay)

    # -- logging setup ------------------------------------------------------

    def _setup_logging(self) -> None:
        """Configure file + console logging for the batch run."""
        if self._logger.handlers:
            return  # already configured

        self._config.log_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self._config.log_dir / f"batch_{timestamp}.log"

        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        file_handler = logging.FileHandler(
            str(log_file), encoding="utf-8",
        )
        file_handler.setFormatter(formatter)

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)

        self._logger.addHandler(file_handler)
        self._logger.addHandler(console_handler)
        self._logger.setLevel(logging.INFO)

        self._logger.info(
            "Batch log started: %s", log_file,
        )


# ---------------------------------------------------------------------------
# Status display
# ---------------------------------------------------------------------------

def show_db_status(db_path: Path) -> None:
    """Print current task counts from the database."""
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.execute(
            "SELECT status, COUNT(*) FROM videos GROUP BY status "
            "ORDER BY status",
        )
        rows = cursor.fetchall()
        print("\n=== Database Task Status ===")
        total = 0
        for status, count in rows:
            print(f"  {status:15s}: {count}")
            total += count
        print(f"  {'TOTAL':15s}: {total}")
        print()
    finally:
        conn.close()


def dry_run_tasks(
    generator: BatchVideoGenerator,
    limit: int | None = None,
    types: list[str] | None = None,
) -> list[dict]:
    """List pending tasks without processing them."""
    tasks = generator._get_pending_tasks(limit=limit, types=types)
    if not tasks:
        print("No pending tasks found.")
        return tasks

    print(f"\n=== Dry Run: {len(tasks)} pending task(s) ===\n")
    for t in tasks:
        script_preview = t.get("script", "")[:60]
        print(
            f"  [ID:{t['id']}] {t['title']}\n"
            f"          Script: {script_preview}...\n",
        )
    return tasks


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Batch Video Generation Orchestrator",
    )

    source = parser.add_mutually_exclusive_group()
    source.add_argument(
        "--from-db",
        action="store_true",
        help="Read pending tasks from the database",
    )
    source.add_argument(
        "--from-json",
        type=str,
        help="Read tasks from a JSON file",
    )
    source.add_argument(
        "--status",
        action="store_true",
        help="Show current database task status and exit",
    )

    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=None,
        help="Maximum number of tasks to process",
    )
    parser.add_argument(
        "--type", "-t",
        type=str,
        action="append",
        dest="types",
        help="Filter tasks by MBTI type (can be repeated)",
    )
    parser.add_argument(
        "--delay",
        type=int,
        default=30,
        help="Seconds to wait between videos (default: 30)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Max retry count per task (default: 3)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List pending tasks without processing",
    )
    parser.add_argument(
        "--vm-ip",
        type=str,
        default="10.0.0.13",
        help="VM IP address",
    )
    parser.add_argument(
        "--vm-port",
        type=int,
        default=8888,
        help="VM remote_control.py port",
    )

    return parser


def main() -> int:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args()

    config = BatchConfig(
        vm_ip=args.vm_ip,
        vm_port=args.vm_port,
        delay_between_videos=args.delay,
        max_retries=args.max_retries,
    )

    if args.status:
        show_db_status(config.db_path)
        return 0

    generator = BatchVideoGenerator(config=config)

    if args.dry_run:
        dry_run_tasks(
            generator, limit=args.limit, types=args.types,
        )
        return 0

    if args.from_json:
        results = generator.run_from_json(args.from_json)
    elif args.from_db:
        results = generator.run_from_db(
            limit=args.limit, types=args.types,
        )
    else:
        parser.print_help()
        print("\nExamples:")
        print("  python scripts/batch_generate.py --from-db --limit 5")
        print(
            "  python scripts/batch_generate.py --from-json "
            "scripts/test_intj.json",
        )
        print("  python scripts/batch_generate.py --from-db --dry-run")
        print("  python scripts/batch_generate.py --status")
        return 0

    failed = sum(1 for r in results if r.status == "failed")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
