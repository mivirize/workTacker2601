#!/usr/bin/env python
"""
System Status Check Tool

Usage:
  python tools/status.py
"""
import sqlite3
import requests
from pathlib import Path
from datetime import datetime
import sys
import io

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent.parent / "database.db"
API_URL = "http://localhost:8000"


def check_api_health():
    """API health check"""
    try:
        response = requests.get(f"{API_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            return "[OK] Online"
        return f"[WARN] Status: {response.status_code}"
    except requests.exceptions.ConnectionError:
        return "[ERROR] Offline"
    except Exception as e:
        return f"[ERROR] {e}"


def get_task_stats():
    """タスク統計を取得"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    stats = {}
    for status in ["planned", "processing", "downloaded", "uploaded", "failed"]:
        cursor.execute("SELECT COUNT(*) FROM videos WHERE status = ?", (status,))
        stats[status] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM videos")
    stats["total"] = cursor.fetchone()[0]

    conn.close()
    return stats


def get_workers():
    """ワーカー情報を取得"""
    try:
        response = requests.get(f"{API_URL}/api/v1/workers", timeout=5)
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []


def get_recent_tasks(limit=5):
    """最近のタスクを取得"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, title, status, created_at
        FROM videos
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    tasks = cursor.fetchall()
    conn.close()
    return tasks


def main():
    print("=" * 60)
    print("  AutoVideoGen System Status")
    print("=" * 60)
    print()

    # API Status
    print(f"API Server: {check_api_health()}")
    print()

    # Task Statistics
    print("Task Statistics:")
    stats = get_task_stats()
    print(f"  - Planned:    {stats.get('planned', 0)}")
    print(f"  - Processing: {stats.get('processing', 0)}")
    print(f"  - Downloaded: {stats.get('downloaded', 0)}")
    print(f"  - Uploaded:   {stats.get('uploaded', 0)}")
    print(f"  - Failed:     {stats.get('failed', 0)}")
    print(f"  - Total:      {stats.get('total', 0)}")
    print()

    # Workers
    workers = get_workers()
    print(f"Workers: {len(workers)}")
    for w in workers:
        status_icon = "[IDLE]" if w.get("status") == "idle" else "[BUSY]" if w.get("status") == "busy" else "[OFF]"
        print(f"  - {status_icon} {w.get('hostname', 'Unknown')} ({w.get('ip_address', 'N/A')})")
    print()

    # Recent Tasks
    print("Recent Tasks:")
    tasks = get_recent_tasks()
    for task in tasks:
        task_id, title, status, created_at = task
        status_icon = {
            "planned": "[PLAN]",
            "processing": "[PROC]",
            "downloaded": "[DONE]",
            "uploaded": "[UP]",
            "failed": "[FAIL]",
        }.get(status, "[?]")
        title_short = (title[:40] + "...") if title and len(title) > 40 else (title or "No title")
        print(f"  {status_icon} [{task_id}] {title_short}")
    print()

    print("=" * 60)


if __name__ == "__main__":
    main()
