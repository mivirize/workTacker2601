#!/usr/bin/env python
"""
タスク追加CLI

使用方法:
  python tools/add_task.py --title "動画タイトル" --script "台本内容"
  python tools/add_task.py --file scripts.json
"""
import argparse
import json
import sqlite3
from pathlib import Path
from datetime import datetime


DB_PATH = Path(__file__).parent.parent / "database.db"


def add_task(title: str, script: str, summary: str = "") -> int:
    """タスクを追加してIDを返す"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO videos (title, summary, script, status, created_at)
        VALUES (?, ?, ?, 'planned', ?)
        """,
        (title, summary, script, datetime.now().isoformat()),
    )
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return task_id


def add_tasks_from_file(filepath: str) -> list:
    """JSONファイルから複数タスクを追加"""
    with open(filepath, "r", encoding="utf-8") as f:
        tasks = json.load(f)

    added_ids = []
    for task in tasks:
        task_id = add_task(
            title=task.get("title", ""),
            script=task.get("script", ""),
            summary=task.get("summary", ""),
        )
        added_ids.append(task_id)
        print(f"Added task ID: {task_id} - {task.get('title', '')[:50]}")

    return added_ids


def main():
    parser = argparse.ArgumentParser(description="AutoVideoGen タスク追加ツール")
    parser.add_argument("--title", "-t", help="動画タイトル")
    parser.add_argument("--script", "-s", help="台本内容")
    parser.add_argument("--summary", help="動画概要")
    parser.add_argument("--file", "-f", help="JSONファイルから読み込み")

    args = parser.parse_args()

    if args.file:
        ids = add_tasks_from_file(args.file)
        print(f"\n{len(ids)} tasks added successfully!")
    elif args.title and args.script:
        task_id = add_task(args.title, args.script, args.summary or "")
        print(f"Task added successfully! ID: {task_id}")
    else:
        parser.print_help()
        print("\nExample:")
        print('  python tools/add_task.py -t "テスト動画" -s "これはテスト台本です"')


if __name__ == "__main__":
    main()
