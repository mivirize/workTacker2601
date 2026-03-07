"""
Tests for the multi-platform video uploader.

All external API calls are mocked. Uses tmp_path for log files
and in-memory SQLite for database operations.
"""

import json
import sqlite3
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, ANY

import pytest

# Ensure the scripts directory is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from video_uploader import (
    DEFAULT_TAGS,
    Platform,
    TikTokUploader,
    UploadConfig,
    UploadResult,
    VideoUploader,
    YouTubeUploader,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def tmp_config(tmp_path: Path) -> UploadConfig:
    """Create an UploadConfig pointing at tmp directories."""
    db_path = tmp_path / "test.db"
    _init_test_db(db_path)
    return UploadConfig(
        db_path=db_path,
        log_dir=tmp_path / "logs",
        youtube_client_secrets="fake_secrets.json",
        youtube_token_path=str(tmp_path / "fake_token.pickle"),
        tiktok_session_id="fake_session",
        max_uploads_per_day=6,
        delay_between_uploads=0,
    )


@pytest.fixture()
def uploader(tmp_config: UploadConfig) -> VideoUploader:
    """Create a VideoUploader backed by the tmp config."""
    return VideoUploader(config=tmp_config)


@pytest.fixture()
def sample_video(tmp_path: Path) -> Path:
    """Create a small dummy video file."""
    video = tmp_path / "sample.mp4"
    video.write_bytes(b"\x00" * 1024)
    return video


def _init_test_db(db_path: Path) -> None:
    """Initialize a minimal videos table for testing."""
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
            created_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def _insert_task(
    db_path: Path,
    title: str = "Test Title",
    summary: str = "Test Summary",
    script: str = "Test Script",
    status: str = "downloaded",
    file_path: str = "/tmp/video.mp4",
) -> int:
    """Insert a task row and return its ID."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.execute(
        "INSERT INTO videos (title, summary, script, status, file_path) "
        "VALUES (?, ?, ?, ?, ?)",
        (title, summary, script, status, file_path),
    )
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return task_id


# ---------------------------------------------------------------------------
# 1. Config defaults
# ---------------------------------------------------------------------------


class TestUploadConfig:
    def test_upload_config_defaults(self) -> None:
        """Verify default config values are set correctly."""
        config = UploadConfig()
        assert config.youtube_client_secrets == "client_secrets.json"
        assert config.youtube_token_path == "youtube_token.pickle"
        assert config.tiktok_session_id == ""
        assert config.default_privacy == "public"
        assert config.default_category_id == "22"
        assert config.shorts_tag == "#Shorts"
        assert config.delay_between_uploads == 10
        assert config.max_uploads_per_day == 6

    def test_upload_config_is_frozen(self) -> None:
        """Verify that the config dataclass is immutable."""
        config = UploadConfig()
        with pytest.raises(AttributeError):
            config.max_uploads_per_day = 99  # type: ignore[misc]


# ---------------------------------------------------------------------------
# 2-3. Description and tag generation
# ---------------------------------------------------------------------------


class TestMetadataGeneration:
    def test_generate_description(self, uploader: VideoUploader) -> None:
        """Verify description format includes summary, hashtags, and CTA."""
        desc = uploader._generate_description(
            title="猫の飼い方入門", summary="Summary line"
        )
        assert "Summary line" in desc
        assert "#Shorts" in desc
        assert "チャンネル登録" in desc

    def test_generate_description_no_mbti(self, uploader: VideoUploader) -> None:
        """Verify description does not contain MBTI-specific content."""
        desc = uploader._generate_description(
            title="投資入門ガイド", summary="投資の基本を解説"
        )
        assert "MBTI" not in desc.upper()

    def test_generate_tags_from_title(self, uploader: VideoUploader) -> None:
        """Verify tags are extracted from title keywords."""
        tags = uploader._generate_tags(
            title="【投資入門】初心者向け 資産運用ガイド"
        )
        assert "Shorts" in tags
        assert "投資入門" in tags
        assert "初心者向け" in tags
        assert "資産運用ガイド" in tags

    def test_generate_tags_includes_defaults(self, uploader: VideoUploader) -> None:
        """Verify DEFAULT_TAGS are always included."""
        tags = uploader._generate_tags(title="Short title")
        for default_tag in DEFAULT_TAGS:
            assert default_tag in tags

    def test_generate_tags_short_words_filtered(self, uploader: VideoUploader) -> None:
        """Words shorter than 2 characters should be filtered out."""
        tags = uploader._generate_tags(title="A B テスト動画")
        assert "A" not in tags
        assert "B" not in tags
        assert "テスト動画" in tags


# ---------------------------------------------------------------------------
# 4. YouTube metadata builder
# ---------------------------------------------------------------------------


class TestYouTubeBuildMetadata:
    def test_youtube_build_metadata(self, tmp_config: UploadConfig) -> None:
        """Verify YouTube API metadata structure."""
        yt = YouTubeUploader(tmp_config)
        meta = yt._build_metadata(
            title="Test Video",
            description="A description",
            tags=["tag1", "tag2"],
        )
        assert "snippet" in meta
        assert "status" in meta
        assert meta["snippet"]["categoryId"] == "22"
        assert meta["snippet"]["defaultLanguage"] == "ja"
        assert meta["status"]["privacyStatus"] == "public"
        assert meta["status"]["selfDeclaredMadeForKids"] is False
        # #Shorts should be appended
        assert "#Shorts" in meta["snippet"]["title"]

    def test_youtube_build_metadata_existing_shorts_tag(
        self, tmp_config: UploadConfig
    ) -> None:
        """If #Shorts already in title, it should not be duplicated."""
        yt = YouTubeUploader(tmp_config)
        meta = yt._build_metadata(
            title="My Video #Shorts", description="desc", tags=[]
        )
        assert meta["snippet"]["title"].count("#Shorts") == 1


