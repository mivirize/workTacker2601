"""
Tests for batch_generate.py

Covers:
- BatchConfig defaults
- DB task reading (with limit, type filter)
- Task status updates (success, retry, final failure)
- Single and JSON-based runs
- VM readiness checks
- Resume behaviour
- Dry-run mode
- Summary output
"""

from __future__ import annotations

import json
import sqlite3
import sys
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure the scripts directory is importable
SCRIPTS_DIR = str(Path(__file__).resolve().parent.parent / "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from batch_generate import (  # noqa: E402
    BatchConfig,
    BatchResult,
    BatchVideoGenerator,
    dry_run_tasks,
    show_db_status,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_test_db(db_path: Path, tasks: list[dict] | None = None) -> None:
    """Create a minimal test database with the videos table."""
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            summary TEXT,
            script TEXT,
            status TEXT DEFAULT 'planned',
            file_path TEXT,
            created_at TEXT,
            assigned_worker_id TEXT,
            assigned_at TEXT,
            completed_at TEXT,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            error_message TEXT,
            lock_version INTEGER DEFAULT 0
        )
        """
    )

    if tasks:
        for t in tasks:
            conn.execute(
                "INSERT INTO videos (title, summary, script, status, "
                "retry_count, assigned_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    t.get("title", "test"),
                    t.get("summary", ""),
                    t.get("script", "test script"),
                    t.get("status", "planned"),
                    t.get("retry_count", 0),
                    t.get("assigned_at"),
                ),
            )

    conn.commit()
    conn.close()


def _make_config(tmp_path: Path, **overrides) -> BatchConfig:
    """Create a BatchConfig pointing at a temporary database."""
    defaults = {
        "db_path": tmp_path / "test.db",
        "log_dir": tmp_path / "logs",
        "delay_between_videos": 0,
        "max_retries": 3,
    }
    defaults.update(overrides)
    return BatchConfig(**defaults)


# ---------------------------------------------------------------------------
# 1. test_batch_config_defaults
# ---------------------------------------------------------------------------

def test_batch_config_defaults():
    """Verify that BatchConfig has sensible defaults."""
    cfg = BatchConfig()

    assert cfg.vm_ip == "10.0.0.13"
    assert cfg.vm_port == 8888
    assert cfg.cdp_port == 9222
    assert cfg.max_retries == 3
    assert cfg.delay_between_videos == 30
    assert cfg.stale_timeout_minutes == 30
    assert isinstance(cfg.db_path, Path)
    assert isinstance(cfg.log_dir, Path)


# ---------------------------------------------------------------------------
# 2. test_get_pending_tasks_from_db
# ---------------------------------------------------------------------------

def test_get_pending_tasks_from_db(tmp_path: Path):
    """Pending tasks are read from the database in id order."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {"title": "Video A", "script": "script a", "status": "planned"},
            {"title": "Video B", "script": "script b", "status": "planned"},
            {"title": "Video C", "script": "script c", "status": "downloaded"},
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)
    tasks = gen._get_pending_tasks(limit=None, types=None)

    assert len(tasks) == 2
    assert tasks[0]["title"] == "Video A"
    assert tasks[1]["title"] == "Video B"
    assert all("id" in t and "script" in t for t in tasks)


# ---------------------------------------------------------------------------
# 3. test_get_pending_tasks_with_limit
# ---------------------------------------------------------------------------

def test_get_pending_tasks_with_limit(tmp_path: Path):
    """LIMIT clause restricts the number of returned tasks."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {"title": f"Video {i}", "script": f"s{i}", "status": "planned"}
            for i in range(10)
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)
    tasks = gen._get_pending_tasks(limit=3, types=None)

    assert len(tasks) == 3


# ---------------------------------------------------------------------------
# 4. test_get_pending_tasks_with_type_filter
# ---------------------------------------------------------------------------

def test_get_pending_tasks_with_type_filter(tmp_path: Path):
    """Type filter returns only matching titles."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {"title": "INTJ personality", "script": "s1", "status": "planned"},
            {"title": "ENFP love", "script": "s2", "status": "planned"},
            {"title": "INTJ stress", "script": "s3", "status": "planned"},
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)
    tasks = gen._get_pending_tasks(limit=None, types=["INTJ"])

    assert len(tasks) == 2
    assert all("INTJ" in t["title"] for t in tasks)


# ---------------------------------------------------------------------------
# 5. test_update_task_status_success
# ---------------------------------------------------------------------------

