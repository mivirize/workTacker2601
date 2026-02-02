"""
Save Dialog Handler for Vrew Export

This script monitors for Windows Save Dialog and automatically confirms it.
Runs in the background while the main automation script executes.

Usage:
    python save_dialog_handler.py [--timeout 120] [--output-dir "path"]
"""

import time
import sys
import os
import argparse
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pyautogui
import pygetwindow as gw

# Disable pyautogui fail-safe for automation
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.1

def find_save_dialog():
    """Find Windows Save Dialog window"""
    # Titles that indicate a save dialog
    save_dialog_titles = [
        '名前を付けて保存',
        'Save As',
        'ファイルの保存',
        # Chrome's File System Access API dialog has this warning title
        '警告',
        'Warning',
    ]

    # Also look for windows with .mp4 in the title (file save dialogs often show filename)
    all_windows = gw.getAllWindows()

    # First try exact title matches
    for title in save_dialog_titles:
        windows = gw.getWindowsWithTitle(title)
        for window in windows:
            win_title = window.title.strip()
            if win_title == title or win_title.startswith(title):
                return window

    # Then try partial matches for save dialog indicators
    for window in all_windows:
        win_title = window.title.lower()
        # Chrome's file picker dialog often contains these patterns
        if '.mp4' in win_title or 'このサイト' in window.title or '編集内容' in window.title:
            return window
        # Also check for "ドキュメント" (Documents folder in dialog)
        if 'ドキュメント' in window.title and ('保存' in window.title or 'save' in win_title.lower()):
            return window

    return None

def find_vrew_window():
    """Find Vrew browser window"""
    windows = gw.getWindowsWithTitle('Vrew')
    if windows:
        return windows[0]

    # Also check for Chrome with Vrew
    windows = gw.getWindowsWithTitle('vrew.ai')
    if windows:
        return windows[0]

    return None

def handle_save_dialog(output_dir=None):
    """
    Handle the save dialog by clicking Save button or pressing Enter.
    Returns True if dialog was found and handled.
    """
    dialog = find_save_dialog()
    if not dialog:
        return False

    print(f"[{time.strftime('%H:%M:%S')}] 📁 Save dialog detected: {dialog.title}")
    print(f"[{time.strftime('%H:%M:%S')}]    Position: ({dialog.left}, {dialog.top}), Size: {dialog.width}x{dialog.height}")

    try:
        # Activate the dialog window
        try:
            dialog.activate()
        except:
            pass
        time.sleep(0.5)

        # If output directory is specified, change the location
        if output_dir and os.path.isdir(output_dir):
            # Press Alt+D to focus on address bar
            pyautogui.hotkey('alt', 'd')
            time.sleep(0.3)

            # Type the output directory
            pyautogui.typewrite(output_dir.replace('/', '\\'), interval=0.02)
            time.sleep(0.3)

            # Press Enter to navigate
            pyautogui.press('enter')
            time.sleep(0.5)

            # Tab to filename field
            pyautogui.press('tab')
            time.sleep(0.2)

        # Method 1: Try clicking the "保存(S)" button directly
        # The button is typically at the bottom-right of the dialog
        save_btn_x = dialog.left + dialog.width - 100  # About 100px from right edge
        save_btn_y = dialog.top + dialog.height - 40   # About 40px from bottom

        print(f"[{time.strftime('%H:%M:%S')}] 🖱️ Clicking Save button at ({save_btn_x}, {save_btn_y})")
        pyautogui.click(save_btn_x, save_btn_y)
        time.sleep(0.5)

        # Method 2: Also press Enter as backup
        pyautogui.press('enter')
        time.sleep(0.3)

        # Method 3: Try Alt+S (keyboard shortcut for 保存(S))
        pyautogui.hotkey('alt', 's')

        print(f"[{time.strftime('%H:%M:%S')}] ✅ Save dialog confirmed!")
        return True

    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ Error handling dialog: {e}")
        return False

def monitor_and_handle(timeout=120, output_dir=None, check_interval=1.0, continuous=False):
    """
    Monitor for save dialog and handle it when found.

    Args:
        timeout: Maximum time to wait (seconds)
        output_dir: Optional directory to save to
        check_interval: How often to check (seconds)
        continuous: If True, keep monitoring after handling (for batch processing)
    """
    print("")
    print("=" * 60)
    print("   Save Dialog Handler for Vrew")
    print("   Auto Save Dialog Handler")
    if continuous:
        print("   [CONTINUOUS MODE - handling multiple dialogs]")
    print("=" * 60)
    print("")

    print(f"[{time.strftime('%H:%M:%S')}] 🔍 Monitoring for save dialog...")
    print(f"[{time.strftime('%H:%M:%S')}] ⏱️  Timeout: {timeout} seconds")
    if output_dir:
        print(f"[{time.strftime('%H:%M:%S')}] 📂 Output directory: {output_dir}")
    print()

    start_time = time.time()
    dialogs_handled = 0
    last_log_time = 0

    while time.time() - start_time < timeout:
        # Check for save dialog
        if handle_save_dialog(output_dir):
            dialogs_handled += 1
            print(f"[{time.strftime('%H:%M:%S')}] 🎉 Save dialog #{dialogs_handled} handled successfully!")

            # Wait a bit for the save to complete
            time.sleep(2)

            # Check if dialog is still open (might need another Enter)
            if find_save_dialog():
                print(f"[{time.strftime('%H:%M:%S')}] 🔄 Dialog still open, pressing Enter again...")
                pyautogui.press('enter')
                time.sleep(1)

            # If not continuous mode, exit after first dialog
            if not continuous:
                break

            # In continuous mode, continue monitoring
            print(f"[{time.strftime('%H:%M:%S')}] 🔄 Continuing to monitor for more dialogs...")

        # Show progress every 30 seconds
        elapsed = int(time.time() - start_time)
        if elapsed - last_log_time >= 30:
            print(f"[{time.strftime('%H:%M:%S')}] ⏳ Monitoring... ({elapsed}s elapsed, {dialogs_handled} dialogs handled)")
            last_log_time = elapsed

        time.sleep(check_interval)

    if dialogs_handled == 0:
        print(f"[{time.strftime('%H:%M:%S')}] ⚠️ Timeout: No save dialog detected")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] ✅ Total dialogs handled: {dialogs_handled}")

    return dialogs_handled > 0

def main():
    parser = argparse.ArgumentParser(description='Handle Windows Save Dialog automatically')
    parser.add_argument('--timeout', type=int, default=120, help='Timeout in seconds (default: 120)')
    parser.add_argument('--output-dir', type=str, help='Directory to save files to')
    parser.add_argument('--interval', type=float, default=1.0, help='Check interval in seconds')
    parser.add_argument('--continuous', action='store_true', help='Keep monitoring after handling (for batch processing)')

    args = parser.parse_args()

    success = monitor_and_handle(
        timeout=args.timeout,
        output_dir=args.output_dir,
        check_interval=args.interval,
        continuous=args.continuous
    )

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
