# TikTok投稿セットアップガイド

## 概要

`video_uploader.py`は既にTikTok投稿機能を実装済み。`tiktok-uploader`パッケージを使用。

## セットアップ手順

### 1. セッションIDの取得

TikTokアカウントにブラウザでログインし、セッションIDを取得：

1. https://www.tiktok.com にログイン
2. ブラウザの開発者ツールを開く（F12キー）
3. `Application`タブ（Chromeの場合）または`Storage`タブ（Firefoxの場合）を選択
4. 左サイドバーから `Cookies` → `https://www.tiktok.com` を選択
5. `sessionid` という名前のクッキーを探す
6. その値（長い英数字の文字列）をコピー

### 2. 環境変数またはConfigに設定

#### 方法A: 環境変数（推奨）

```bash
# Windows
set TIKTOK_SESSION_ID=your_session_id_here

# PowerShell
$env:TIKTOK_SESSION_ID = "your_session_id_here"

# Linux/Mac
export TIKTOK_SESSION_ID=your_session_id_here
```

#### 方法B: Config引数で直接指定

```python
from video_uploader import VideoUploader, UploadConfig, Platform

config = UploadConfig(
    db_path='database.db',
    tiktok_session_id='your_session_id_here'
)

uploader = VideoUploader(config)
results = uploader.upload_from_db(Platform.TIKTOK, limit=5)
```

### 3. TikTokへアップロード

#### 単独アップロード

```bash
python scripts/video_uploader.py --platform tiktok --limit 5
```

#### YouTube + TikTok 両方

```bash
python scripts/video_uploader.py --platform both --limit 5
```

#### Python APIで直接

```python
from video_uploader import VideoUploader, UploadConfig, Platform

config = UploadConfig(
    db_path='database.db',
    tiktok_session_id='your_session_id_here'
)

uploader = VideoUploader(config)

# TikTokのみ
results = uploader.upload_from_db(Platform.TIKTOK, limit=5)

# 両方
results = uploader.upload_from_db(Platform.BOTH, limit=5)

uploader.print_summary(results)
```

## 注意事項

### セッションIDの有効期限

- TikTokのセッションIDは定期的に期限切れになります
- アップロードが失敗する場合は、新しいセッションIDを取得してください

### アップロード制限

- TikTokにも日次アップロード制限があります
- 一度に大量にアップロードしないことを推奨
- エラーが出た場合は時間を空けて再試行

### プライバシー設定

デフォルトは`public`（全体公開）。変更する場合：

```python
# video_uploader.pyの_upload_to_platformメソッドで
self._tiktok.upload(
    video_path,
    title,
    tags,
    task_id=task["id"],
    privacy='friends'  # 'everyone', 'friends', 'only_you'
)
```

## トラブルシューティング

### "Not authenticated" エラー

→ セッションIDが設定されていません。環境変数またはConfigで設定してください。

### "Video file not found" エラー

→ DBのfile_pathが正しいか確認してください。

### アップロード失敗（403/401エラー）

→ セッションIDの期限切れ。新しいセッションIDを取得してください。

### Selenium/Browser エラー

→ `tiktok-uploader`は内部でSeleniumを使用します。ChromeDriverが必要な場合があります。

## テスト方法

1つの動画でテスト：

```python
from video_uploader import TikTokUploader, UploadConfig

config = UploadConfig(
    tiktok_session_id='your_session_id'
)

uploader = TikTokUploader(config)
if uploader.authenticate():
    result = uploader.upload(
        video_path='path/to/video.mp4',
        title='テスト投稿',
        tags=['test', 'mbti'],
        task_id=999
    )
    print(result)
```

## 既存動画のTikTokアップロード

既にYouTubeにアップロード済みの動画をTikTokにも投稿：

```bash
# 環境変数を設定後
export TIKTOK_SESSION_ID=your_session_id

# TikTokに5本アップロード
python scripts/video_uploader.py --platform tiktok --limit 5
```

これで、DBの`uploaded`ステータスの動画は既にYouTubeにアップロード済みなので、TikTokへの投稿は新しく生成される動画のみになります。または、DB内の`downloaded`ステータスの動画（YouTube未投稿）をTikTokに投稿できます。
