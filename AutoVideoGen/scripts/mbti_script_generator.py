"""
MBTI台本自動生成システム

テーマ（MBTIタイプ）とカテゴリから、
YouTube Shorts向け動画の「タイトル + 台本」を自動生成する。

Usage:
    # 特定タイプの全カテゴリ台本を生成
    python scripts/mbti_script_generator.py --type INTJ

    # 特定タイプ+カテゴリの台本を生成
    python scripts/mbti_script_generator.py --type INFP --category love

    # 全タイプの特定カテゴリ台本を生成
    python scripts/mbti_script_generator.py --category relatable

    # 生成してデータベースに登録
    python scripts/mbti_script_generator.py --type INTJ --save-db

    # JSON出力
    python scripts/mbti_script_generator.py --type INTJ --output scripts_intj.json
"""

import argparse
import json
import random
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from mbti_data import MBTI_TYPES, SCRIPT_CATEGORIES, COGNITIVE_FUNCTIONS

DB_PATH = Path(__file__).parent.parent / "database.db"


def generate_personality_script(mbti_type: str, data: dict) -> dict:
    """性格解説の台本を生成"""
    functions_desc = "、".join(
        f"{f}（{COGNITIVE_FUNCTIONS[f].split(' - ')[1]}）"
        for f in data["functions"][:2]
    )

    script = (
        f"{mbti_type}タイプ、通称「{data['name']}」について解説します。\n\n"
        f"全人口のわずか{data['rare_percent']}しかいないこのタイプ。\n"
        f"別名「{data['nickname']}」とも呼ばれています。\n\n"
        f"主要な認知機能は{functions_desc}。\n\n"
        f"最大の強みは、{data['strengths'][0]}と{data['strengths'][1]}。\n"
        f"{data['traits'][0]}で{data['traits'][1]}な性格は、周囲からも一目置かれます。\n\n"
        f"一方で、{data['weaknesses'][0]}が弱点になることも。\n\n"
        f"有名人では{data['famous'][0]}や{data['famous'][1]}がこのタイプ。\n\n"
        f"あなたの周りにも{mbti_type}はいますか？\n"
        f"コメントで教えてください。"
    )

    return {
        "title": f"【MBTI】{mbti_type}「{data['name']}」完全解説 - {data['nickname']}の真実",
        "summary": f"{mbti_type}タイプの性格特性、認知機能、強み弱みを徹底解説",
        "script": script,
    }


def generate_love_script(mbti_type: str, data: dict) -> dict:
    """恋愛パターンの台本を生成"""
    script = (
        f"{mbti_type}の恋愛、知りたくないですか？\n\n"
        f"「{data['name']}」タイプの恋愛スタイルは一言で言うと、\n"
        f"{data['love_style']}\n\n"
        f"愛情表現の特徴は、\n"
        f"{data['love_expression']}\n\n"
        f"でも気をつけて。\n"
        f"{data['love_weakness']}\n\n"
        f"相性が良いのは{data['best_match'][0]}タイプ。\n"
        f"逆に{data['challenging_match'][0]}とは衝突しやすい傾向があります。\n\n"
        f"{mbti_type}の恋愛に心当たりがある人、いいねで教えてください。"
    )

    return {
        "title": f"【MBTI恋愛】{mbti_type}の恋愛パターン - {data['name']}が本気で愛する時",
        "summary": f"{mbti_type}タイプの恋愛スタイル、愛情表現、相性を解説",
        "script": script,
    }


def generate_work_script(mbti_type: str, data: dict) -> dict:
    """仕事スタイルの台本を生成"""
    careers = "、".join(data["ideal_careers"][:3])

    script = (
        f"{mbti_type}が仕事で本領発揮するとどうなるか。\n\n"
        f"「{data['name']}」タイプの仕事スタイル。\n"
        f"{data['work_style']}\n\n"
        f"適職は{careers}など。\n\n"
        f"最大の武器は{data['strengths'][0]}。\n"
        f"これを活かせる環境なら、誰にも負けません。\n\n"
        f"ただし{data['weaknesses'][0]}には要注意。\n"
        f"これが足を引っ張ることも。\n\n"
        f"あなたの職場の{mbti_type}はどんな働き方をしていますか？"
    )

    return {
        "title": f"【MBTI仕事】{mbti_type}の仕事術 - {data['name']}が無双する瞬間",
        "summary": f"{mbti_type}タイプの仕事スタイル、適職、強み弱みを解説",
        "script": script,
    }


