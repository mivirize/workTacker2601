"""
AI-powered Universal Script Generator

Claude APIを使用して、任意のテーマからYouTube Shorts台本を生成する。
テーマを入力すると、AIがそのテーマを分析し、魅力的な短編動画台本を作成する。

Usage:
    python scripts/ai_script_generator.py --theme "猫の飼い方"
    python scripts/ai_script_generator.py --theme "プログラミング入門" --count 5
    python scripts/ai_script_generator.py --theme "投資の基本" --save-db
    python scripts/ai_script_generator.py --theme "料理のコツ" --output scripts.json
    python scripts/ai_script_generator.py --theme "INTJ 性格分析" --preview
"""

import argparse
import json
import logging
import os
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent.parent / "database.db"

CHAR_MIN = 380
CHAR_MAX = 450
MAX_RETRIES = 3
DEFAULT_MODEL = "claude-haiku-4-5-20250929"
DEFAULT_SCRIPT_COUNT = 1

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def build_system_prompt() -> str:
    """Build the system prompt for universal script generation."""
    return (
        "あなたはYouTube Shortsの台本プロライターです。\n"
        "どんなテーマでも、視聴者を引きつける短編動画台本を作成できます。\n\n"
        "## 台本構造ルール\n"
        "1. **フック（最初の1文）**: 3秒で注意を引く衝撃的・共感的な一言。"
        "疑問文や断言が効果的。\n"
        "2. **メイン内容**: テーマについての深い分析・有益な情報。"
        "表面的な説明ではなく「なぜそうなのか」「どう活かせるか」を具体的に。\n"
        "3. **ツイスト**: 意外な視点、裏の真実、逆説的な事実を1つ入れる。\n"
        "4. **CTA**: 視聴者に行動を促す一言（コメント、フォロー、保存など）。\n\n"
        "## 品質基準\n"
        "- 具体的な場面描写やデータを使う。\n"
        "- 箇条書き禁止。自然な語り口調で書く。\n"
        "- 「〜と言われています」等の他人事表現は禁止。断言する。\n"
        "- テーマの本質に切り込む深い内容にする。\n"
        "- ターゲット層が「保存したい」と思うほどの有益さを目指す。\n\n"
        "## 文字数制限（厳守）\n"
        f"- 台本本文は{CHAR_MIN}文字以上{CHAR_MAX}文字以下（厳守）。\n"
        "- タイトルと要約は文字数に含めない。\n"
        "- 改行は文字数に含む。\n\n"
        "## 出力フォーマット\n"
        "必ず以下のJSON形式で出力してください。JSON以外のテキストは含めないでください:\n"
        '{"title": "動画タイトル", "summary": "1行の要約", '
        '"script": "台本本文", "tags": ["タグ1", "タグ2", "タグ3"]}\n'
    )


def build_theme_prompt(theme: str, variation_hint: str = "") -> str:
    """Build a user prompt for the given theme.

    Args:
        theme: The topic/theme to generate a script about.
        variation_hint: Optional hint for creating varied scripts
                        (e.g. "different angle", "deeper analysis").
    """
    base = (
        f"テーマ: 「{theme}」\n\n"
        f"このテーマについて、YouTube Shortsの台本を1本作成してください。\n"
        f"視聴者が思わず最後まで見てしまうような、魅力的な内容にしてください。\n"
        f"テーマに最も適した切り口で書いてください。\n"
    )

    if variation_hint:
        base += (
            f"\n注意: 以下の指示に従って変化をつけてください: {variation_hint}\n"
        )

    return base


VARIATION_HINTS = [
    "",
    "前回とは異なる切り口で、意外な視点から分析してください。",
    "初心者にもわかりやすく、基本から丁寧に解説してください。",
    "上級者向けの深い知識やプロのテクニックを紹介してください。",
    "よくある誤解や間違いを指摘する内容にしてください。",
    "具体的な数字やデータを使って説得力のある内容にしてください。",
    "感情に訴えかける、ストーリー調の台本にしてください。",
    "比較や対比を使って、違いを際立たせる内容にしてください。",
]


def _create_anthropic_client(api_key: Optional[str] = None):
    """Create and return an Anthropic client instance."""
    try:
        import anthropic
    except ImportError as exc:
        raise ImportError(
            "anthropic package is required. Install with: pip install anthropic"
        ) from exc

    resolved_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not resolved_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable is not set. "
            "Set it or pass api_key parameter."
        )
    return anthropic.Anthropic(api_key=resolved_key)


def _parse_ai_response(response_text: str) -> Optional[dict]:
    """Parse the AI response text into a structured dict."""
    text = response_text.strip()

    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON from markdown code block
    json_start = text.find("{")
    json_end = text.rfind("}") + 1
    if json_start >= 0 and json_end > json_start:
        try:
            return json.loads(text[json_start:json_end])
        except json.JSONDecodeError:
            pass

    logger.warning("Failed to parse AI response as JSON")
    return None