def test_update_task_status_success(tmp_path: Path):
    """Successful completion sets status='downloaded' and file_path."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[{"title": "Vid", "script": "s", "status": "processing"}],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)
    gen._update_task_status(1, "downloaded", file_path="/output/vid.mp4")

    conn = sqlite3.connect(str(db_path))
    row = conn.execute(
        "SELECT status, file_path FROM videos WHERE id = 1",
    ).fetchone()
    conn.close()

    assert row[0] == "downloaded"
    assert row[1] == "/output/vid.mp4"


# ---------------------------------------------------------------------------
# 6. test_update_task_status_failure_retry
# ---------------------------------------------------------------------------

def test_update_task_status_failure_retry(tmp_path: Path):
    """Failure with retry_count < max_retries resets status to 'planned'."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {
                "title": "Vid",
                "script": "s",
                "status": "processing",
                "retry_count": 0,
            },
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path, max_retries=3)
    gen = BatchVideoGenerator(config=cfg)
    gen._update_task_status(1, "failed", error="timeout")

    conn = sqlite3.connect(str(db_path))
    row = conn.execute(
        "SELECT status, retry_count, error_message FROM videos WHERE id = 1",
    ).fetchone()
    conn.close()

    assert row[0] == "planned"  # retryable
    assert row[1] == 1
    assert row[2] == "timeout"


# ---------------------------------------------------------------------------
# 7. test_update_task_status_failure_final
# ---------------------------------------------------------------------------

def test_update_task_status_failure_final(tmp_path: Path):
    """Failure when retry_count >= max_retries sets status to 'failed'."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {
                "title": "Vid",
                "script": "s",
                "status": "processing",
                "retry_count": 2,
            },
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path, max_retries=3)
    gen = BatchVideoGenerator(config=cfg)
    gen._update_task_status(1, "failed", error="permanent error")

    conn = sqlite3.connect(str(db_path))
    row = conn.execute(
        "SELECT status, retry_count, error_message FROM videos WHERE id = 1",
    ).fetchone()
    conn.close()

    # retry_count was 2, +1 = 3.  3 < 3 is False => 'failed'
    assert row[0] == "failed"
    assert row[1] == 3
    assert row[2] == "permanent error"


# ---------------------------------------------------------------------------
# 8. test_run_single_success
# ---------------------------------------------------------------------------

def test_run_single_success(tmp_path: Path):
    """run_single returns a success BatchResult when create_video succeeds."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)

    with patch.object(
        gen, "_create_video", return_value=(True, "/output/vid.mp4"),
    ), patch.object(gen, "_check_vm_ready", return_value=True), \
         patch.object(gen, "_setup_logging"):

        result = gen.run_single(
            {"id": 42, "title": "Test Video", "script": "hello"},
        )

    assert isinstance(result, BatchResult)
    assert result.task_id == 42
    assert result.status == "success"
    assert result.file_path == "/output/vid.mp4"
    assert result.error is None
    assert result.duration_seconds >= 0


# ---------------------------------------------------------------------------
# 9. test_run_single_failure
# ---------------------------------------------------------------------------

def test_run_single_failure(tmp_path: Path):
    """run_single returns a failed BatchResult when create_video fails."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)

    with patch.object(
        gen, "_create_video", return_value=(False, "Vrew crashed"),
    ), patch.object(gen, "_check_vm_ready", return_value=True), \
         patch.object(gen, "_setup_logging"):

        result = gen.run_single(
            {"id": 99, "title": "Bad Video", "script": "fail"},
        )

    assert result.status == "failed"
    assert result.error == "Vrew crashed"


# ---------------------------------------------------------------------------
# 10. test_run_from_json
# ---------------------------------------------------------------------------

def test_run_from_json(tmp_path: Path):
    """run_from_json reads a JSON file and processes tasks sequentially."""
    json_path = tmp_path / "tasks.json"
    json_path.write_text(
        json.dumps([
            {"title": "Video 1", "script": "script 1"},
            {"title": "Video 2", "script": "script 2"},
        ]),
        encoding="utf-8",
    )

    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)

    call_order = []

    def fake_create(title, script, suffix=""):
        call_order.append(title)
        return (True, f"/out/{title}.mp4")

    with patch.object(gen, "_create_video", side_effect=fake_create), \
         patch.object(gen, "_check_vm_ready", return_value=True):

        results = gen.run_from_json(str(json_path))

    assert len(results) == 2
    assert results[0].status == "success"
    assert results[1].status == "success"
    assert call_order == ["Video 1", "Video 2"]


# ---------------------------------------------------------------------------
# 11. test_check_vm_ready_success
# ---------------------------------------------------------------------------

def test_check_vm_ready_success(tmp_path: Path):
    """_check_vm_ready returns True when the VM responds correctly."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)

    mock_response = MagicMock()
    mock_response.read.return_value = json.dumps(
        {"status": "running"},
    ).encode("utf-8")
    mock_response.__enter__ = lambda s: s
    mock_response.__exit__ = MagicMock(return_value=False)

    with patch("batch_generate.urllib.request.urlopen", return_value=mock_response):
        assert gen._check_vm_ready() is True


# ---------------------------------------------------------------------------
# 12. test_check_vm_ready_failure
# ---------------------------------------------------------------------------

