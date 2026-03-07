"""
AutoVideoGen 統合パイプライン

テーマ入力から動画アップロードまでのエンドツーエンド自動化。

Usage:
    # フルパイプライン: 台本生成 → 動画生成 → アップロード
    python scripts/pipeline.py --theme "猫の飼い方" --full

    # 台本生成のみ
    python scripts/pipeline.py --theme "プログラミング入門" --step generate

    # 複数台本を生成
    python scripts/pipeline.py --theme "投資の基本" --step generate --count 3

    # 動画生成のみ（DB内のplannedタスクから）
    python scripts/pipeline.py --step video --limit 3

    # アップロードのみ（DB内のdownloadedタスクから）
    python scripts/pipeline.py --step upload --platform youtube

    # ドライラン（実行せずに計画を表示）
    python scripts/pipeline.py --theme "料理のコツ" --full --dry-run

    # テーマ一覧ファイルからバッチ生成
    python scripts/pipeline.py --batch-file themes.txt --full
"""

import argparse
import json
import logging
import sqlite3
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pipeline")

DB_PATH = Path(__file__).parent.parent / "database.db"
LOG_DIR = Path(__file__).parent.parent / "logs"


@dataclass(frozen=True)
class PipelineConfig:
    """Pipeline configuration."""
    db_path: Path = DB_PATH
    log_dir: Path = LOG_DIR

    # AI script generation
    ai_model: str = "claude-haiku-4-5-20250929"

    # Video generation
    vm_ip: str = "10.0.0.13"
    vm_port: int = 8888
    delay_between_videos: int = 30
    max_retries: int = 3

    # Upload
    upload_platform: str = "youtube"
    max_uploads_per_day: int = 6
    delay_between_uploads: int = 10


@dataclass
class StepResult:
    """Result of each pipeline step."""
    step: str
    success: bool
    count: int = 0
    errors: int = 0
    details: list = field(default_factory=list)
    duration_seconds: float = 0.0


