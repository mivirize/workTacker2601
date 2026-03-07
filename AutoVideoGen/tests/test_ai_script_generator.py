"""
Tests for the universal ai_script_generator module.

Uses pytest + unittest.mock to test AI script generation without actual API calls.
"""

import json
import sqlite3
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure scripts directory is on the path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from ai_script_generator import (
    AIScriptGenerator,
    CHAR_MAX,
    CHAR_MIN,
    VARIATION_HINTS,
    build_cli_parser,
    build_system_prompt,
    build_theme_prompt,
    save_to_database,
    save_to_json,
    validate_script,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_SCRIPT_TEXT = "A" * 400  # 400 chars, within 380-450 range
SHORT_SCRIPT_TEXT = "A" * 300  # 300 chars, below 380
LONG_SCRIPT_TEXT = "A" * 500  # 500 chars, above 450


def _make_api_response(
    title: str, summary: str, script: str, tags: list[str] | None = None
) -> MagicMock:
    """Create a mock Anthropic API response."""
    response_json = json.dumps(
        {
            "title": title,
            "summary": summary,
            "script": script,
            "tags": tags or ["tag1", "tag2"],
        },
        ensure_ascii=False,
    )
    mock_response = MagicMock()
    mock_content_block = MagicMock()
    mock_content_block.text = response_json
    mock_response.content = [mock_content_block]
    return mock_response


def _create_test_db(db_path: Path) -> None:
    """Create the videos table in a test database."""
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            script TEXT NOT NULL,
            status TEXT DEFAULT 'planned',
            created_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


@pytest.fixture
def mock_client():
    """Create a mock Anthropic client."""
    return MagicMock()


@pytest.fixture
def generator(mock_client):
    """Create an AIScriptGenerator with a mocked client."""
    gen = AIScriptGenerator(api_key="test-key-123", model="test-model")
    gen._client = mock_client
    return gen


@pytest.fixture
def temp_db():
    """Create a temporary database with the videos table."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    _create_test_db(db_path)
    yield db_path
    db_path.unlink(missing_ok=True)


@pytest.fixture
def temp_json():
    """Create a temporary JSON file path."""
    with tempfile.NamedTemporaryFile(
        suffix=".json", delete=False, mode="w"
    ) as f:
        json_path = Path(f.name)
    yield json_path
    json_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Test: System Prompt Content
# ---------------------------------------------------------------------------

class TestSystemPrompt:
    """Tests for system prompt generation."""

    def test_system_prompt_contains_structure_rules(self):
        """Verify system prompt contains script structure rules."""
        prompt = build_system_prompt()
        assert "フック" in prompt
        assert "ツイスト" in prompt
        assert "CTA" in prompt

    def test_system_prompt_contains_char_limits(self):
        """Verify system prompt contains character count limits."""
        prompt = build_system_prompt()
        assert str(CHAR_MIN) in prompt
        assert str(CHAR_MAX) in prompt

    def test_system_prompt_contains_json_format(self):
        """Verify system prompt specifies JSON output format."""
        prompt = build_system_prompt()
        assert "JSON" in prompt
        assert "title" in prompt
        assert "summary" in prompt
        assert "script" in prompt
        assert "tags" in prompt

    def test_system_prompt_is_generic(self):
        """Verify system prompt does NOT contain MBTI-specific content."""
        prompt = build_system_prompt()
        assert "MBTI" not in prompt
        assert "認知機能" not in prompt
        assert "16タイプ" not in prompt


# ---------------------------------------------------------------------------
# Test: Theme Prompt Generation
# ---------------------------------------------------------------------------

class TestThemePrompt:
    """Tests for theme-based prompt generation."""

    def test_theme_prompt_contains_theme(self):
        """Verify theme prompt includes the given theme."""
        prompt = build_theme_prompt("猫の飼い方")
        assert "猫の飼い方" in prompt

    def test_theme_prompt_with_variation_hint(self):
        """Verify variation hint is included when provided."""
        prompt = build_theme_prompt("料理のコツ", "初心者向けに")
        assert "料理のコツ" in prompt
        assert "初心者向けに" in prompt

    def test_theme_prompt_without_variation_hint(self):
        """Verify prompt works without variation hint."""
        prompt = build_theme_prompt("プログラミング入門")
        assert "プログラミング入門" in prompt

    def test_theme_prompt_various_topics(self):
        """Verify prompts work for diverse topics."""
        topics = ["投資の基本", "INTJ性格分析", "ダイエット方法", "AI活用術"]
        for topic in topics:
            prompt = build_theme_prompt(topic)
            assert topic in prompt

    def test_variation_hints_list(self):
        """Verify variation hints list has entries."""
        assert len(VARIATION_HINTS) >= 2
        assert VARIATION_HINTS[0] == ""  # first is empty (default)


# ---------------------------------------------------------------------------
# Test: Script Validation
# ---------------------------------------------------------------------------

class TestValidateScript:
    """Tests for script validation logic."""

    def test_validate_script_valid(self):
        """Script within 380-450 chars passes validation."""
        is_valid, message = validate_script(VALID_SCRIPT_TEXT)
        assert is_valid is True
        assert "Valid" in message
        assert "400" in message

    def test_validate_script_too_short(self):
        """Script < 380 chars fails validation."""
        is_valid, message = validate_script(SHORT_SCRIPT_TEXT)
        assert is_valid is False
        assert "Too short" in message
        assert "300" in message

    def test_validate_script_too_long(self):
        """Script > 450 chars fails validation."""
        is_valid, message = validate_script(LONG_SCRIPT_TEXT)
        assert is_valid is False
        assert "Too long" in message
        assert "500" in message

    def test_validate_script_exact_min(self):
        """Script at exactly CHAR_MIN passes."""
        script = "X" * CHAR_MIN
        is_valid, _ = validate_script(script)
        assert is_valid is True

    def test_validate_script_exact_max(self):
        """Script at exactly CHAR_MAX passes."""
        script = "X" * CHAR_MAX
        is_valid, _ = validate_script(script)
        assert is_valid is True

    def test_validate_script_one_below_min(self):
        """Script at CHAR_MIN - 1 fails."""
        script = "X" * (CHAR_MIN - 1)
        is_valid, _ = validate_script(script)
        assert is_valid is False

    def test_validate_script_one_above_max(self):
        """Script at CHAR_MAX + 1 fails."""
        script = "X" * (CHAR_MAX + 1)
        is_valid, _ = validate_script(script)
        assert is_valid is False

    def test_validate_empty_script(self):
        """Empty script fails validation."""
        is_valid, message = validate_script("")
        assert is_valid is False
        assert "Too short" in message


# ---------------------------------------------------------------------------
# Test: Generate Script (Mocked)
# ---------------------------------------------------------------------------

class TestGenerateScript:
    """Tests for the generate_script method with mocked API."""

    def test_generate_script_with_theme(self, generator, mock_client):
        """Mock API call with theme, verify output structure."""
        mock_client.messages.create.return_value = _make_api_response(
            title="猫の飼い方ガイド",
            summary="猫を飼うポイント",
            script=VALID_SCRIPT_TEXT,
            tags=["猫", "ペット", "飼い方"],
        )

        result = generator.generate_script("猫の飼い方")

        assert result is not None
        assert result["title"] == "猫の飼い方ガイド"
        assert result["summary"] == "猫を飼うポイント"
        assert result["script"] == VALID_SCRIPT_TEXT
        assert result["theme"] == "猫の飼い方"
        assert result["tags"] == ["猫", "ペット", "飼い方"]
        assert result["char_count"] == 400

    def test_generate_script_retry_on_invalid(self, generator, mock_client):
        """Mock API returning short script, verify retry with longer text."""
        short_response = _make_api_response(
            title="Short", summary="Short", script=SHORT_SCRIPT_TEXT
        )
        valid_response = _make_api_response(
            title="Valid", summary="Valid", script=VALID_SCRIPT_TEXT
        )

        mock_client.messages.create.side_effect = [
            short_response,
            valid_response,
        ]

        result = generator.generate_script("テスト")

        assert result is not None
        assert result["script"] == VALID_SCRIPT_TEXT
        assert result["char_count"] == 400
        assert mock_client.messages.create.call_count == 2

    def test_generate_script_empty_theme(self, generator):
        """Empty theme returns None."""
        result = generator.generate_script("")
        assert result is None

    def test_generate_script_whitespace_theme(self, generator):
        """Whitespace-only theme returns None."""
        result = generator.generate_script("   ")
        assert result is None

    def test_generate_script_api_returns_unparseable(
        self, generator, mock_client
    ):
        """API returning non-JSON returns None after retries."""
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = "This is not JSON at all"
        mock_response.content = [mock_content_block]
        mock_client.messages.create.return_value = mock_response

        result = generator.generate_script("テスト")
        assert result is None

    def test_generate_script_with_variation_hint(self, generator, mock_client):
        """Verify variation_hint is used when generating."""
        mock_client.messages.create.return_value = _make_api_response(
            title="Title", summary="Summary", script=VALID_SCRIPT_TEXT
        )

        result = generator.generate_script(
            "テスト", variation_hint="初心者向けに"
        )
        assert result is not None

        # Verify the user prompt contained the hint
        call_args = mock_client.messages.create.call_args
        user_msg = call_args.kwargs["messages"][0]["content"]
        assert "初心者向けに" in user_msg


# ---------------------------------------------------------------------------
# Test: Generate Multiple Scripts
# ---------------------------------------------------------------------------

class TestGenerateMultiple:
    """Tests for generating multiple scripts for a theme."""

    def test_generate_multiple(self, generator, mock_client):
        """Mock API, verify multiple scripts generated with variations."""
        mock_client.messages.create.return_value = _make_api_response(
            title="Test Title",
            summary="Test Summary",
            script=VALID_SCRIPT_TEXT,
        )

        results = generator.generate_multiple("猫の飼い方", count=3)

        assert len(results) == 3
        for result in results:
            assert result["theme"] == "猫の飼い方"
            assert result["char_count"] == 400

    def test_generate_multiple_default_count(self, generator, mock_client):
        """Default count generates 1 script."""
        mock_client.messages.create.return_value = _make_api_response(
            title="Title", summary="Summary", script=VALID_SCRIPT_TEXT
        )

        results = generator.generate_multiple("テスト")
        assert len(results) == 1


# ---------------------------------------------------------------------------
# Test: Batch Generation
# ---------------------------------------------------------------------------

class TestBatchGeneration:
    """Tests for batch script generation across multiple themes."""

    def test_generate_batch_multiple_themes(self, generator, mock_client):
        """Batch with multiple themes."""
        mock_client.messages.create.return_value = _make_api_response(
            title="Batch Title",
            summary="Batch Summary",
            script=VALID_SCRIPT_TEXT,
        )

        results = generator.generate_batch(
            themes=["猫の飼い方", "投資入門"],
            count_per_theme=2,
        )

        assert len(results) == 4
        themes_seen = {r["theme"] for r in results}
        assert "猫の飼い方" in themes_seen
        assert "投資入門" in themes_seen


# ---------------------------------------------------------------------------
# Test: Save to JSON
# ---------------------------------------------------------------------------

class TestSaveToJson:
    """Tests for JSON file saving."""

    def test_save_to_json(self, temp_json):
        """Verify JSON output format."""
        scripts = [
            {
                "title": "Test Title 1",
                "summary": "Summary 1",
                "script": "Script body 1",
                "theme": "猫の飼い方",
                "tags": ["猫", "ペット"],
                "char_count": 13,
            },
            {
                "title": "Test Title 2",
                "summary": "Summary 2",
                "script": "Script body 2",
                "theme": "投資入門",
                "tags": ["投資"],
                "char_count": 13,
            },
        ]

        save_to_json(scripts, str(temp_json))

        with open(temp_json, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert len(loaded) == 2
        assert loaded[0]["title"] == "Test Title 1"
        assert loaded[0]["summary"] == "Summary 1"
        assert loaded[0]["script"] == "Script body 1"
        assert loaded[0]["theme"] == "猫の飼い方"
        assert loaded[0]["tags"] == ["猫", "ペット"]
        assert loaded[0]["char_count"] == 13
        assert loaded[1]["title"] == "Test Title 2"

    def test_save_to_json_empty_list(self, temp_json):
        """Saving empty list creates valid empty JSON array."""
        save_to_json([], str(temp_json))

        with open(temp_json, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert loaded == []

    def test_save_to_json_unicode(self, temp_json):
        """Verify Japanese characters are preserved."""
        scripts = [
            {
                "title": "猫の飼い方完全ガイド",
                "summary": "日本語サマリー",
                "script": "日本語のスクリプト本文",
                "theme": "猫の飼い方",
                "tags": ["猫"],
                "char_count": 10,
            },
        ]

        save_to_json(scripts, str(temp_json))

        with open(temp_json, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert loaded[0]["title"] == "猫の飼い方完全ガイド"
        assert loaded[0]["script"] == "日本語のスクリプト本文"


# ---------------------------------------------------------------------------
# Test: Save to Database
# ---------------------------------------------------------------------------

class TestSaveToDatabase:
    """Tests for database insertion."""

    def test_save_to_database(self, temp_db):
        """Verify DB insertion with temp SQLite."""
        scripts = [
            {
                "title": "DB Test Title 1",
                "summary": "DB Summary 1",
                "script": "DB Script 1",
                "theme": "猫の飼い方",
            },
            {
                "title": "DB Test Title 2",
                "summary": "DB Summary 2",
                "script": "DB Script 2",
                "theme": "投資入門",
            },
        ]

        ids = save_to_database(scripts, db_path=temp_db)

        assert len(ids) == 2
        assert all(isinstance(i, int) for i in ids)

        conn = sqlite3.connect(str(temp_db))
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, summary, script, status FROM videos")
        rows = cursor.fetchall()
        conn.close()

        assert len(rows) == 2
        assert rows[0][1] == "DB Test Title 1"
        assert rows[0][2] == "DB Summary 1"
        assert rows[0][3] == "DB Script 1"
        assert rows[0][4] == "planned"
        assert rows[1][1] == "DB Test Title 2"

    def test_save_to_database_empty_list(self, temp_db):
        """Saving empty list returns empty ID list."""
        ids = save_to_database([], db_path=temp_db)
        assert ids == []

    def test_save_to_database_preserves_existing(self, temp_db):
        """New inserts do not overwrite existing rows."""
        first_batch = [
            {
                "title": "First",
                "summary": "First",
                "script": "First",
            }
        ]
        second_batch = [
            {
                "title": "Second",
                "summary": "Second",
                "script": "Second",
            }
        ]

        ids1 = save_to_database(first_batch, db_path=temp_db)
        ids2 = save_to_database(second_batch, db_path=temp_db)

        assert len(ids1) == 1
        assert len(ids2) == 1
        assert ids1[0] != ids2[0]

        conn = sqlite3.connect(str(temp_db))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM videos")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 2


# ---------------------------------------------------------------------------
# Test: CLI Argument Parser
# ---------------------------------------------------------------------------

class TestCliArgs:
    """Tests for CLI argument parsing."""

    def test_cli_args_theme(self):
        """Verify --theme is parsed correctly."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "猫の飼い方"])
        assert args.theme == "猫の飼い方"

    def test_cli_args_theme_with_count(self):
        """Verify --theme and --count are parsed together."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "投資", "--count", "5"])
        assert args.theme == "投資"
        assert args.count == 5

    def test_cli_args_short_flags(self):
        """Verify short flags -t, -n, -o work."""
        parser = build_cli_parser()
        args = parser.parse_args(["-t", "料理", "-n", "3", "-o", "out.json"])
        assert args.theme == "料理"
        assert args.count == 3
        assert args.output == "out.json"

    def test_cli_args_save_db(self):
        """Verify --save-db flag is parsed."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト", "--save-db"])
        assert args.save_db is True

    def test_cli_args_output(self):
        """Verify --output is parsed."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト", "--output", "out.json"])
        assert args.output == "out.json"

    def test_cli_args_preview(self):
        """Verify --preview flag is parsed."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト", "--preview"])
        assert args.preview is True

    def test_cli_args_model(self):
        """Verify --model is parsed with custom value."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト", "--model", "custom-model"])
        assert args.model == "custom-model"

    def test_cli_args_model_default(self):
        """Verify default model value."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト"])
        assert args.model == "claude-haiku-4-5-20250929"

    def test_cli_args_batch_file(self):
        """Verify --batch-file is parsed."""
        parser = build_cli_parser()
        args = parser.parse_args(["--batch-file", "themes.txt"])
        assert args.batch_file == "themes.txt"

    def test_cli_args_count_default(self):
        """Verify default count is 1."""
        parser = build_cli_parser()
        args = parser.parse_args(["--theme", "テスト"])
        assert args.count == 1


