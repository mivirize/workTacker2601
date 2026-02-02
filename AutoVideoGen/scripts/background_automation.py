"""
Background Vrew Automation Service

This script runs as a background service that:
1. Monitors database for 'planned' videos
2. Processes them automatically using Vrew
3. Logs all activity for remote monitoring

Usage:
    python scripts/background_automation.py --daemon
    python scripts/background_automation.py --status
    python scripts/background_automation.py --process-one

Log file: output/automation.log
"""

import argparse
import json
import logging
import os
import sqlite3
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DB_PATH = PROJECT_DIR / "database.db"
LOG_PATH = PROJECT_DIR / "output" / "automation.log"
STATUS_PATH = PROJECT_DIR / "output" / "automation_status.json"
OUTPUT_DIR = PROJECT_DIR / "output" / "videos"
VREW_PATH = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "vrew" / "Vrew.exe"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def get_status() -> dict:
    """Get current automation status."""
    if STATUS_PATH.exists():
        try:
            with open(STATUS_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "running": False,
        "current_video": None,
        "last_update": None,
        "processed_count": 0,
        "failed_count": 0
    }


def update_status(updates: dict):
    """Update automation status file."""
    status = get_status()
    status.update(updates)
    status["last_update"] = datetime.now().isoformat()
    with open(STATUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(status, f, indent=2, ensure_ascii=False)


def get_planned_videos() -> list:
    """Get all videos with status='planned' from database."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, script FROM videos WHERE status='planned' ORDER BY id")
    videos = cursor.fetchall()
    conn.close()
    return videos


def update_video_status(video_id: int, status: str, file_path: str = ""):
    """Update video status in database."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE videos SET status=?, file_path=? WHERE id=?",
        (status, file_path, video_id)
    )
    conn.commit()
    conn.close()
    logger.info(f"Video {video_id} status updated to '{status}'")


def check_vrew_installed() -> bool:
    """Check if Vrew is installed."""
    return VREW_PATH.exists()


def launch_vrew_automation(video_id: int, title: str, script: str) -> bool:
    """Launch Vrew automation for a single video."""
    try:
        # Import pyautogui here to avoid import errors when just checking status
        import pyautogui
        import pyperclip

        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1

        logger.info(f"Processing video {video_id}: {title[:40]}...")
        update_video_status(video_id, "processing")
        update_status({"current_video": {"id": video_id, "title": title}})

        # Launch Vrew
        logger.info("Launching Vrew...")
        subprocess.Popen([str(VREW_PATH)])
        time.sleep(10)  # Wait for Vrew to load

        # Create new project (Ctrl+N)
        logger.info("Creating new project...")
        pyautogui.hotkey("ctrl", "n")
        time.sleep(2)

        # Navigate to Text-to-Video option
        pyautogui.press("tab")
        time.sleep(0.5)
        pyautogui.press("enter")
        time.sleep(2)

        # Enter title
        logger.info("Entering title and script...")
        pyperclip.copy(title[:50])
        pyautogui.hotkey("ctrl", "v")
        time.sleep(0.5)

        # Tab to script field
        pyautogui.press("tab")
        time.sleep(0.5)

        # Enter script
        pyperclip.copy(script)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(1)

        # Press Next/Continue
        pyautogui.press("enter")
        time.sleep(3)

        # Configure video settings (aspect ratio etc.)
        for _ in range(3):
            pyautogui.press("tab")
            time.sleep(0.3)
        pyautogui.press("enter")
        time.sleep(1)
        pyautogui.press("enter")
        time.sleep(2)

        # Wait for generation (poll for up to 10 minutes)
        logger.info("Waiting for video generation...")
        max_wait = 600  # 10 minutes
        start_time = time.time()

        while time.time() - start_time < max_wait:
            elapsed = int(time.time() - start_time)
            if elapsed % 30 == 0:
                logger.info(f"Generation in progress... ({elapsed}s)")
            time.sleep(5)
            # TODO: Add image recognition to detect completion

        # Export (Ctrl+E)
        logger.info("Starting export...")
        pyautogui.hotkey("ctrl", "e")
        time.sleep(2)

        # Set filename
        safe_title = "".join(c if c.isalnum() else "_" for c in title)[:20]
        filename = f"video_{video_id}_{safe_title}.mp4"
        output_path = OUTPUT_DIR / filename

        pyperclip.copy(str(output_path))
        pyautogui.hotkey("ctrl", "v")
        time.sleep(1)
        pyautogui.press("enter")

        # Wait for export
        logger.info("Waiting for export to complete...")
        time.sleep(60)  # Basic wait

        if output_path.exists():
            update_video_status(video_id, "downloaded", str(output_path))
            logger.info(f"SUCCESS: Video saved to {output_path}")
            return True
        else:
            update_video_status(video_id, "failed")
            logger.error("FAILED: Export did not produce a file")
            return False

    except Exception as e:
        logger.error(f"ERROR: {e}")
        update_video_status(video_id, "failed")
        return False


def process_one():
    """Process a single planned video."""
    videos = get_planned_videos()
    if not videos:
        logger.info("No videos to process")
        return False

    video_id, title, script = videos[0]
    return launch_vrew_automation(video_id, title, script)


def daemon_mode():
    """Run in daemon mode, continuously checking for new videos."""
    logger.info("Starting background automation daemon...")
    update_status({"running": True, "processed_count": 0, "failed_count": 0})

    if not check_vrew_installed():
        logger.error(f"Vrew not installed at {VREW_PATH}")
        return

    try:
        while True:
            videos = get_planned_videos()
            if videos:
                logger.info(f"Found {len(videos)} video(s) to process")
                for video in videos:
                    video_id, title, script = video
                    success = launch_vrew_automation(video_id, title, script)

                    status = get_status()
                    if success:
                        update_status({"processed_count": status.get("processed_count", 0) + 1})
                    else:
                        update_status({"failed_count": status.get("failed_count", 0) + 1})

                    time.sleep(5)  # Brief pause between videos
            else:
                logger.debug("No videos to process, sleeping...")

            time.sleep(60)  # Check every minute

    except KeyboardInterrupt:
        logger.info("Daemon stopped by user")
    finally:
        update_status({"running": False, "current_video": None})


def show_status():
    """Show current automation status."""
    status = get_status()
    print("\n=== Automation Status ===")
    print(f"Running: {status.get('running', False)}")
    print(f"Last Update: {status.get('last_update', 'Never')}")
    print(f"Processed: {status.get('processed_count', 0)}")
    print(f"Failed: {status.get('failed_count', 0)}")

    current = status.get('current_video')
    if current:
        print(f"Current Video: [{current['id']}] {current['title'][:40]}")

    # Show pending videos
    videos = get_planned_videos()
    print(f"\nPending Videos: {len(videos)}")
    for v in videos[:5]:
        print(f"  [{v[0]}] {v[1][:50]}")

    # Show recent log entries
    if LOG_PATH.exists():
        print("\n=== Recent Log ===")
        with open(LOG_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines[-10:]:
                print(line.rstrip())


def main():
    parser = argparse.ArgumentParser(description='Background Vrew Automation')
    parser.add_argument('--daemon', action='store_true', help='Run in daemon mode')
    parser.add_argument('--status', action='store_true', help='Show current status')
    parser.add_argument('--process-one', action='store_true', help='Process one video and exit')
    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.daemon:
        daemon_mode()
    elif args.process_one:
        process_one()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