# ---------------------------------------------------------------------------
# 5-6. YouTube upload (success & failure)
# ---------------------------------------------------------------------------


class TestYouTubeUpload:
    def test_youtube_upload_success(
        self, tmp_config: UploadConfig, sample_video: Path
    ) -> None:
        """Mock the Google API and verify a successful upload flow."""
        # Inject mock googleapiclient modules so the local import works
        mock_media = MagicMock()
        mock_http_mod = MagicMock()
        mock_http_mod.MediaFileUpload = mock_media
        mock_gac = MagicMock()
        mock_gac.http = mock_http_mod

        with patch.dict(
            "sys.modules",
            {
                "googleapiclient": mock_gac,
                "googleapiclient.http": mock_http_mod,
            },
        ):
            yt = YouTubeUploader(tmp_config)

            # Build a fake youtube resource
            mock_insert = MagicMock()
            mock_insert.next_chunk.return_value = (
                None,
                {"id": "yt_vid_123"},
            )
            mock_videos = MagicMock()
            mock_videos.insert.return_value = mock_insert
            mock_yt_service = MagicMock()
            mock_yt_service.videos.return_value = mock_videos
            yt._youtube = mock_yt_service

            result = yt.upload(
                video_path=str(sample_video),
                title="Test",
                description="Desc",
                tags=["t1"],
                task_id=1,
            )

        assert result.success is True
        assert result.video_id == "yt_vid_123"
        assert "youtube.com/shorts/yt_vid_123" in (result.url or "")

    def test_youtube_upload_failure_not_authenticated(
        self, tmp_config: UploadConfig
    ) -> None:
        """Uploading without authentication should return an error."""
        yt = YouTubeUploader(tmp_config)
        result = yt.upload(
            video_path="/fake.mp4",
            title="Test",
            description="Desc",
            tags=[],
            task_id=2,
        )
        assert result.success is False
        assert "Not authenticated" in (result.error or "")

    def test_youtube_upload_failure_file_not_found(
        self, tmp_config: UploadConfig
    ) -> None:
        """Uploading a non-existent file should return an error."""
        yt = YouTubeUploader(tmp_config)
        yt._youtube = MagicMock()  # pretend authenticated
        result = yt.upload(
            video_path="/nonexistent/video.mp4",
            title="Test",
            description="Desc",
            tags=[],
            task_id=3,
        )
        assert result.success is False
        assert "not found" in (result.error or "")


# ---------------------------------------------------------------------------
# 7-8. TikTok upload (success & failure)
# ---------------------------------------------------------------------------