def validate_script(script: str) -> tuple:
    """
    Validate script character count.

    Returns:
        (is_valid, message) tuple
    """
    char_count = len(script)
    if char_count < CHAR_MIN:
        return (False, f"Too short: {char_count} chars (min: {CHAR_MIN})")
    if char_count > CHAR_MAX:
        return (False, f"Too long: {char_count} chars (max: {CHAR_MAX})")
    return (True, f"Valid: {char_count} chars")


def _call_api_with_retry(
    client, model: str, system_prompt: str, user_prompt: str
) -> Optional[dict]:
    """Call the API with exponential backoff retry on rate limits."""
    for attempt in range(MAX_RETRIES):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            content_text = response.content[0].text
            return _parse_ai_response(content_text)
        except Exception as exc:
            error_str = str(exc).lower()
            is_rate_limit = "rate" in error_str or "429" in error_str
            if is_rate_limit and attempt < MAX_RETRIES - 1:
                wait_time = 2 ** (attempt + 1)
                logger.warning(
                    "Rate limited, waiting %d seconds (attempt %d/%d)",
                    wait_time,
                    attempt + 1,
                    MAX_RETRIES,
                )
                time.sleep(wait_time)
                continue
            logger.error("API call failed: %s", exc)
            return None
    return None


class AIScriptGenerator:
    """AI-powered universal script generator using Claude API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
    ):
        self._api_key = api_key
        self._model = model
        self._client = None
        self._system_prompt = build_system_prompt()

    @property
    def client(self):
        """Lazy-initialize the Anthropic client."""
        if self._client is None:
            self._client = _create_anthropic_client(self._api_key)
        return self._client

    @property
    def system_prompt(self) -> str:
        """Return the system prompt."""
        return self._system_prompt

    def generate_script(
        self, theme: str, variation_hint: str = ""
    ) -> Optional[dict]:
        """
        Generate a single script for the given theme.

        Retries up to MAX_RETRIES times if validation fails.

        Args:
            theme: The topic/theme to generate a script about.
            variation_hint: Optional hint for varied content.

        Returns:
            Script dict with title, summary, script, tags, etc. or None.
        """
        if not theme or not theme.strip():
            logger.error("Theme cannot be empty")
            return None

        user_prompt = build_theme_prompt(theme, variation_hint)

        for attempt in range(MAX_RETRIES):
            result = _call_api_with_retry(
                self.client, self._model, self._system_prompt, user_prompt
            )
            if result is None:
                break

            script_text = result.get("script", "")
            is_valid, message = validate_script(script_text)

            if is_valid:
                return {
                    "title": result.get("title", ""),
                    "summary": result.get("summary", ""),
                    "script": script_text,
                    "theme": theme,
                    "tags": result.get("tags", []),
                    "char_count": len(script_text),
                }

            logger.warning(
                "Validation failed (attempt %d/%d): %s",
                attempt + 1,
                MAX_RETRIES,
                message,
            )

            if attempt < MAX_RETRIES - 1:
                adjustment = (
                    "もっと長く" if len(script_text) < CHAR_MIN else "もっと短く"
                )
                user_prompt = (
                    f"{user_prompt}\n\n"
                    f"前回の台本は{len(script_text)}文字でした。"
                    f"{adjustment}書いてください。"
                    f"{CHAR_MIN}文字以上{CHAR_MAX}文字以下を厳守してください。"
                )

        logger.error("Script generation failed for theme: %s", theme)
        return None

    def generate_multiple(
        self, theme: str, count: int = DEFAULT_SCRIPT_COUNT
    ) -> list:
        """Generate multiple scripts for the same theme with variations.

        Args:
            theme: The topic/theme to generate scripts about.
            count: Number of scripts to generate.

        Returns:
            List of script dicts.
        """
        results = []
        for i in range(count):
            hint = VARIATION_HINTS[i % len(VARIATION_HINTS)]
            result = self.generate_script(theme, variation_hint=hint)
            if result is not None:
                results = [*results, result]
        return results

    def generate_batch(
        self,
        themes: list[str],
        count_per_theme: int = 1,
    ) -> list:
        """Generate scripts for multiple themes.

        Args:
            themes: List of topics/themes.
            count_per_theme: Scripts per theme.

        Returns:
            List of all generated script dicts.
        """
        results = []
        total = len(themes) * count_per_theme
        done = 0

        for theme in themes:
            for i in range(count_per_theme):
                done += 1
                hint = VARIATION_HINTS[i % len(VARIATION_HINTS)]
                logger.info(
                    "Generating %d/%d: %s",
                    done,
                    total,
                    theme[:40],
                )
                result = self.generate_script(theme, variation_hint=hint)
                if result is not None:
                    results = [*results, result]

        return results


def save_to_database(scripts: list, db_path: Optional[Path] = None) -> list:
    """
    Save scripts to the SQLite database.

    Returns list of inserted row IDs.
    """
    resolved_path = db_path if db_path is not None else DB_PATH
    conn = sqlite3.connect(str(resolved_path))
    cursor = conn.cursor()
    added_ids = []

    try:
        for script in scripts:
            cursor.execute(
                """
                INSERT INTO videos (title, summary, script, status, created_at)
                VALUES (?, ?, ?, 'planned', ?)
                """,
                (
                    script["title"],
                    script.get("summary", ""),
                    script["script"],
                    datetime.now().isoformat(),
                ),
            )
            row_id = cursor.lastrowid
            added_ids = [*added_ids, row_id]
            logger.info("  [ID:%d] %s", row_id, script["title"][:60])

        conn.commit()
    except sqlite3.Error as exc:
        logger.error("Database error: %s", exc)
        conn.rollback()
        raise
    finally:
        conn.close()

    return added_ids


def save_to_json(scripts: list, output_path: str) -> None:
    """Save scripts to a JSON file."""
    clean_scripts = [
        {
            "title": s["title"],
            "summary": s.get("summary", ""),
            "script": s["script"],
            "theme": s.get("theme", ""),
            "tags": s.get("tags", []),
            "char_count": s.get("char_count", len(s["script"])),
        }
        for s in scripts
    ]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_scripts, f, ensure_ascii=False, indent=2)
    logger.info("Saved %d scripts to %s", len(scripts), output_path)


def build_cli_parser() -> argparse.ArgumentParser:
    """Build and return the CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="AI台本生成システム - 任意のテーマからYouTube Shorts台本を生成"
    )
    parser.add_argument(
        "--theme", "-t",
        help="テーマ（例: 猫の飼い方, プログラミング入門, INTJ性格分析）",
    )
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=DEFAULT_SCRIPT_COUNT,
        help=f"生成する台本数 (default: {DEFAULT_SCRIPT_COUNT})",
    )
    parser.add_argument(
        "--save-db", action="store_true", help="データベースに保存"
    )
    parser.add_argument("--output", "-o", help="JSON出力パス")
    parser.add_argument(
        "--preview", action="store_true", help="台本本文を表示"
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"使用するClaudeモデル (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--batch-file",
        help="テーマ一覧ファイル（1行1テーマ）を指定してバッチ生成",
    )
    return parser


