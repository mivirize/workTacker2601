"""
Vrew Export Helper - pyautoguiでエクスポートボタンをクリック

このスクリプトはVrewのエクスポートボタンを座標でクリックします。
Vrewウィンドウを見つけて、「書き出し」ボタンをクリックします。
"""

import time
import sys
import os
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pyautogui
import pygetwindow as gw

# Disable pyautogui fail-safe for automation
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.3

def find_vrew_window():
    """Find Vrew browser window"""
    # Look for Chrome windows with Vrew
    all_windows = gw.getAllWindows()

    for window in all_windows:
        title = window.title.lower()
        if 'vrew' in title or 'chrome' in title:
            if 'vrew' in title:
                return window

    # Fallback: find any Chrome window
    for window in all_windows:
        if 'chrome' in window.title.lower():
            return window

    return None

def click_export_button():
    """
    Click the export button in Vrew.
    The export button is typically in the top-right toolbar area.
    """
    window = find_vrew_window()
    if not window:
        print("❌ Vrew window not found")
        return False

    print(f"✅ Found Vrew window: {window.title}")
    print(f"   Position: ({window.left}, {window.top})")
    print(f"   Size: {window.width} x {window.height}")

    # Activate the window
    try:
        window.activate()
        time.sleep(0.5)
    except Exception as e:
        print(f"⚠️ Could not activate window: {e}")

    # Calculate export button position
    # The "書き出し" button is typically in the top-right area
    # Assuming a standard Vrew layout at 1920x1080

    # Button is approximately at:
    # - Right side of toolbar, about 100-150px from right edge
    # - Top toolbar area, about 40-60px from top

    # Calculate relative to window position
    export_x = window.left + window.width - 100  # 100px from right edge
    export_y = window.top + 50  # 50px from top

    print(f"📍 Clicking at export button position: ({export_x}, {export_y})")

    # Take a screenshot before clicking
    screenshot = pyautogui.screenshot()
    screenshot.save(os.path.join(os.path.dirname(__file__), '..', 'output', 'before_export_click.png'))

    # Click the export button
    pyautogui.click(export_x, export_y)
    time.sleep(2)

    # Take screenshot after clicking
    screenshot = pyautogui.screenshot()
    screenshot.save(os.path.join(os.path.dirname(__file__), '..', 'output', 'after_export_click.png'))

    print("✅ Export button clicked")
    return True

def click_mp4_option():
    """Click the MP4 export option in the export menu"""
    time.sleep(1)

    window = find_vrew_window()
    if not window:
        return False

    # The "動画ファイル(mp4)" option is typically in the export menu
    # It's usually in the right panel or a dropdown

    # Look for it using image recognition or click in the expected area
    # For now, we'll try clicking in the export panel area

    # The export options are typically on the right side
    mp4_x = window.left + window.width - 200
    mp4_y = window.top + 150  # Below the export button

    print(f"📍 Clicking at MP4 option position: ({mp4_x}, {mp4_y})")
    pyautogui.click(mp4_x, mp4_y)
    time.sleep(1)

    return True

def click_export_confirm():
    """Click the export confirm button in the dialog"""
    time.sleep(1)

    window = find_vrew_window()
    if not window:
        return False

    # The export dialog typically appears in the center
    # The "書き出し" confirm button is usually at the bottom of the dialog

    dialog_center_x = window.left + window.width // 2
    dialog_bottom_y = window.top + window.height // 2 + 100  # Below center

    print(f"📍 Clicking at export confirm button: ({dialog_center_x}, {dialog_bottom_y})")
    pyautogui.click(dialog_center_x, dialog_bottom_y)
    time.sleep(2)

    # Take screenshot
    screenshot = pyautogui.screenshot()
    screenshot.save(os.path.join(os.path.dirname(__file__), '..', 'output', 'after_export_confirm.png'))

    return True

def main():
    print("=" * 50)
    print("  Vrew Export Helper")
    print("=" * 50)
    print()

    print("[Step 1] Finding Vrew window...")
    window = find_vrew_window()

    if not window:
        print("❌ Could not find Vrew window")
        print("   Make sure Vrew is open in a browser window")
        return

    print(f"✅ Found: {window.title}")

    input("Press Enter to click the export button...")

    click_export_button()

    input("Press Enter to click MP4 option...")

    click_mp4_option()

    input("Press Enter to click export confirm...")

    click_export_confirm()

    print("\n✅ Export helper finished")
    print("   Check the output folder for screenshots")

if __name__ == '__main__':
    main()
