"""Download videos from VM and upload to YouTube."""
import sqlite3
import os
import sys
import requests
import time
import re

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database.db")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output", "videos")
VM_HOST = "http://192.168.1.28:8888"


def safe_filename(title):
    """Make a safe filename from title."""
    safe = re.sub(r'[\\/:*?"<>|]', '', title)
    return safe.strip()


def download_from_vm():
    """Download all 'downloaded' status videos from VM to local."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT id, title, file_path FROM videos "
        "WHERE status='downloaded' AND file_path IS NOT NULL ORDER BY id"
    )
    rows = c.fetchall()
    conn.close()

    if not rows:
        print("No videos to download")
        return []

    downloaded = []
    for vid_id, title, vm_path in rows:
        safe = safe_filename(title)
        local_path = os.path.join(OUTPUT_DIR, f"{safe}.mp4")

        # Check if already local
        if os.path.exists(local_path) and os.path.getsize(local_path) > 10000:
            print(f"ID:{vid_id} - Already exists locally: {safe}.mp4")
            # Update DB if needed
            _update_db_path(vid_id, local_path)
            downloaded.append((vid_id, title, local_path))
            continue

        # Build VM URL - convert Windows path
        # vm_path like: C:/Users/rmiak/OneDrive/ドキュメント/title.mp4
        vm_file = vm_path.replace("C:/", "").replace("\\", "/")
        url = f"{VM_HOST}/files/{vm_file}"
        print(f"ID:{vid_id} - Downloading from VM: {title[:40]}...")

        try:
            r = requests.get(url, timeout=180)
            if r.status_code == 200 and len(r.content) > 10000:
                with open(local_path, "wb") as f:
                    f.write(r.content)
                size_mb = len(r.content) / (1024 * 1024)
                print(f"  OK: {size_mb:.1f} MB")
                _update_db_path(vid_id, local_path)
                downloaded.append((vid_id, title, local_path))
            else:
                print(f"  FAIL: HTTP {r.status_code}, size={len(r.content)}")
        except Exception as e:
            print(f"  ERROR: {e}")

    return downloaded


def _update_db_path(vid_id, local_path):
    """Update file_path in DB to local path."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE videos SET file_path = ? WHERE id = ?", (local_path, vid_id))
    conn.commit()
    conn.close()


def upload_to_youtube(limit=None):
    """Upload downloaded videos to YouTube."""
    sys.path.insert(0, os.path.dirname(__file__))
    from video_uploader import VideoUploader, UploadConfig, Platform

    config = UploadConfig(
        db_path=os.path.abspath(DB_PATH),
        youtube_client_secrets=os.path.join(
            os.path.dirname(__file__), "..", "client_secrets.json"
        ),
        youtube_token_path=os.path.join(
            os.path.dirname(__file__), "..", "youtube_token.pickle"
        ),
    )

    uploader = VideoUploader(config)
    results = uploader.upload_from_db(Platform.YOUTUBE, limit=limit)
    uploader.print_summary(results)
    return results


def main():
    print("=" * 60)
    print("Phase 1: Download from VM")
    print("=" * 60)
    downloaded = download_from_vm()
    print(f"\n{len(downloaded)} video(s) ready for upload\n")

    if not downloaded:
        print("Nothing to upload")
        return

    print("=" * 60)
    print("Phase 2: Upload to YouTube")
    print("=" * 60)
    results = upload_to_youtube(limit=6)

    success_count = sum(1 for r in results if r.success)
    fail_count = sum(1 for r in results if not r.success)
    print(f"\nUpload complete: {success_count} succeeded, {fail_count} failed")


if __name__ == "__main__":
    main()