# ---------------------------------------------------------------------------
# Test: API Response Parsing
# ---------------------------------------------------------------------------

class TestApiResponseParsing:
    """Tests for _parse_ai_response edge cases."""

    def test_parse_json_in_code_block(self, generator, mock_client):
        """API response wrapped in markdown code block."""
        json_str = json.dumps(
            {
                "title": "Code Block Title",
                "summary": "Summary",
                "script": VALID_SCRIPT_TEXT,
                "tags": ["test"],
            }
        )
        wrapped = f"```json\n{json_str}\n```"

        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = wrapped
        mock_response.content = [mock_content_block]
        mock_client.messages.create.return_value = mock_response

        result = generator.generate_script("テスト")
        assert result is not None
        assert result["title"] == "Code Block Title"

    def test_parse_json_with_surrounding_text(self, generator, mock_client):
        """API response with text around JSON."""
        json_str = json.dumps(
            {
                "title": "Surrounded Title",
                "summary": "Summary",
                "script": VALID_SCRIPT_TEXT,
                "tags": [],
            }
        )
        wrapped = f"Here is the result:\n{json_str}\nEnd of result."

        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = wrapped
        mock_response.content = [mock_content_block]
        mock_client.messages.create.return_value = mock_response

        result = generator.generate_script("テスト")
        assert result is not None
        assert result["title"] == "Surrounded Title"


# ---------------------------------------------------------------------------
# Test: Rate Limit Retry
# ---------------------------------------------------------------------------

class TestRateLimitRetry:
    """Tests for rate limit retry behavior."""

    @patch("ai_script_generator.time.sleep")
    def test_rate_limit_retry(self, mock_sleep, generator, mock_client):
        """Rate limit error triggers exponential backoff retry."""
        rate_limit_error = Exception("429 rate limit exceeded")
        valid_response = _make_api_response(
            title="After Retry",
            summary="Summary",
            script=VALID_SCRIPT_TEXT,
        )

        mock_client.messages.create.side_effect = [
            rate_limit_error,
            valid_response,
        ]

        result = generator.generate_script("テスト")

        assert result is not None
        assert result["title"] == "After Retry"
        mock_sleep.assert_called()