class TestTikTokUpload:
    @patch("video_uploader.TikTokUploader.authenticate", return_value=True)
    def test_tiktok_upload_success(
        self,
        _mock_auth: MagicMock,
        tmp_config: UploadConfig,
        sample_video: Path,
    ) -> None:
        """Mock tiktok_uploader.upload_video and verify the flow."""
        tt = TikTokUploader(tmp_config)
        tt._authenticated = True

        with patch(
            "video_uploader.upload_video", create=True
        ) as mock_upload:
            mock_upload.return_value = None  # success returns None

            # We need to patch at the import site inside the method
            with patch.dict(
                "sys.modules",
                {"tiktok_uploader": MagicMock(), "tiktok_uploader.upload": MagicMock()},
            ):
                # Directly patch the inner import
                with patch(
                    "video_uploader.TikTokUploader.upload",
                    wraps=tt.upload,
                ):
                    result = tt.upload(
                        video_path=str(sample_video),
                        title="TikTok Test",
                        tags=["Shorts"],
                        task_id=10,
                    )

        assert result.success is True
        assert result.platform == "tiktok"

    def test_tiktok_upload_failure_not_authenticated(
        self, tmp_config: UploadConfig
    ) -> None:
        """Uploading without authentication should return an error."""
        tt = TikTokUploader(tmp_config)
        result = tt.upload(
            video_path="/fake.mp4", title="Test", tags=[], task_id=11
        )
        assert result.success is False
        assert "Not authenticated" in (result.error or "")

    def test_tiktok_upload_failure_file_not_found(
        self, tmp_config: UploadConfig
    ) -> None:
        """Uploading a non-existent file should return an error."""
        tt = TikTokUploader(tmp_config)
        tt._authenticated = True
        result = tt.upload(
            video_path="/nonexistent/video.mp4",
            title="Test",
            tags=[],
            task_id=12,
        )
        assert result.success is False
        assert "not found" in (result.error or "")


# ---------------------------------------------------------------------------
# 9. Get downloaded tasks from DB
# ---------------------------------------------------------------------------


class TestDBOperations:
    def test_get_downloaded_tasks(self, uploader: VideoUploader) -> None:
        """Mock SQLite and verify the query returns correct rows."""
        db_path = uploader._config.db_path
        _insert_task(db_path, title="Task A", status="downloaded", file_path="/a.mp4")
        _insert_task(db_path, title="Task B", status="downloaded", file_path="/b.mp4")
        _insert_task(db_path, title="Task C", status="planned", file_path="/c.mp4")

        tasks = uploader._get_downloaded_tasks()
        assert len(tasks) == 2
        assert tasks[0]["title"] == "Task A"
        assert tasks[1]["title"] == "Task B"

    def test_get_downloaded_tasks_with_limit(
        self, uploader: VideoUploader
    ) -> None:
        """Limit parameter should restrict the number of rows."""
        db_path = uploader._config.db_path
        _insert_task(db_path, title="T1", status="downloaded", file_path="/1.mp4")
        _insert_task(db_path, title="T2", status="downloaded", file_path="/2.mp4")
        _insert_task(db_path, title="T3", status="downloaded", file_path="/3.mp4")

        tasks = uploader._get_downloaded_tasks(limit=2)
        assert len(tasks) == 2

    def test_update_upload_status(self, uploader: VideoUploader) -> None:
        """Verify that the DB status is updated to 'uploaded'."""
        db_path = uploader._config.db_path
        task_id = _insert_task(db_path, status="downloaded", file_path="/v.mp4")

        uploader._update_upload_status(task_id, "youtube", "vid123")

        conn = sqlite3.connect(str(db_path))
        row = conn.execute(
            "SELECT status FROM videos WHERE id = ?", (task_id,)
        ).fetchone()
        conn.close()
        assert row[0] == "uploaded"


# ---------------------------------------------------------------------------
# 10-11. upload_from_db / upload_single
# ---------------------------------------------------------------------------