def generate_stress_script(mbti_type: str, data: dict) -> dict:
    """ストレス反応の台本を生成"""
    triggers = "、".join(data["stress_triggers"][:3])

    script = (
        f"{mbti_type}がストレスで壊れる時。\n\n"
        f"普段は{data['traits'][0]}な{mbti_type}。\n"
        f"しかし{triggers}に直面すると、一変します。\n\n"
        f"{data['stress_response']}\n\n"
        f"これは{data['functions'][3]}（{COGNITIVE_FUNCTIONS[data['functions'][3]].split(' - ')[0]}）\n"
        f"という劣等機能の暴走です。\n\n"
        f"普段抑えている部分が、限界を超えた時に爆発するのです。\n\n"
        f"対処法は、{data['growth_tips'][0]}\n\n"
        f"思い当たる{mbti_type}の方、コメントで共有してください。"
    )

    return {
        "title": f"【MBTI闇】{mbti_type}が壊れる瞬間 - {data['name']}のストレス反応がヤバい",
        "summary": f"{mbti_type}タイプのストレストリガーと劣等機能暴走パターンを解説",
        "script": script,
    }


def generate_relatable_script(mbti_type: str, data: dict) -> dict:
    """あるあるの台本を生成"""
    items = random.sample(data["relatable"], min(5, len(data["relatable"])))
    relatable_text = "\n".join(f"「{item}」" for item in items)

    script = (
        f"{mbti_type}あるある、いくつ当てはまる？\n\n"
        f"{relatable_text}\n\n"
        f"3つ以上当てはまったら、あなたは間違いなく{mbti_type}です。\n\n"
        f"全部当てはまった人はコメントで教えてください。"
    )

    return {
        "title": f"【MBTIあるある】{mbti_type}にしかわからない5つのこと - {data['name']}の日常",
        "summary": f"{mbti_type}タイプの共感必至なあるあるネタ",
        "script": script,
    }


def generate_compatibility_script(mbti_type: str, data: dict) -> dict:
    """相性分析の台本を生成"""
    best = data["best_match"]
    worst = data["challenging_match"]
    best_names = [MBTI_TYPES[t]["name"] for t in best]
    worst_names = [MBTI_TYPES[t]["name"] for t in worst]

    script = (
        f"{mbti_type}と最も相性が良いタイプ、悪いタイプを発表します。\n\n"
        f"ベスト相性は、\n"
        f"第1位 {best[0]}「{best_names[0]}」\n"
        f"{mbti_type}の{data['traits'][0]}さと{best[0]}の特性が完璧に補い合います。\n\n"
        f"第2位 {best[1]}「{best_names[1]}」\n"
        f"知的な刺激と深い理解が得られる関係です。\n\n"
        f"逆にワースト相性は、\n"
        f"{worst[0]}「{worst_names[0]}」\n"
        f"価値観の違いから衝突しやすい組み合わせ。\n\n"
        f"ただし相性は目安。どのタイプとも素晴らしい関係は築けます。\n\n"
        f"あなたのパートナーは何タイプ？コメントで教えてください。"
    )

    return {
        "title": f"【MBTI相性】{mbti_type}のベスト&ワースト相性ランキング - {data['name']}の運命の相手",
        "summary": f"{mbti_type}タイプの恋愛・友人関係の相性分析",
        "script": script,
    }


def generate_shadow_script(mbti_type: str, data: dict) -> dict:
    """裏の顔の台本を生成"""
    shadow_func = data["functions"][3]

    script = (
        f"{mbti_type}の裏の顔、知っていますか？\n\n"
        f"普段は{data['traits'][0]}で{data['traits'][1]}な「{data['name']}」。\n"
        f"しかし限界を超えた時、別人になります。\n\n"
        f"{data['shadow_side']}\n\n"
        f"これは劣等機能{shadow_func}の暴走。\n"
        f"{COGNITIVE_FUNCTIONS[shadow_func]}\n\n"
        f"普段使わないこの機能が、ストレスで制御不能になるのです。\n\n"
        f"この闇落ちを経験したことがある{mbti_type}の方、\n"
        f"あなたは一人じゃありません。\n"
        f"フォローして、一緒にMBTIを深掘りしましょう。"
    )

    return {
        "title": f"【MBTI裏の顔】{mbti_type}の闇落ち - 「{data['name']}」が別人になる瞬間",
        "summary": f"{mbti_type}タイプのシャドウ機能と闇落ちパターンを徹底分析",
        "script": script,
    }


def generate_growth_script(mbti_type: str, data: dict) -> dict:
    """成長のヒントの台本を生成"""
    tips = data["growth_tips"]

    script = (
        f"{mbti_type}が次のレベルに進むための3つのヒント。\n\n"
        f"1つ目。{tips[0]}\n"
        f"これができれば、{data['weaknesses'][0]}を克服できます。\n\n"
        f"2つ目。{tips[1]}\n"
        f"{data['strengths'][0]}をさらに磨くことにつながります。\n\n"
        f"3つ目。{tips[2]}\n"
        f"これが最も難しいかもしれません。\n\n"
        f"全人口の{data['rare_percent']}しかいない{mbti_type}。\n"
        f"あなたの成長は、世界をより良くします。\n\n"
        f"保存して、何度も見返してください。"
    )

    return {
        "title": f"【MBTI成長】{mbti_type}が覚醒する3つの方法 - {data['name']}の進化論",
        "summary": f"{mbti_type}タイプの自己成長と弱点克服のヒント",
        "script": script,
    }


