"""
Multi-platform video uploader for YouTube Shorts and TikTok.

Reads completed video tasks from the SQLite database and uploads them
to YouTube Shorts and/or TikTok with auto-generated metadata.

Usage:
    # YouTube only
    python scripts/video_uploader.py --platform youtube --limit 3

    # TikTok only
    python scripts/video_uploader.py --platform tiktok --limit 3

    # Both platforms
    python scripts/video_uploader.py --platform both --limit 3

    # Single task
    python scripts/video_uploader.py --task-id 5 --platform youtube

    # Upload specific file (not from DB)
    python scripts/video_uploader.py --file video.mp4 --title "Test" --platform youtube

    # Status
    python scripts/video_uploader.py --status

    # YouTube auth setup
    python scripts/video_uploader.py --youtube-auth

Dependencies (not auto-installed):
    google-api-python-client
    google-auth-oauthlib
    google-auth-httplib2
    tiktok-uploader
"""

import argparse
import json
import logging
import os
import sqlite3
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional

# Load .env file if it exists
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(env_path)
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("video_uploader")


# ---------------------------------------------------------------------------
# Enums & Data Classes
# ---------------------------------------------------------------------------

class Platform(Enum):
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    BOTH = "both"


@dataclass(frozen=True)
class UploadConfig:
    db_path: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent / "database.db"
    )
    youtube_client_secrets: str = "client_secrets.json"
    youtube_token_path: str = "youtube_token.pickle"
    tiktok_session_id: str = ""
    default_privacy: str = "public"
    default_category_id: str = "22"  # People & Blogs
    shorts_tag: str = "#Shorts"
    delay_between_uploads: int = 10
    max_uploads_per_day: int = 6
    log_dir: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent / "logs"
    )


@dataclass(frozen=True)
class UploadResult:
    task_id: int
    platform: str
    success: bool
    video_id: Optional[str] = None
    url: Optional[str] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Default tags for Shorts uploads
# ---------------------------------------------------------------------------

DEFAULT_TAGS: list[str] = ["Shorts"]


# ---------------------------------------------------------------------------
# YouTube Uploader
# ---------------------------------------------------------------------------

class YouTubeUploader:
    """Handles OAuth2 authentication and resumable uploads to YouTube."""

    YOUTUBE_API_SERVICE = "youtube"
    YOUTUBE_API_VERSION = "v3"
    SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
    MAX_RETRIES = 5

    def __init__(self, config: UploadConfig) -> None:
        self._config = config
        self._youtube = None

    # -- public --

    def authenticate(self) -> bool:
        """Run OAuth2 flow and cache credentials. Returns True on success."""
        try:
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
            import pickle

            creds: Optional[Credentials] = None
            token_path = Path(self._config.youtube_token_path)

            if token_path.exists():
                with open(token_path, "rb") as tok:
                    creds = pickle.load(tok)

            if creds is None or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    from google.auth.transport.requests import Request
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self._config.youtube_client_secrets, self.SCOPES
                    )
                    creds = flow.run_local_server(port=0)

                with open(token_path, "wb") as tok:
                    pickle.dump(creds, tok)

            self._youtube = build(
                self.YOUTUBE_API_SERVICE,
                self.YOUTUBE_API_VERSION,
                credentials=creds,
            )
            logger.info("YouTube authentication successful")
            return True

        except Exception as exc:
            logger.error("YouTube authentication failed: %s", exc)
            return False

    def upload(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: list[str],
        task_id: int = 0,
    ) -> UploadResult:
        """Upload a video to YouTube Shorts with resumable upload."""
        if self._youtube is None:
            return UploadResult(
                task_id=task_id,
                platform=Platform.YOUTUBE.value,
                success=False,
                error="Not authenticated. Call authenticate() first.",
            )

        if not Path(video_path).exists():
            return UploadResult(
                task_id=task_id,
                platform=Platform.YOUTUBE.value,
                success=False,
                error=f"Video file not found: {video_path}",
            )

        try:
            from googleapiclient.http import MediaFileUpload

            metadata = self._build_metadata(title, description, tags)
            media = MediaFileUpload(
                video_path, chunksize=256 * 1024, resumable=True
            )

            request = self._youtube.videos().insert(
                part=",".join(metadata.keys()),
                body=metadata,
                media_body=media,
            )

            response = self._execute_with_backoff(request)
            video_id = response.get("id", "")
            url = f"https://youtube.com/shorts/{video_id}"

            logger.info("YouTube upload success: %s", url)
            return UploadResult(
                task_id=task_id,
                platform=Platform.YOUTUBE.value,
                success=True,
                video_id=video_id,
                url=url,
            )

        except Exception as exc:
            logger.error("YouTube upload failed for task %d: %s", task_id, exc)
            return UploadResult(
                task_id=task_id,
                platform=Platform.YOUTUBE.value,
                success=False,
                error=str(exc),
            )

    def _build_metadata(
        self, title: str, description: str, tags: list[str]
    ) -> dict:
        """Build the YouTube Data API v3 video resource body."""
        shorts_title = title
        if self._config.shorts_tag not in title:
            shorts_title = f"{title} {self._config.shorts_tag}"

        return {
            "snippet": {
                "title": shorts_title[:100],
                "description": description[:5000],
                "tags": tags[:500],
                "categoryId": self._config.default_category_id,
                "defaultLanguage": "ja",
            },
            "status": {
                "privacyStatus": self._config.default_privacy,
                "selfDeclaredMadeForKids": False,
            },
        }

    def _execute_with_backoff(self, request):
        """Execute a resumable upload with exponential backoff."""
        response = None
        retry = 0
        while response is None:
            status, response = request.next_chunk()
            if response is not None:
                return response
            if status:
                logger.info("Upload %d%% complete", int(status.progress() * 100))
        return response