class TestUploadOrchestration:
    @patch.object(YouTubeUploader, "authenticate", return_value=True)
    @patch.object(YouTubeUploader, "upload")
    def test_upload_from_db(
        self,
        mock_yt_upload: MagicMock,
        _mock_auth: MagicMock,
        uploader: VideoUploader,
    ) -> None:
        """Mock both uploaders and verify sequential processing."""
        db_path = uploader._config.db_path
        tid = _insert_task(
            db_path,
            title="【投資入門】初心者向け資産運用ガイド",
            status="downloaded",
            file_path="/video1.mp4",
        )
        mock_yt_upload.return_value = UploadResult(
            task_id=tid,
            platform="youtube",
            success=True,
            video_id="yt123",
            url="https://youtube.com/shorts/yt123",
        )

        results = uploader.upload_from_db(Platform.YOUTUBE, limit=1)

        assert len(results) == 1
        assert results[0].success is True
        assert results[0].video_id == "yt123"
        mock_yt_upload.assert_called_once()

    @patch.object(YouTubeUploader, "authenticate", return_value=True)
    @patch.object(YouTubeUploader, "upload")
    def test_upload_single(
        self,
        mock_yt_upload: MagicMock,
        _mock_auth: MagicMock,
        uploader: VideoUploader,
    ) -> None:
        """Mock uploader and verify single task upload."""
        db_path = uploader._config.db_path
        tid = _insert_task(
            db_path,
            title="【猫の飼い方】初心者でも安心",
            status="downloaded",
            file_path="/single.mp4",
        )
        mock_yt_upload.return_value = UploadResult(
            task_id=tid,
            platform="youtube",
            success=True,
            video_id="single_yt",
            url="https://youtube.com/shorts/single_yt",
        )

        results = uploader.upload_single(tid, Platform.YOUTUBE)

        assert len(results) == 1
        assert results[0].success is True

    def test_upload_single_not_found(self, uploader: VideoUploader) -> None:
        """Uploading a non-existent task should return an error."""
        results = uploader.upload_single(99999, Platform.YOUTUBE)
        assert len(results) == 1
        assert results[0].success is False
        assert "not found" in (results[0].error or "")


# ---------------------------------------------------------------------------
# 12. Upload log creation
# ---------------------------------------------------------------------------


class TestUploadLog:
    def test_upload_log_creation(
        self, uploader: VideoUploader, tmp_config: UploadConfig
    ) -> None:
        """Verify that upload results are persisted in JSON log."""
        results = [
            UploadResult(
                task_id=1,
                platform="youtube",
                success=True,
                video_id="log_test_id",
                url="https://youtube.com/shorts/log_test_id",
            ),
            UploadResult(
                task_id=2,
                platform="tiktok",
                success=False,
                error="some error",
            ),
        ]
        uploader._save_upload_log(results)

        log_path = tmp_config.log_dir / "uploads.json"
        assert log_path.exists()

        entries = json.loads(log_path.read_text(encoding="utf-8"))
        assert len(entries) == 2
        assert entries[0]["video_id"] == "log_test_id"
        assert entries[0]["success"] is True
        assert entries[1]["success"] is False
        assert entries[1]["error"] == "some error"
        assert "uploaded_at" in entries[0]

    def test_upload_log_appends(
        self, uploader: VideoUploader, tmp_config: UploadConfig
    ) -> None:
        """Subsequent saves should append, not overwrite."""
        r1 = [UploadResult(task_id=1, platform="youtube", success=True)]
        r2 = [UploadResult(task_id=2, platform="tiktok", success=True)]

        uploader._save_upload_log(r1)
        uploader._save_upload_log(r2)

        log_path = tmp_config.log_dir / "uploads.json"
        entries = json.loads(log_path.read_text(encoding="utf-8"))
        assert len(entries) == 2


# ---------------------------------------------------------------------------
# 13. Max uploads per day quota
# ---------------------------------------------------------------------------


