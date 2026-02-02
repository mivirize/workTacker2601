"""
Vrew Desktop App Automation Script

This script automates video creation using the Vrew desktop application.
Uses pyautogui for GUI automation.

Requirements:
    pip install pyautogui pyperclip pillow

Usage:
    python scripts/desktop_automate_vrew.py

Virtual Desktop Usage (recommended):
    1. Press Win+Tab to open Task View
    2. Click "New desktop" at the top
    3. Run this script in the new desktop
    4. Switch back to your main desktop to work while it runs
"""

import pyautogui
import pyperclip
import subprocess
import time
import os
import sys
import sqlite3
from pathlib import Path
from datetime import datetime

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DB_PATH = PROJECT_DIR / "database.db"
OUTPUT_DIR = PROJECT_DIR / "output" / "videos"
VREW_PATH = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "vrew" / "Vrew.exe"

# Timing configuration (adjust based on system speed)
DELAYS = {
    "short": 0.5,
    "medium": 1.0,
    "long": 2.0,
    "generation_check": 5.0,  # Check interval during generation
    "max_generation_time": 600,  # 10 minutes max
}

# Safety settings
pyautogui.FAILSAFE = True  # Move mouse to corner to abort
pyautogui.PAUSE = 0.1  # Pause between actions


def log(message: str):
    """Print timestamped log message."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")


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
    log(f"Updated video {video_id} status to '{status}'")


def launch_vrew():
    """Launch Vrew desktop application via shortcut (required for proper initialization)."""
    # Vrew requires launching via shortcut or with correct working directory
    shortcut_paths = [
        Path(os.environ.get("USERPROFILE", "")) / "Desktop" / "Vrew.lnk",
        Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Vrew.lnk",
    ]

    shortcut_path = None
    for path in shortcut_paths:
        if path.exists():
            shortcut_path = path
            break

    if shortcut_path:
        log(f"Launching Vrew via shortcut: {shortcut_path}")
        # Use explorer.exe to launch shortcut (most reliable method)
        subprocess.Popen(["explorer.exe", str(shortcut_path)])
    elif VREW_PATH.exists():
        log(f"Launching Vrew with working directory: {VREW_PATH.parent}")
        # Fallback: launch with correct working directory
        subprocess.Popen([str(VREW_PATH)], cwd=str(VREW_PATH.parent))
    else:
        log(f"ERROR: Vrew not found at {VREW_PATH}")
        log("Please install Vrew first: output/videos/Vrew-Installer-3.5.4.exe")
        return False

    time.sleep(DELAYS["long"] * 3)  # Wait for app to load
    return True


def wait_for_window(title_contains: str, timeout: int = 30) -> bool:
    """Wait for a window with title containing the specified text."""
    import ctypes
    user32 = ctypes.windll.user32

    start = time.time()
    while time.time() - start < timeout:
        # Get active window title
        hwnd = user32.GetForegroundWindow()
        length = user32.GetWindowTextLengthW(hwnd)
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buffer, length + 1)

        if title_contains.lower() in buffer.value.lower():
            return True
        time.sleep(0.5)
    return False


def click_button(image_path: str = None, text: str = None, confidence: float = 0.8) -> bool:
    """Click a button by image or approximate location."""
    try:
        if image_path and os.path.exists(image_path):
            location = pyautogui.locateCenterOnScreen(image_path, confidence=confidence)
            if location:
                pyautogui.click(location)
                return True
        return False
    except Exception as e:
        log(f"Click error: {e}")
        return False


def type_text(text: str, use_clipboard: bool = True):
    """Type text, optionally using clipboard for non-ASCII characters."""
    if use_clipboard:
        pyperclip.copy(text)
        pyautogui.hotkey("ctrl", "v")
    else:
        pyautogui.typewrite(text, interval=0.02)


def activate_vrew_window():
    """Find and activate Vrew window."""
    try:
        import pygetwindow as gw
        windows = gw.getAllWindows()
        for w in windows:
            if 'Vrew' in w.title:
                log(f"Found Vrew window: {w.title}")
                w.activate()
                time.sleep(0.5)
                # Click center to ensure focus
                center_x = w.left + w.width // 2
                center_y = w.top + w.height // 2
                pyautogui.click(center_x, center_y)
                time.sleep(0.3)
                return True
        log("Vrew window not found!")
        return False
    except Exception as e:
        log(f"Error activating window: {e}")
        return False


def create_new_project():
    """Create a new video project in Vrew."""
    log("Creating new project...")

    # First activate Vrew window
    if not activate_vrew_window():
        log("WARNING: Could not activate Vrew window")

    # Press Ctrl+N for new project (common shortcut)
    pyautogui.hotkey("ctrl", "n")
    time.sleep(DELAYS["medium"])


def select_text_to_video():
    """Select 'Text to Video' option."""
    log("Looking for 'Text to Video' option...")

    # Try clicking on the option - coordinates may need adjustment
    # You can capture screenshots and use image recognition for more robust detection
    time.sleep(DELAYS["medium"])

    # Press Tab to navigate and Enter to select (if keyboard navigation works)
    pyautogui.press("tab")
    time.sleep(DELAYS["short"])
    pyautogui.press("enter")
    time.sleep(DELAYS["medium"])


def enter_script(title: str, script: str):
    """Enter the video title and script."""
    log(f"Entering script for: {title[:30]}...")

    # Wait for text input field
    time.sleep(DELAYS["medium"])

    # Enter title (theme field)
    type_text(title[:50])  # Vrew has a limit
    time.sleep(DELAYS["short"])

    # Tab to script field
    pyautogui.press("tab")
    time.sleep(DELAYS["short"])

    # Enter script
    type_text(script)
    time.sleep(DELAYS["medium"])

    # Press Next
    pyautogui.press("enter")
    time.sleep(DELAYS["long"])


def configure_video():
    """Configure video settings (aspect ratio, etc.)."""
    log("Configuring video settings...")

    # Look for 9:16 button or use keyboard navigation
    time.sleep(DELAYS["medium"])

    # Tab to aspect ratio selection and select vertical
    for _ in range(3):
        pyautogui.press("tab")
        time.sleep(DELAYS["short"])

    pyautogui.press("enter")  # Select 9:16
    time.sleep(DELAYS["short"])

    # Press Done/Complete button
    pyautogui.press("enter")
    time.sleep(DELAYS["medium"])


def wait_for_generation(max_time: int = None) -> bool:
    """Wait for video generation to complete."""
    max_time = max_time or DELAYS["max_generation_time"]
    log(f"Waiting for video generation (max {max_time}s)...")

    start = time.time()
    while time.time() - start < max_time:
        # Check for export button appearance
        # This could be done via image recognition or window title change
        time.sleep(DELAYS["generation_check"])

        # Log progress
        elapsed = int(time.time() - start)
        log(f"Generation in progress... ({elapsed}s)")

        # Check if generation is complete by looking for Export button
        # (This is a placeholder - actual detection would need image recognition)

    return True


def export_video(video_id: int, title: str) -> str:
    """Export the video as MP4."""
    log("Starting export...")

    # Open export dialog (Ctrl+E or click Export button)
    pyautogui.hotkey("ctrl", "e")
    time.sleep(DELAYS["medium"])

    # Select MP4 format
    # (Navigation depends on Vrew's UI)
    time.sleep(DELAYS["medium"])

    # Set filename
    safe_title = "".join(c if c.isalnum() else "_" for c in title)[:20]
    filename = f"video_{video_id}_{safe_title}.mp4"
    output_path = OUTPUT_DIR / filename

    # Type filename in save dialog
    time.sleep(DELAYS["long"])
    type_text(str(output_path))
    time.sleep(DELAYS["short"])

    # Press Save/Enter
    pyautogui.press("enter")

    # Wait for export to complete
    log("Waiting for export to complete...")
    time.sleep(DELAYS["long"] * 10)  # Export can take a while

    return str(output_path) if output_path.exists() else ""


def process_video(video_id: int, title: str, script: str) -> bool:
    """Process a single video from start to finish."""
    log(f"\n{'='*60}")
    log(f"Processing video {video_id}: {title[:40]}...")
    log(f"{'='*60}\n")

    try:
        # Update status to processing
        update_video_status(video_id, "processing")

        # Create new project
        create_new_project()

        # Select text to video
        select_text_to_video()

        # Enter script
        enter_script(title, script)

        # Configure video
        configure_video()

        # Wait for generation
        if not wait_for_generation():
            log("Generation timeout")
            update_video_status(video_id, "failed")
            return False

        # Export
        output_path = export_video(video_id, title)

        if output_path and os.path.exists(output_path):
            update_video_status(video_id, "downloaded", output_path)
            log(f"SUCCESS: Video saved to {output_path}")
            return True
        else:
            update_video_status(video_id, "failed")
            log("FAILED: Export did not produce a file")
            return False

    except Exception as e:
        log(f"ERROR: {e}")
        update_video_status(video_id, "failed")
        return False


def main():
    """Main entry point."""
    import argparse
    parser = argparse.ArgumentParser(description='Vrew Desktop Automation')
    parser.add_argument('--auto', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--delay', type=int, default=5, help='Delay before starting (seconds)')
    args = parser.parse_args()

    print("\n" + "="*60)
    print("Vrew Desktop Automation")
    print("="*60)
    print("\nWARNING: This script controls your mouse and keyboard.")
    print("Move mouse to top-left corner to abort at any time.")
    print("\nRECOMMENDED: Run in a virtual desktop (Win+Tab -> New Desktop)")
    print("="*60 + "\n")

    # Check for Vrew installation
    if not VREW_PATH.exists():
        print(f"ERROR: Vrew not installed at {VREW_PATH}")
        print("Install Vrew first and try again.")
        return

    # Get planned videos
    videos = get_planned_videos()
    if not videos:
        print("No videos to process (status='planned')")
        return

    print(f"Found {len(videos)} video(s) to process:\n")
    for v in videos:
        print(f"  [{v[0]}] {v[1][:50]}")
    print()

    # Confirm before starting (skip if --auto flag is set)
    if args.auto:
        print(f"Auto mode enabled. Starting in {args.delay} seconds...")
        print("Move mouse to top-left corner NOW to abort!")
        time.sleep(args.delay)
    else:
        input("Press Enter to start automation (or Ctrl+C to cancel)...")

    # Launch Vrew
    if not launch_vrew():
        return

    # Wait for Vrew to fully load
    log("Waiting for Vrew to load...")
    time.sleep(DELAYS["long"] * 5)

    # Process each video
    success_count = 0
    fail_count = 0

    for video in videos:
        video_id, title, script = video

        if process_video(video_id, title, script):
            success_count += 1
        else:
            fail_count += 1

        # Wait between videos
        time.sleep(DELAYS["long"])

    # Summary
    print("\n" + "="*60)
    print("BATCH COMPLETE")
    print("="*60)
    print(f"  Success: {success_count}")
    print(f"  Failed:  {fail_count}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