# ---------------------------------------------------------------------------
# TikTok Uploader
# ---------------------------------------------------------------------------

class TikTokUploader:
    """Handles session-based uploads to TikTok."""

    def __init__(self, config: UploadConfig) -> None:
        self._config = config
        self._session_id: str = (
            config.tiktok_session_id
            or os.environ.get("TIKTOK_SESSION_ID", "")
        )
        self._authenticated = False

    def authenticate(self) -> bool:
        """Verify TikTok session ID is available."""
        if not self._session_id:
            logger.error(
                "TikTok session ID not set. "
                "Provide via UploadConfig or TIKTOK_SESSION_ID env var."
            )
            return False
        self._authenticated = True
        logger.info("TikTok session ID configured")
        return True

    def upload(
        self,
        video_path: str,
        title: str,
        tags: list[str],
        task_id: int = 0,
        schedule_time: Optional[int] = None,
    ) -> UploadResult:
        """Upload a video to TikTok using the tiktok-uploader package."""
        if not self._authenticated:
            return UploadResult(
                task_id=task_id,
                platform=Platform.TIKTOK.value,
                success=False,
                error="Not authenticated. Call authenticate() first.",
            )

        if not Path(video_path).exists():
            return UploadResult(
                task_id=task_id,
                platform=Platform.TIKTOK.value,
                success=False,
                error=f"Video file not found: {video_path}",
            )

        try:
            from tiktok_uploader.upload import upload_video

            tag_str = " ".join(f"#{t}" for t in tags)
            full_title = f"{title} {tag_str}"

            kwargs: dict = {
                "filename": video_path,
                "description": full_title[:2200],
                "sessionid": self._session_id,
            }
            if schedule_time is not None:
                kwargs["schedule"] = schedule_time

            upload_video(**kwargs)

            logger.info("TikTok upload success for task %d", task_id)
            return UploadResult(
                task_id=task_id,
                platform=Platform.TIKTOK.value,
                success=True,
                video_id="tiktok_uploaded",
                url="https://www.tiktok.com",
            )

        except Exception as exc:
            logger.error("TikTok upload failed for task %d: %s", task_id, exc)
            return UploadResult(
                task_id=task_id,
                platform=Platform.TIKTOK.value,
                success=False,
                error=str(exc),
            )


# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------