class TestQuotaEnforcement:
    @patch.object(YouTubeUploader, "authenticate", return_value=True)
    @patch.object(YouTubeUploader, "upload")
    def test_max_uploads_per_day(
        self,
        mock_yt_upload: MagicMock,
        _mock_auth: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Verify quota enforcement stops uploads after limit."""
        db_path = tmp_path / "quota_test.db"
        _init_test_db(db_path)

        config = UploadConfig(
            db_path=db_path,
            log_dir=tmp_path / "logs",
            max_uploads_per_day=2,
            delay_between_uploads=0,
            tiktok_session_id="fake",
        )
        up = VideoUploader(config=config)

        # Insert 5 tasks
        for i in range(5):
            _insert_task(
                db_path,
                title=f"Task {i}",
                status="downloaded",
                file_path=f"/v{i}.mp4",
            )

        call_count = 0

        def fake_upload(video_path, title, desc, tags, task_id=0):
            nonlocal call_count
            call_count += 1
            return UploadResult(
                task_id=task_id,
                platform="youtube",
                success=True,
                video_id=f"yt_{call_count}",
                url=f"https://youtube.com/shorts/yt_{call_count}",
            )

        mock_yt_upload.side_effect = fake_upload

        results = up.upload_from_db(Platform.YOUTUBE)

        # Should stop at 2 due to max_uploads_per_day
        successful = [r for r in results if r.success]
        assert len(successful) <= 2


# ---------------------------------------------------------------------------
# 14. Upload stats
# ---------------------------------------------------------------------------


class TestUploadStats:
    def test_upload_stats_empty(self, uploader: VideoUploader) -> None:
        """Stats with no log file should return all zeros."""
        stats = uploader.get_upload_stats()
        assert stats["total"] == 0
        assert stats["youtube"] == 0
        assert stats["tiktok"] == 0
        assert stats["success"] == 0
        assert stats["failed"] == 0

    def test_upload_stats_with_data(
        self, uploader: VideoUploader, tmp_config: UploadConfig
    ) -> None:
        """Verify statistics calculation from log entries."""
        log_dir = tmp_config.log_dir
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "uploads.json"

        entries = [
            {"platform": "youtube", "success": True, "uploaded_at": "2026-02-07"},
            {"platform": "youtube", "success": True, "uploaded_at": "2026-02-07"},
            {"platform": "tiktok", "success": True, "uploaded_at": "2026-02-07"},
            {"platform": "youtube", "success": False, "uploaded_at": "2026-02-07"},
        ]
        log_path.write_text(json.dumps(entries), encoding="utf-8")

        stats = uploader.get_upload_stats()
        assert stats["total"] == 4
        assert stats["youtube"] == 2
        assert stats["tiktok"] == 1
        assert stats["success"] == 3
        assert stats["failed"] == 1


# ---------------------------------------------------------------------------
# 15. Extract helpers
# ---------------------------------------------------------------------------


class TestExtractKeywords:
    def test_extract_keywords_basic(self) -> None:
        """Keywords should be extracted from bracketed title."""
        keywords = VideoUploader._extract_keywords("【投資入門】初心者向け 資産運用")
        assert "投資入門" in keywords
        assert "初心者向け" in keywords
        assert "資産運用" in keywords

    def test_extract_keywords_removes_brackets(self) -> None:
        """All bracket types should be replaced with spaces."""
        keywords = VideoUploader._extract_keywords("「猫の飼い方」（完全版）")
        assert all("「" not in k and "」" not in k for k in keywords)
        assert all("（" not in k and "）" not in k for k in keywords)

    def test_extract_keywords_deduplicates(self) -> None:
        """Duplicate words should appear only once."""
        keywords = VideoUploader._extract_keywords("テスト テスト テスト 動画")
        assert keywords.count("テスト") == 1

    def test_extract_keywords_limits_to_10(self) -> None:
        """Output should be capped at 10 keywords."""
        long_title = " ".join(f"word{i}" for i in range(20))
        keywords = VideoUploader._extract_keywords(long_title)
        assert len(keywords) <= 10

    def test_extract_keywords_filters_short(self) -> None:
        """Single-character words should be excluded."""
        keywords = VideoUploader._extract_keywords("A テスト B 動画 C")
        assert "A" not in keywords
        assert "B" not in keywords
        assert "C" not in keywords
        assert "テスト" in keywords
        assert "動画" in keywords


# ---------------------------------------------------------------------------
# 16. UploadResult immutability
# ---------------------------------------------------------------------------


class TestUploadResult:
    def test_upload_result_fields(self) -> None:
        """Verify UploadResult stores all fields correctly."""
        r = UploadResult(
            task_id=42,
            platform="youtube",
            success=True,
            video_id="abc",
            url="https://youtube.com/shorts/abc",
        )
        assert r.task_id == 42
        assert r.platform == "youtube"
        assert r.success is True
        assert r.video_id == "abc"

    def test_upload_result_is_frozen(self) -> None:
        """Verify that UploadResult is immutable."""
        r = UploadResult(task_id=1, platform="youtube", success=True)
        with pytest.raises(AttributeError):
            r.success = False  # type: ignore[misc]
