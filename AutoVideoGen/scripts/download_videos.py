"""Download videos from VM to local machine."""
import requests
import os
import json
import sqlite3

VM = "http://192.168.1.28:8888"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output", "videos")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database.db")


def copy_to_temp_on_vm():
    """Copy VM video files to temp dir with numeric names."""
    code = (
        "import os, glob, shutil, json\n"
        "docs = r'C:\\Users\\rmiak\\OneDrive\\ドキュメント'\n"
        "temp_dir = r'C:\\temp\\videos'\n"
        "os.makedirs(temp_dir, exist_ok=True)\n"
        "for f in glob.glob(os.path.join(temp_dir, '*.mp4')):\n"
        "    os.remove(f)\n"
        "mp4s = sorted(glob.glob(os.path.join(docs, '*.mp4')))\n"
        "mapping = []\n"
        "for i, src in enumerate(mp4s):\n"
        "    dst = os.path.join(temp_dir, f'video_{i}.mp4')\n"
        "    shutil.copy2(src, dst)\n"
        "    size = os.path.getsize(dst)\n"
        "    mapping.append({'idx': i, 'name': os.path.basename(src), 'size': size})\n"
        "result = json.dumps(mapping, ensure_ascii=False)\n"
    )
    r = requests.post(f"{VM}/python", json={"code": code}, timeout=120)
    data = r.json()
    if not data.get("success"):
        print(f"Error copying files: {data.get('error')}")
        return []
    return json.loads(data["result"])


def download_files(vm_files):
    """Download files from VM temp dir."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    downloaded = []

    for f in vm_files:
        url = f"{VM}/files/C:/temp/videos/video_{f['idx']}.mp4"
        local_path = os.path.join(OUTPUT_DIR, f"new2_video_{f['idx']}.mp4")

        print(f"  Downloading video_{f['idx']}.mp4...", end=" ")
        try:
            r = requests.get(url, timeout=180)
            if r.status_code == 200 and len(r.content) > 10000:
                with open(local_path, "wb") as fh:
                    fh.write(r.content)
                size_mb = len(r.content) / (1024 * 1024)
                print(f"OK ({size_mb:.1f}MB)")
                downloaded.append({
                    "name": f["name"],
                    "local_path": local_path,
                    "size": len(r.content),
                })
            else:
                print(f"FAIL (status={r.status_code}, size={len(r.content)})")
        except Exception as e:
            print(f"ERROR: {e}")

    return downloaded


def match_and_update_db(downloaded):
    """Match downloaded files to DB tasks and update file_path."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Get downloaded-status tasks (on VM, not yet local)
    c.execute(
        "SELECT id, title, file_path FROM videos "
        "WHERE status='downloaded' AND file_path LIKE 'C:/%' ORDER BY id"
    )
    vm_tasks = c.fetchall()

    if not vm_tasks:
        print("No VM-path tasks to update")
        conn.close()
        return

    # Match by file size
    for dl in downloaded:
        for vid_id, title, vm_path in vm_tasks:
            # Try matching by filename similarity
            vm_basename = os.path.basename(vm_path) if vm_path else ""
            if dl["name"] == vm_basename:
                c.execute(
                    "UPDATE videos SET file_path = ? WHERE id = ?",
                    (dl["local_path"], vid_id),
                )
                print(f"  Updated ID:{vid_id} -> {os.path.basename(dl['local_path'])}")
                break

    conn.commit()
    conn.close()


def main():
    print("=" * 60)
    print("Phase 1: Copy files to temp on VM")
    print("=" * 60)
    vm_files = copy_to_temp_on_vm()
    print(f"Found {len(vm_files)} files on VM:")
    for f in vm_files:
        print(f"  video_{f['idx']}.mp4 = {f['name']} ({f['size'] // (1024 * 1024)}MB)")

    print()
    print("=" * 60)
    print("Phase 2: Download to local")
    print("=" * 60)
    downloaded = download_files(vm_files)
    print(f"\n{len(downloaded)}/{len(vm_files)} downloaded successfully")

    # Update DB with local paths
    print()
    print("=" * 60)
    print("Phase 3: Update database")
    print("=" * 60)
    match_and_update_db(downloaded)

    return downloaded


if __name__ == "__main__":
    main()