def get_db_stats(db_path: Path) -> dict:
    """Get current database status."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    stats = {}
    for status in ["planned", "processing", "downloaded", "uploaded", "failed"]:
        cursor.execute(
            "SELECT COUNT(*) FROM videos WHERE status = ?", (status,)
        )
        stats[status] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM videos")
    stats["total"] = cursor.fetchone()[0]

    conn.close()
    return stats


def print_status(config: PipelineConfig) -> None:
    """Print current pipeline status."""
    stats = get_db_stats(config.db_path)
    print("\n" + "=" * 50)
    print("AutoVideoGen Pipeline Status")
    print("=" * 50)
    print(f"  Planned (待機中):     {stats.get('planned', 0)}")
    print(f"  Processing (処理中):  {stats.get('processing', 0)}")
    print(f"  Downloaded (完了):    {stats.get('downloaded', 0)}")
    print(f"  Uploaded (公開済み):  {stats.get('uploaded', 0)}")
    print(f"  Failed (失敗):       {stats.get('failed', 0)}")
    print(f"  Total:               {stats.get('total', 0)}")
    print("=" * 50)


def step_generate_scripts(
    theme: str,
    count: int = 1,
    config: PipelineConfig = PipelineConfig(),
    dry_run: bool = False,
) -> StepResult:
    """Step 1: AI script generation from theme."""
    start = time.time()
    logger.info("Step 1: AI台本生成を開始 (theme=%s, count=%d)", theme, count)

    sys.path.insert(0, str(Path(__file__).parent))

    try:
        from ai_script_generator import AIScriptGenerator, save_to_database

        generator = AIScriptGenerator(model=config.ai_model)

        if dry_run:
            logger.info(
                "  [DRY RUN] Would generate %d script(s) for theme: %s",
                count,
                theme,
            )
            return StepResult(
                step="generate",
                success=True,
                count=count,
                duration_seconds=time.time() - start,
            )

        scripts = generator.generate_multiple(theme=theme, count=count)

    except ImportError as exc:
        logger.error("AI generator not available: %s", exc)
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )
    except Exception as exc:
        logger.error("AI generation failed: %s", exc)
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )

    if not scripts:
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )

    task_ids = save_to_database(scripts, config.db_path)
    logger.info("  %d script(s) saved to database", len(task_ids))

    for s in scripts:
        logger.info("  - %s (%d chars)", s["title"][:60], len(s["script"]))

    return StepResult(
        step="generate",
        success=True,
        count=len(scripts),
        details=[
            {"title": s["title"], "chars": len(s["script"])} for s in scripts
        ],
        duration_seconds=time.time() - start,
    )


def step_generate_scripts_batch(
    themes: list[str],
    count_per_theme: int = 1,
    config: PipelineConfig = PipelineConfig(),
    dry_run: bool = False,
) -> StepResult:
    """Step 1 (batch): Generate scripts for multiple themes."""
    start = time.time()
    total = len(themes) * count_per_theme
    logger.info(
        "Step 1: バッチ台本生成を開始 (%d themes x %d = %d scripts)",
        len(themes),
        count_per_theme,
        total,
    )

    sys.path.insert(0, str(Path(__file__).parent))

    try:
        from ai_script_generator import AIScriptGenerator, save_to_database

        generator = AIScriptGenerator(model=config.ai_model)

        if dry_run:
            logger.info("  [DRY RUN] Would generate %d script(s)", total)
            for t in themes:
                logger.info("  - %s", t[:50])
            return StepResult(
                step="generate",
                success=True,
                count=total,
                duration_seconds=time.time() - start,
            )

        scripts = generator.generate_batch(
            themes=themes, count_per_theme=count_per_theme
        )

    except ImportError as exc:
        logger.error("AI generator not available: %s", exc)
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )
    except Exception as exc:
        logger.error("AI generation failed: %s", exc)
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )

    if not scripts:
        return StepResult(
            step="generate", success=False, errors=1,
            duration_seconds=time.time() - start,
        )

    task_ids = save_to_database(scripts, config.db_path)
    logger.info("  %d script(s) saved to database", len(task_ids))

    return StepResult(
        step="generate",
        success=True,
        count=len(scripts),
        details=[
            {"title": s["title"], "chars": len(s["script"])} for s in scripts
        ],
        duration_seconds=time.time() - start,
    )


def step_generate_videos(
    config: PipelineConfig = PipelineConfig(),
    limit: Optional[int] = None,
    dry_run: bool = False,
) -> StepResult:
    """Step 2: Batch video generation."""
    start = time.time()
    logger.info("Step 2: バッチ動画生成を開始")

    try:
        from batch_generate import BatchVideoGenerator, BatchConfig

        batch_config = BatchConfig(
            vm_ip=config.vm_ip,
            vm_port=config.vm_port,
            db_path=config.db_path,
            max_retries=config.max_retries,
            delay_between_videos=config.delay_between_videos,
        )
        generator = BatchVideoGenerator(config=batch_config)

        if dry_run:
            tasks = generator._get_pending_tasks(limit=limit)
            logger.info("  [DRY RUN] Would process %d video(s)", len(tasks))
            for t in tasks:
                logger.info("  - [%s] %s", t["id"], t["title"][:50])
            return StepResult(
                step="video",
                success=True,
                count=len(tasks),
                duration_seconds=time.time() - start,
            )

        results = generator.run_from_db(limit=limit)
        generator.print_summary(results)

        success_count = sum(1 for r in results if r.status == "success")
        fail_count = sum(1 for r in results if r.status == "failed")

        return StepResult(
            step="video",
            success=fail_count == 0,
            count=success_count,
            errors=fail_count,
            duration_seconds=time.time() - start,
        )

    except ImportError as exc:
        logger.error("batch_generate module not available: %s", exc)
        return StepResult(
            step="video", success=False, errors=1,
            duration_seconds=time.time() - start,
        )


def step_upload_videos(
    config: PipelineConfig = PipelineConfig(),
    platform: str = "youtube",
    limit: Optional[int] = None,
    dry_run: bool = False,
) -> StepResult:
    """Step 3: Video upload."""
    start = time.time()
    logger.info("Step 3: 動画アップロードを開始 (platform=%s)", platform)

    try:
        from video_uploader import VideoUploader, UploadConfig, Platform

        upload_config = UploadConfig(
            db_path=config.db_path,
            max_uploads_per_day=config.max_uploads_per_day,
            delay_between_uploads=config.delay_between_uploads,
        )
        uploader = VideoUploader(config=upload_config)

        platform_enum = Platform(platform)

        if dry_run:
            tasks = uploader._get_downloaded_tasks(limit=limit)
            logger.info(
                "  [DRY RUN] Would upload %d video(s) to %s",
                len(tasks),
                platform,
            )
            for t in tasks:
                logger.info("  - [%s] %s", t["id"], t["title"][:50])
            return StepResult(
                step="upload",
                success=True,
                count=len(tasks),
                duration_seconds=time.time() - start,
            )

        results = uploader.upload_from_db(
            platform=platform_enum, limit=limit
        )
        uploader.print_summary(results)

        success_count = sum(1 for r in results if r.success)
        fail_count = sum(1 for r in results if not r.success)

        return StepResult(
            step="upload",
            success=fail_count == 0,
            count=success_count,
            errors=fail_count,
            duration_seconds=time.time() - start,
        )

    except ImportError as exc:
        logger.error("video_uploader module not available: %s", exc)
        return StepResult(
            step="upload", success=False, errors=1,
            duration_seconds=time.time() - start,
        )


def run_full_pipeline(
    theme: str,
    count: int = 1,
    config: PipelineConfig = PipelineConfig(),
    limit: Optional[int] = None,
    dry_run: bool = False,
) -> list[StepResult]:
    """Full pipeline: script generation -> video generation -> upload."""
    logger.info("=" * 60)
    logger.info("AutoVideoGen Full Pipeline")
    logger.info("  Theme: %s", theme)
    logger.info("  Count: %d", count)
    logger.info("  Platform: %s", config.upload_platform)
    logger.info("  Dry Run: %s", dry_run)
    logger.info("=" * 60)

    results = []

    # Step 1: Script generation
    gen_result = step_generate_scripts(
        theme=theme,
        count=count,
        config=config,
        dry_run=dry_run,
    )
    results.append(gen_result)
    logger.info(
        "  Step 1 完了: %d scripts, %.1fs",
        gen_result.count,
        gen_result.duration_seconds,
    )

    if not gen_result.success:
        logger.error("  台本生成に失敗。パイプラインを中断します。")
        return results

    # Step 2: Video generation
    video_result = step_generate_videos(
        config=config,
        limit=limit or gen_result.count,
        dry_run=dry_run,
    )
    results.append(video_result)
    logger.info(
        "  Step 2 完了: %d videos, %.1fs",
        video_result.count,
        video_result.duration_seconds,
    )

    if not video_result.success and video_result.count == 0:
        logger.error("  動画生成に失敗。アップロードをスキップします。")
        return results

    # Step 3: Upload
    upload_result = step_upload_videos(
        config=config,
        platform=config.upload_platform,
        limit=limit,
        dry_run=dry_run,
    )
    results.append(upload_result)
    logger.info(
        "  Step 3 完了: %d uploads, %.1fs",
        upload_result.count,
        upload_result.duration_seconds,
    )

    # Summary
    total_time = sum(r.duration_seconds for r in results)
    total_errors = sum(r.errors for r in results)

    logger.info("\n" + "=" * 60)
    logger.info("Pipeline Summary")
    logger.info("=" * 60)
    for r in results:
        status_icon = "OK" if r.success else "FAIL"
        logger.info(
            "  [%s] %s: %d items, %d errors, %.1fs",
            status_icon,
            r.step,
            r.count,
            r.errors,
            r.duration_seconds,
        )
    logger.info("  Total: %.1fs, %d errors", total_time, total_errors)
    logger.info("=" * 60)

    return results


def main():
    parser = argparse.ArgumentParser(
        description="AutoVideoGen 統合パイプライン",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # フルパイプライン
  python scripts/pipeline.py --theme "猫の飼い方" --full

  # 台本生成のみ（3本）
  python scripts/pipeline.py --theme "プログラミング入門" --step generate --count 3

  # バッチファイルから生成
  python scripts/pipeline.py --batch-file themes.txt --step generate

  # 動画生成のみ
  python scripts/pipeline.py --step video --limit 3

  # アップロードのみ
  python scripts/pipeline.py --step upload --platform youtube

  # ステータス確認
  python scripts/pipeline.py --status

  # ドライラン
  python scripts/pipeline.py --theme "投資入門" --full --dry-run
        """,
    )

    parser.add_argument(
        "--theme", "-t",
        help="テーマ（例: 猫の飼い方, プログラミング入門）",
    )
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=1,
        help="テーマあたりの台本生成数 (default: 1)",
    )
    parser.add_argument(
        "--batch-file",
        help="テーマ一覧ファイル（1行1テーマ）",
    )
    parser.add_argument(
        "--step", "-s",
        choices=["generate", "video", "upload"],
        help="特定ステップのみ実行",
    )
    parser.add_argument("--full", action="store_true", help="フルパイプライン実行")
    parser.add_argument("--limit", "-l", type=int, help="処理数の上限")
    parser.add_argument(
        "--platform", "-p",
        choices=["youtube", "tiktok", "both"],
        default="youtube",
        help="アップロード先 (default: youtube)",
    )
    parser.add_argument("--dry-run", action="store_true", help="ドライラン")
    parser.add_argument("--status", action="store_true", help="現在のステータス表示")
    parser.add_argument("--vm-ip", default="10.0.0.13", help="VM IPアドレス")
    parser.add_argument("--vm-port", type=int, default=8888, help="VMポート")

    args = parser.parse_args()

    config = PipelineConfig(
        vm_ip=args.vm_ip,
        vm_port=args.vm_port,
        upload_platform=args.platform,
    )

    # Status display
    if args.status:
        print_status(config)
        return 0

    # Full pipeline
    if args.full:
        if args.batch_file:
            themes_path = Path(args.batch_file)
            if not themes_path.exists():
                print(f"Error: batch file not found: {args.batch_file}")
                return 1
            themes = [
                line.strip()
                for line in themes_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            # For batch full pipeline, run generate then video+upload
            gen_result = step_generate_scripts_batch(
                themes=themes,
                count_per_theme=args.count,
                config=config,
                dry_run=args.dry_run,
            )
            if not gen_result.success:
                return 1
            step_generate_videos(
                config=config, limit=args.limit, dry_run=args.dry_run
            )
            step_upload_videos(
                config=config,
                platform=args.platform,
                limit=args.limit,
                dry_run=args.dry_run,
            )
            return 0

        if not args.theme:
            print("Error: --theme or --batch-file is required for full pipeline")
            return 1

        results = run_full_pipeline(
            theme=args.theme,
            count=args.count,
            config=config,
            limit=args.limit,
            dry_run=args.dry_run,
        )
        return 0 if all(r.success for r in results) else 1

    # Individual steps
    if args.step == "generate":
        if args.batch_file:
            themes_path = Path(args.batch_file)
            if not themes_path.exists():
                print(f"Error: batch file not found: {args.batch_file}")
                return 1
            themes = [
                line.strip()
                for line in themes_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            result = step_generate_scripts_batch(
                themes=themes,
                count_per_theme=args.count,
                config=config,
                dry_run=args.dry_run,
            )
            return 0 if result.success else 1

        if not args.theme:
            print("Error: --theme or --batch-file is required for generate step")
            return 1
        result = step_generate_scripts(
            theme=args.theme,
            count=args.count,
            config=config,
            dry_run=args.dry_run,
        )
        return 0 if result.success else 1

    if args.step == "video":
        result = step_generate_videos(
            config=config,
            limit=args.limit,
            dry_run=args.dry_run,
        )
        return 0 if result.success else 1

    if args.step == "upload":
        result = step_upload_videos(
            config=config,
            platform=args.platform,
            limit=args.limit,
            dry_run=args.dry_run,
        )
        return 0 if result.success else 1

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
