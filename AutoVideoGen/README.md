# AutoVideoGen セットアップ手順

自動動画生成・投稿システムが構築されました。以下の手順で運用を開始してください。

## 1. クイックスタート

### ステップ 1: 依存関係のインストール
`C:\Users\owner\Dev\AutoVideoGen` でターミナルを開き、以下を実行してください：
```bash
npm install
```
Playwrightのブラウザもインストールします（初回のみ）：
```bash
npx playwright install
```

### ステップ 2: 動画ネタ（タイトル・台本）の生成
データベースには既に300件のサンプルデータが生成されています。
再生成する場合：
```bash
node scripts/1_generate_content.js
```

### ステップ 3: Vrew Web 自動化の実行
Pythonやマウス座標の設定は**不要**になりました。
ブラウザを自動操作して動画を作成します。
初回はVrewへのログインが必要になるため、ブラウザが表示されたら手動でログインしてください。

```bash
npx playwright test scripts/2_automate_vrew.ts --headed
```

### ステップ 4: 自動投稿
YouTubeへのアップロードを行います。
```bash
npx playwright test scripts/3_upload_videos.ts --headed
```
