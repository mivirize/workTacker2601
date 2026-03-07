"""
TikTok Upload Test Script

Tests TikTok upload functionality with a single video.
Requires TIKTOK_SESSION_ID environment variable.

Usage:
    set TIKTOK_SESSION_ID=your_session_id
    python scripts/test_tiktok_upload.py --video path/to/video.mp4
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from video_uploader import TikTokUploader, UploadConfig


def main():
    parser = argparse.ArgumentParser(description="Test TikTok upload")
    parser.add_argument(
        "--video",
        "-v",
        required=True,
        help="Path to video file to upload"
    )
    parser.add_argument(
        "--title",
        "-t",
        default="Test Upload - MBTI Shorts",
        help="Video title"
    )
    parser.add_argument(
        "--tags",
        nargs="+",
        default=["MBTI", "personality", "shorts"],
        help="Video tags"
    )
    parser.add_argument(
        "--session-id",
        "-s",
        help="TikTok session ID (or use TIKTOK_SESSION_ID env var)"
    )
    parser.add_argument(
        "--privacy",
        choices=["everyone", "friends", "only_you"],
        default="everyone",
        help="Privacy setting"
    )

    args = parser.parse_args()

    # Get session ID
    session_id = args.session_id or os.environ.get("TIKTOK_SESSION_ID", "")
    if not session_id:
        print("ERROR: TikTok session ID not provided.")
        print("Set TIKTOK_SESSION_ID environment variable or use --session-id")
        print("\nHow to get session ID:")
        print("1. Login to https://www.tiktok.com in your browser")
        print("2. Open Developer Tools (F12)")
        print("3. Go to Application/Storage → Cookies → https://www.tiktok.com")
        print("4. Copy the value of 'sessionid' cookie")
        return 1

    # Check video file
    video_path = Path(args.video)
    if not video_path.exists():
        print(f"ERROR: Video file not found: {video_path}")
        return 1

    print("=" * 60)
    print("TikTok Upload Test")
    print("=" * 60)
    print(f"Video:   {video_path}")
    print(f"Title:   {args.title}")
    print(f"Tags:    {args.tags}")
    print(f"Privacy: {args.privacy}")
    print(f"Session: {'*' * 10}{session_id[-10:] if len(session_id) > 10 else session_id}")
    print("=" * 60)
    print()

    # Initialize uploader
    config = UploadConfig(tiktok_session_id=session_id)
    uploader = TikTokUploader(config)

    # Authenticate
    print("Authenticating...")
    if not uploader.authenticate():
        print("ERROR: Authentication failed")
        return 1
    print("✓ Authentication successful")
    print()

    # Upload
    print("Uploading to TikTok...")
    result = uploader.upload(
        video_path=str(video_path),
        title=args.title,
        tags=args.tags,
        task_id=0,
    )

    print()
    print("=" * 60)
    print("Upload Result")
    print("=" * 60)
    print(f"Success: {result.success}")
    print(f"Platform: {result.platform}")
    if result.success:
        print(f"Video ID: {result.video_id}")
        print(f"URL: {result.url}")
        print()
        print("✓ Upload successful!")
    else:
        print(f"Error: {result.error}")
        print()
        print("✗ Upload failed")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
