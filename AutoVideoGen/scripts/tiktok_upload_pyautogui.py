"""
TikTok Upload using PyAutoGUI on VM

Automates TikTok video upload using PyAutoGUI to control the browser on the VM.
Similar approach to the Vrew automation.

Usage:
    python scripts/tiktok_upload_pyautogui.py --video path/to/video.mp4 --title "Video Title"
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests


VM_BASE = "http://192.168.1.28:8888"
TIKTOK_UPLOAD_URL = "https://www.tiktok.com/creator-center/upload"


def vm_exec(cmd: str, timeout: int = 30) -> dict:
    """Execute shell command on VM."""
    r = requests.post(f"{VM_BASE}/exec", json={"cmd": cmd}, timeout=timeout)
    return r.json()


def vm_python(code: str, timeout: int = 30) -> dict:
    """Execute Python code on VM."""
    r = requests.post(f"{VM_BASE}/python", json={"code": code}, timeout=timeout)
    return r.json()


def vm_screenshot() -> bytes:
    """Take screenshot of VM."""
    r = requests.get(f"{VM_BASE}/screenshot", timeout=10)
    return r.content


def save_screenshot(data: bytes, name: str = "tiktok_test.png") -> str:
    """Save screenshot locally."""
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(base_dir, name)
    with open(path, "wb") as f:
        f.write(data)
    return path


def open_tiktok_upload_page(session_id: str) -> bool:
    """
    Open Chrome on VM and navigate to TikTok upload page.
    Set the session cookie to authenticate.
    """
    print("Step 1: Opening Chrome and navigating to TikTok...")

    # Kill any existing Chrome instances
    vm_exec('taskkill /F /IM chrome.exe 2>nul', timeout=5)
    time.sleep(2)

    # Start Chrome with remote debugging (for cookie injection)
    chrome_cmd = (
        'start chrome '
        '--remote-debugging-port=9222 '
        '--user-data-dir=C:\\temp\\chrome_profile '
        f'"{TIKTOK_UPLOAD_URL}"'
    )
    result = vm_exec(chrome_cmd, timeout=10)
    print(f"  Chrome started: {result.get('returncode') == 0}")

    time.sleep(5)  # Wait for Chrome to load

    # Inject session cookie using CDP (Chrome DevTools Protocol)
    # Or use PyAutoGUI to manually login (if cookie injection doesn't work)
    # For now, we'll assume the user is already logged in on the VM Chrome profile

    return True


def upload_video_with_pyautogui(video_path: str, title: str, tags: list) -> bool:
    """
    Use PyAutoGUI on VM to interact with TikTok upload interface.

    Steps:
    1. Click "Select file" button
    2. Enter file path in dialog
    3. Fill in title and description
    4. Click "Post" button
    """
    print("Step 2: Using PyAutoGUI to upload video...")

    # Take screenshot to see current state
    screenshot = vm_screenshot()
    save_screenshot(screenshot, "tiktok_before_upload.png")
    print("  Screenshot saved: tiktok_before_upload.png")

    # PyAutoGUI script to click upload button
    code = f"""
import pyautogui
import time

# Wait for page to load
time.sleep(3)

# Take screenshot
pyautogui.screenshot('C:/temp/tiktok_screen1.png')

# Find and click "Select file" button
# This will need to be adjusted based on actual TikTok UI
# For now, we'll use coordinates (need to be calibrated)

# Example: Click on upload area (center of screen typically)
screen_width, screen_height = pyautogui.size()
pyautogui.click(screen_width // 2, screen_height // 2)
time.sleep(2)

# When file dialog opens, type the file path
# pyautogui.write(r'{video_path}')
# pyautogui.press('enter')

result = "Upload button clicked"
"""

    result = vm_python(code, timeout=30)
    print(f"  PyAutoGUI result: {result.get('result', 'Error')}")

    if not result.get("success"):
        print(f"  Error: {result.get('error')}")
        return False

    time.sleep(3)

    # Take another screenshot
    screenshot = vm_screenshot()
    save_screenshot(screenshot, "tiktok_after_click.png")
    print("  Screenshot saved: tiktok_after_click.png")

    return True


def test_tiktok_upload(video_path: str, title: str, tags: list, session_id: str) -> bool:
    """
    Main test function for TikTok upload using PyAutoGUI on VM.
    """
    print("=" * 60)
    print("TikTok Upload Test (PyAutoGUI on VM)")
    print("=" * 60)
    print(f"Video: {video_path}")
    print(f"Title: {title}")
    print(f"Tags: {tags}")
    print()

    # Check VM connection
    try:
        r = requests.get(f"{VM_BASE}/status", timeout=5)
        if r.status_code != 200:
            print("ERROR: Cannot connect to VM")
            return False
        print("[OK] VM connection OK")
    except Exception as e:
        print(f"ERROR: VM connection failed: {e}")
        return False

    # Open TikTok upload page
    if not open_tiktok_upload_page(session_id):
        print("ERROR: Failed to open TikTok upload page")
        return False

    # Upload video using PyAutoGUI
    if not upload_video_with_pyautogui(video_path, title, tags):
        print("ERROR: Failed to upload video")
        return False

    print()
    print("=" * 60)
    print("Test completed!")
    print("Please check the screenshots to see the current state.")
    print("=" * 60)

    return True


def main():
    parser = argparse.ArgumentParser(description="Test TikTok upload with PyAutoGUI on VM")
    parser.add_argument("--video", "-v", required=True, help="Path to video file on VM")
    parser.add_argument("--title", "-t", default="Test Upload", help="Video title")
    parser.add_argument("--tags", nargs="+", default=["test"], help="Video tags")
    parser.add_argument("--session-id", "-s", help="TikTok session ID")

    args = parser.parse_args()

    session_id = args.session_id or os.environ.get("TIKTOK_SESSION_ID", "")

    success = test_tiktok_upload(
        video_path=args.video,
        title=args.title,
        tags=args.tags,
        session_id=session_id
    )

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