# カテゴリ→生成関数のマッピング
GENERATORS = {
    "personality": generate_personality_script,
    "love": generate_love_script,
    "work": generate_work_script,
    "stress": generate_stress_script,
    "relatable": generate_relatable_script,
    "compatibility": generate_compatibility_script,
    "shadow": generate_shadow_script,
    "growth": generate_growth_script,
}


def generate_script(mbti_type: str, category: str) -> Optional[dict]:
    """指定タイプ・カテゴリの台本を生成"""
    if mbti_type not in MBTI_TYPES:
        print(f"Error: Unknown MBTI type '{mbti_type}'")
        return None
    if category not in GENERATORS:
        print(f"Error: Unknown category '{category}'")
        return None

    data = MBTI_TYPES[mbti_type]
    generator = GENERATORS[category]
    result = generator(mbti_type, data)
    result["mbti_type"] = mbti_type
    result["category"] = category
    return result


def generate_all_for_type(mbti_type: str) -> list:
    """指定タイプの全カテゴリ台本を生成"""
    results = []
    for category in GENERATORS:
        result = generate_script(mbti_type, category)
        if result:
            results.append(result)
    return results


def generate_all_for_category(category: str) -> list:
    """全タイプの指定カテゴリ台本を生成"""
    results = []
    for mbti_type in MBTI_TYPES:
        result = generate_script(mbti_type, category)
        if result:
            results.append(result)
    return results


def save_to_database(scripts: list) -> list:
    """台本をデータベースに保存"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    added_ids = []

    for s in scripts:
        cursor.execute(
            """
            INSERT INTO videos (title, summary, script, status, created_at)
            VALUES (?, ?, ?, 'planned', ?)
            """,
            (s["title"], s.get("summary", ""), s["script"], datetime.now().isoformat()),
        )
        task_id = cursor.lastrowid
        added_ids.append(task_id)
        print(f"  [ID:{task_id}] {s['title'][:60]}")

    conn.commit()
    conn.close()
    return added_ids


def save_to_json(scripts: list, output_path: str) -> None:
    """台本をJSONファイルに保存"""
    clean_scripts = [
        {"title": s["title"], "summary": s.get("summary", ""), "script": s["script"]}
        for s in scripts
    ]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_scripts, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(scripts)} scripts to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="MBTI台本自動生成システム")
    parser.add_argument("--type", "-t", help="MBTIタイプ (e.g., INTJ, INFP)")
    parser.add_argument(
        "--category", "-c",
        choices=list(GENERATORS.keys()),
        help="カテゴリ",
    )
    parser.add_argument("--save-db", action="store_true", help="データベースに保存")
    parser.add_argument("--output", "-o", help="JSON出力パス")
    parser.add_argument("--list-types", action="store_true", help="全タイプを表示")
    parser.add_argument("--list-categories", action="store_true", help="全カテゴリを表示")
    parser.add_argument("--preview", action="store_true", help="プレビュー表示")

    args = parser.parse_args()

    if args.list_types:
        print("\n=== MBTI 16タイプ ===")
        for t, d in MBTI_TYPES.items():
            print(f"  {t}: {d['name']}（{d['nickname']}）- {d['rare_percent']}")
        return 0

    if args.list_categories:
        print("\n=== カテゴリ一覧 ===")
        for c, d in SCRIPT_CATEGORIES.items():
            print(f"  {c}: {d['emoji']} {d['name']} - {d['description']}")
        return 0

    scripts = []

    if args.type and args.category:
        result = generate_script(args.type.upper(), args.category)
        if result:
            scripts = [result]
    elif args.type:
        scripts = generate_all_for_type(args.type.upper())
    elif args.category:
        scripts = generate_all_for_category(args.category)
    else:
        parser.print_help()
        print("\nExamples:")
        print("  python scripts/mbti_script_generator.py --type INTJ --category love")
        print("  python scripts/mbti_script_generator.py --type INFP --save-db")
        print("  python scripts/mbti_script_generator.py --category relatable --output relatable.json")
        return 0

    if not scripts:
        print("No scripts generated.")
        return 1

    print(f"\n=== Generated {len(scripts)} script(s) ===\n")

    for s in scripts:
        print(f"Title: {s['title']}")
        if args.preview:
            print(f"Script:\n{s['script']}")
        else:
            print(f"Script: ({len(s['script'])} chars)")
        print()

    if args.save_db:
        print("Saving to database...")
        ids = save_to_database(scripts)
        print(f"\n{len(ids)} tasks added to database.")

    if args.output:
        save_to_json(scripts, args.output)

    return 0


if __name__ == "__main__":
    sys.exit(main())