def test_check_vm_ready_failure(tmp_path: Path):
    """_check_vm_ready returns False on connection timeout."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)
    # Suppress log output during test
    gen._logger = MagicMock()

    with patch(
        "batch_generate.urllib.request.urlopen",
        side_effect=OSError("Connection refused"),
    ):
        assert gen._check_vm_ready() is False


# ---------------------------------------------------------------------------
# 13. test_resume_skips_completed
# ---------------------------------------------------------------------------

def test_resume_skips_completed(tmp_path: Path):
    """Only 'planned' tasks are picked up; 'downloaded' tasks are skipped."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {"title": "Done", "script": "s1", "status": "downloaded"},
            {"title": "Failed", "script": "s2", "status": "failed"},
            {"title": "Processing", "script": "s3", "status": "processing"},
            {"title": "Pending", "script": "s4", "status": "planned"},
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)
    tasks = gen._get_pending_tasks(limit=None, types=None)

    assert len(tasks) == 1
    assert tasks[0]["title"] == "Pending"


# ---------------------------------------------------------------------------
# 14. test_dry_run
# ---------------------------------------------------------------------------

def test_dry_run(tmp_path: Path, capsys):
    """Dry run lists tasks without calling create_video."""
    db_path = tmp_path / "test.db"
    _create_test_db(
        db_path,
        tasks=[
            {"title": "Video X", "script": "sx", "status": "planned"},
            {"title": "Video Y", "script": "sy", "status": "planned"},
        ],
    )

    cfg = _make_config(tmp_path, db_path=db_path)
    gen = BatchVideoGenerator(config=cfg)

    with patch.object(gen, "_create_video") as mock_create:
        result = dry_run_tasks(gen, limit=None, types=None)

    # create_video should never be called in dry-run mode
    mock_create.assert_not_called()
    assert len(result) == 2

    captured = capsys.readouterr()
    assert "Video X" in captured.out
    assert "Video Y" in captured.out
    assert "Dry Run" in captured.out


# ---------------------------------------------------------------------------
# 15. test_print_summary
# ---------------------------------------------------------------------------

def test_print_summary(tmp_path: Path, capsys):
    """print_summary produces correctly formatted output."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)
    # Suppress file logging
    gen._logger = logging.getLogger("test_summary")
    gen._logger.addHandler(logging.NullHandler())

    results = [
        BatchResult(
            task_id=1, title="Good Video", status="success",
            file_path="/out/good.mp4", duration_seconds=120.5,
        ),
        BatchResult(
            task_id=2, title="Bad Video", status="failed",
            error="timeout", duration_seconds=60.0,
        ),
        BatchResult(
            task_id=3, title="Skip Video", status="skipped",
            duration_seconds=0.0,
        ),
    ]

    gen.print_summary(results)
    captured = capsys.readouterr()

    assert "1 success" in captured.out
    assert "1 failed" in captured.out
    assert "1 skipped" in captured.out
    assert "[OK]" in captured.out
    assert "[FAIL]" in captured.out
    assert "[SKIP]" in captured.out
    assert "Good Video" in captured.out
    assert "Bad Video" in captured.out
    assert "Total time:" in captured.out


# ---------------------------------------------------------------------------
# Additional edge-case tests
# ---------------------------------------------------------------------------

def test_recover_stale_tasks(tmp_path: Path):
    """Stale processing tasks are recovered to planned status."""
    db_path = tmp_path / "test.db"
    stale_time = (
        datetime.now(timezone.utc) - timedelta(minutes=60)
    ).strftime("%Y-%m-%d %H:%M:%S")

    _create_test_db(
        db_path,
        tasks=[
            {
                "title": "Stale task",
                "script": "s",
                "status": "processing",
                "assigned_at": stale_time,
            },
        ],
    )

    cfg = _make_config(
        tmp_path, db_path=db_path, stale_timeout_minutes=30,
    )
    gen = BatchVideoGenerator(config=cfg)
    recovered = gen._recover_stale_tasks()

    assert recovered == 1

    conn = sqlite3.connect(str(db_path))
    row = conn.execute(
        "SELECT status FROM videos WHERE id = 1",
    ).fetchone()
    conn.close()

    assert row[0] == "planned"


def test_get_progress(tmp_path: Path):
    """get_progress returns correct counters after a run."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)
    gen._results = [
        BatchResult(task_id=1, title="a", status="success",
                    duration_seconds=10),
        BatchResult(task_id=2, title="b", status="failed",
                    error="err", duration_seconds=5),
        BatchResult(task_id=3, title="c", status="success",
                    duration_seconds=8),
    ]

    progress = gen.get_progress()
    assert progress["total"] == 3
    assert progress["completed"] == 2
    assert progress["failed"] == 1
    assert progress["skipped"] == 0


def test_run_from_json_file_not_found(tmp_path: Path):
    """run_from_json returns empty list for non-existent file."""
    cfg = _make_config(tmp_path)
    gen = BatchVideoGenerator(config=cfg)
    gen._logger = MagicMock()

    results = gen.run_from_json(str(tmp_path / "nonexistent.json"))
    assert results == []


# Need logging import for test_print_summary
import logging  # noqa: E402