def _print_results(scripts: list, preview: bool) -> None:
    """Print generated script results."""
    print(f"\n=== Generated {len(scripts)} script(s) ===\n")
    for s in scripts:
        print(f"Title: {s['title']}")
        print(
            f"Theme: {s.get('theme', 'N/A')} | "
            f"Chars: {s.get('char_count', len(s['script']))}"
        )
        tags = s.get("tags", [])
        if tags:
            print(f"Tags: {', '.join(tags)}")
        if preview:
            print(f"Script:\n{s['script']}")
        print()


def main() -> int:
    """Main entry point for CLI."""
    parser = build_cli_parser()
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.batch_file:
        if not args.theme:
            parser.print_help()
            print("\nExamples:")
            print('  python scripts/ai_script_generator.py --theme "猫の飼い方"')
            print('  python scripts/ai_script_generator.py --theme "投資入門" --count 3')
            print('  python scripts/ai_script_generator.py --theme "料理" --save-db')
            print('  python scripts/ai_script_generator.py --batch-file themes.txt')
            return 0
        api_key = input("ANTHROPIC_API_KEY not set. Enter API key: ").strip()
        if not api_key:
            logger.error("API key is required")
            return 1

    generator = AIScriptGenerator(api_key=api_key, model=args.model)
    scripts = []

    try:
        if args.batch_file:
            themes_path = Path(args.batch_file)
            if not themes_path.exists():
                logger.error("Batch file not found: %s", args.batch_file)
                return 1
            themes = [
                line.strip()
                for line in themes_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            scripts = generator.generate_batch(
                themes=themes, count_per_theme=args.count
            )
        elif args.theme:
            scripts = generator.generate_multiple(
                theme=args.theme, count=args.count
            )
        else:
            parser.print_help()
            return 0
    except ValueError as exc:
        logger.error("Configuration error: %s", exc)
        return 1
    except ImportError as exc:
        logger.error("Missing dependency: %s", exc)
        return 1

    if not scripts:
        logger.error("No scripts generated.")
        return 1

    _print_results(scripts, args.preview)

    if args.save_db:
        logger.info("Saving to database...")
        ids = save_to_database(scripts)
        print(f"\n{len(ids)} tasks added to database.")

    if args.output:
        save_to_json(scripts, args.output)

    return 0


if __name__ == "__main__":
    sys.exit(main())