class VideoUploader:
    """Multi-platform uploader that reads from the DB and uploads."""

    def __init__(self, config: Optional[UploadConfig] = None) -> None:
        self._config = config or UploadConfig()
        self._youtube = YouTubeUploader(self._config)
        self._tiktok = TikTokUploader(self._config)

    # -- public API --

    def upload_from_db(
        self, platform: Platform, limit: Optional[int] = None
    ) -> list[UploadResult]:
        """Upload all downloaded tasks from the DB."""
        tasks = self._get_downloaded_tasks(limit)
        if not tasks:
            logger.info("No tasks ready for upload")
            return []

        results: list[UploadResult] = []
        daily_count = self._get_today_upload_count()

        for task in tasks:
            if (
                platform in (Platform.YOUTUBE, Platform.BOTH)
                and daily_count >= self._config.max_uploads_per_day
            ):
                logger.warning("Daily YouTube upload limit reached (%d)", daily_count)
                break

            task_results = self._upload_task(task, platform)
            results.extend(task_results)

            successful = [r for r in task_results if r.success]
            if successful:
                self._update_upload_status(
                    task["id"],
                    successful[0].platform,
                    successful[0].video_id or "",
                )
                daily_count += 1

            if len(tasks) > 1:
                time.sleep(self._config.delay_between_uploads)

        self._save_upload_log(results)
        return results

    def upload_single(
        self, task_id: int, platform: Platform
    ) -> list[UploadResult]:
        """Upload a single task by its ID."""
        task = self._get_task_by_id(task_id)
        if task is None:
            return [
                UploadResult(
                    task_id=task_id,
                    platform=platform.value,
                    success=False,
                    error=f"Task {task_id} not found or not ready",
                )
            ]

        results = self._upload_task(task, platform)
        successful = [r for r in results if r.success]
        if successful:
            self._update_upload_status(
                task_id, successful[0].platform, successful[0].video_id or ""
            )
        self._save_upload_log(results)
        return results

    def upload_file(
        self, video_path: str, metadata: dict, platform: Platform
    ) -> list[UploadResult]:
        """Upload an arbitrary file (not from the DB)."""
        title = metadata.get("title", "Untitled")
        description = metadata.get("description", "")
        tags = metadata.get("tags", [])
        results: list[UploadResult] = []

        if platform in (Platform.YOUTUBE, Platform.BOTH):
            if self._youtube.authenticate():
                results.append(
                    self._youtube.upload(video_path, title, description, tags)
                )

        if platform in (Platform.TIKTOK, Platform.BOTH):
            if self._tiktok.authenticate():
                results.append(
                    self._tiktok.upload(video_path, title, tags)
                )

        self._save_upload_log(results)
        return results

    def get_upload_stats(self) -> dict:
        """Return upload statistics from the log file."""
        log_path = self._config.log_dir / "uploads.json"
        if not log_path.exists():
            return {
                "total": 0,
                "youtube": 0,
                "tiktok": 0,
                "success": 0,
                "failed": 0,
            }

        entries = json.loads(log_path.read_text(encoding="utf-8"))
        youtube_ok = sum(
            1
            for e in entries
            if e.get("platform") == "youtube" and e.get("success")
        )
        tiktok_ok = sum(
            1
            for e in entries
            if e.get("platform") == "tiktok" and e.get("success")
        )
        total_ok = sum(1 for e in entries if e.get("success"))
        total_fail = sum(1 for e in entries if not e.get("success"))

        return {
            "total": len(entries),
            "youtube": youtube_ok,
            "tiktok": tiktok_ok,
            "success": total_ok,
            "failed": total_fail,
        }

    def print_summary(self, results: list[UploadResult]) -> None:
        """Print a human-readable summary of upload results."""
        if not results:
            logger.info("No results to display")
            return

        succeeded = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        print(f"\n{'='*50}")
        print(f"Upload Summary: {len(succeeded)} succeeded, {len(failed)} failed")
        print(f"{'='*50}")

        for r in succeeded:
            print(f"  [OK]   task={r.task_id}  {r.platform}  {r.url}")
        for r in failed:
            print(f"  [FAIL] task={r.task_id}  {r.platform}  {r.error}")
        print()

    # -- private helpers --

    def _upload_task(
        self, task: dict, platform: Platform
    ) -> list[UploadResult]:
        """Upload a single task dict to the requested platform(s)."""
        video_path = task.get("file_path", "")
        title = task.get("title", "Untitled")
        summary = task.get("summary", "")

        description = self._generate_description(title, summary)
        tags = self._generate_tags(title)

        results: list[UploadResult] = []

        if platform in (Platform.YOUTUBE, Platform.BOTH):
            if self._youtube.authenticate():
                results.append(
                    self._youtube.upload(
                        video_path, title, description, tags, task["id"]
                    )
                )

        if platform in (Platform.TIKTOK, Platform.BOTH):
            if self._tiktok.authenticate():
                results.append(
                    self._tiktok.upload(
                        video_path, title, tags, task["id"]
                    )
                )

        return results

    def _get_downloaded_tasks(
        self, limit: Optional[int] = None
    ) -> list[dict]:
        """Fetch tasks with status='downloaded' that have a file_path."""
        query = (
            "SELECT id, title, summary, script, file_path FROM videos "
            "WHERE status = 'downloaded' AND file_path IS NOT NULL "
            "ORDER BY id ASC"
        )
        params: tuple = ()
        if limit is not None:
            query += " LIMIT ?"
            params = (limit,)

        conn = sqlite3.connect(str(self._config.db_path))
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as exc:
            logger.error("DB query failed: %s", exc)
            return []
        finally:
            conn.close()

    def _get_task_by_id(self, task_id: int) -> Optional[dict]:
        """Fetch a single task by ID (must be in downloaded status)."""
        query = (
            "SELECT id, title, summary, script, file_path FROM videos "
            "WHERE id = ? AND status = 'downloaded' AND file_path IS NOT NULL"
        )
        conn = sqlite3.connect(str(self._config.db_path))
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.execute(query, (task_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as exc:
            logger.error("DB query failed: %s", exc)
            return None
        finally:
            conn.close()

    def _update_upload_status(
        self, task_id: int, platform: str, video_id: str
    ) -> None:
        """Mark a task as 'uploaded' in the database."""
        conn = sqlite3.connect(str(self._config.db_path))
        try:
            conn.execute(
                "UPDATE videos SET status = 'uploaded' WHERE id = ?",
                (task_id,),
            )
            conn.commit()
            logger.info(
                "Task %d marked as uploaded (%s: %s)", task_id, platform, video_id
            )
        except Exception as exc:
            logger.error("DB update failed for task %d: %s", task_id, exc)
        finally:
            conn.close()

    def _generate_description(
        self, title: str, summary: str
    ) -> str:
        """Auto-generate a YouTube Shorts description from title and summary."""
        return (
            f"{summary}\n\n"
            f"#Shorts\n\n"
            f"チャンネル登録お願いします！\n"
            f"コメントで感想を教えてください。"
        )

    def _generate_tags(self, title: str) -> list[str]:
        """Auto-generate tags from the video title keywords."""
        tags = list(DEFAULT_TAGS)
        keywords = self._extract_keywords(title)
        return [*tags, *keywords]

    @staticmethod
    def _extract_keywords(title: str) -> list[str]:
        """Extract meaningful keywords from the title for tagging."""
        # Remove common noise characters
        clean = title
        for ch in "【】「」『』()（）《》〈〉":
            clean = clean.replace(ch, " ")

        words = [w.strip() for w in clean.split() if len(w.strip()) >= 2]
        # Deduplicate while preserving order, limit to 10 keywords
        seen: set[str] = set()
        unique: list[str] = []
        for w in words:
            if w not in seen:
                seen.add(w)
                unique.append(w)
            if len(unique) >= 10:
                break
        return unique

    def _save_upload_log(self, results: list[UploadResult]) -> None:
        """Append upload results to logs/uploads.json."""
        if not results:
            return

        log_dir = self._config.log_dir
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "uploads.json"

        existing: list[dict] = []
        if log_path.exists():
            try:
                existing = json.loads(log_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                existing = []

        now_iso = datetime.now(timezone.utc).isoformat()
        for r in results:
            existing.append({
                "task_id": r.task_id,
                "platform": r.platform,
                "success": r.success,
                "video_id": r.video_id,
                "url": r.url,
                "error": r.error,
                "uploaded_at": now_iso,
            })

        log_path.write_text(
            json.dumps(existing, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _get_today_upload_count(self) -> int:
        """Count how many successful YouTube uploads were made today."""
        log_path = self._config.log_dir / "uploads.json"
        if not log_path.exists():
            return 0

        try:
            entries = json.loads(log_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return 0

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return sum(
            1
            for e in entries
            if e.get("platform") == "youtube"
            and e.get("success")
            and str(e.get("uploaded_at", "")).startswith(today_str)
        )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Multi-platform video uploader (YouTube Shorts & TikTok)"
    )
    parser.add_argument(
        "--platform",
        "-p",
        choices=["youtube", "tiktok", "both"],
        help="Target platform",
    )
    parser.add_argument(
        "--limit", "-l", type=int, default=None, help="Max videos to upload"
    )
    parser.add_argument(
        "--task-id", "-t", type=int, default=None, help="Upload specific task ID"
    )
    parser.add_argument(
        "--file", "-f", type=str, default=None, help="Upload specific video file"
    )
    parser.add_argument(
        "--title", type=str, default="Untitled", help="Title for --file upload"
    )
    parser.add_argument(
        "--status", "-s", action="store_true", help="Show upload statistics"
    )
    parser.add_argument(
        "--youtube-auth", action="store_true", help="Run YouTube auth setup"
    )

    args = parser.parse_args()
    uploader = VideoUploader()

    if args.status:
        stats = uploader.get_upload_stats()
        print(f"\n{'='*40}")
        print("Upload Statistics")
        print(f"{'='*40}")
        print(f"  Total uploads:    {stats['total']}")
        print(f"  YouTube success:  {stats['youtube']}")
        print(f"  TikTok success:   {stats['tiktok']}")
        print(f"  Total success:    {stats['success']}")
        print(f"  Total failed:     {stats['failed']}")
        print()
        return 0

    if args.youtube_auth:
        yt = YouTubeUploader(UploadConfig())
        ok = yt.authenticate()
        return 0 if ok else 1

    if not args.platform:
        parser.print_help()
        return 0

    platform = Platform(args.platform)

    if args.file:
        results = uploader.upload_file(
            args.file,
            {"title": args.title, "description": "", "tags": []},
            platform,
        )
    elif args.task_id is not None:
        results = uploader.upload_single(args.task_id, platform)
    else:
        results = uploader.upload_from_db(platform, limit=args.limit)

    uploader.print_summary(results)
    return 0 if all(r.success for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
