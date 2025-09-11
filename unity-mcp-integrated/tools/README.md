# 統合ツール

このディレクトリには、Unity MCP統合プロジェクトの管理とセットアップに必要なツールが含まれています。

## ツール一覧

### setup-tripo.js
Tripo MCPサーバーの完全セットアップツールです。

#### 機能
- Node.jsバージョンの確認
- 必要な環境変数の検証
- tripo-mcpリポジトリの確認
- 依存関係の自動インストール
- プロジェクトのビルド
- 設定ファイルの検証
- 接続テスト

#### 使用方法
```bash
node tools/setup-tripo.js
```

#### 前提条件
- Node.js 18以上
- TRIPO_API_KEY環境変数の設定
- Git（リポジトリクローン用）

#### 出力
- コンソールへの進捗表示
- `logs/setup.log`へのログ記録

### 今後追加予定のツール

#### health-check.js
```bash
node tools/health-check.js
```
全MCPサーバーの健全性チェックを実行します。

#### validate-environment.js
```bash
node tools/validate-environment.js
```
環境変数とシステム要件の包括的な検証を実行します。

#### server-manager.js
```bash
node tools/server-manager.js [start|stop|restart|status]
```
すべてのMCPサーバーの統合管理を行います。

## 開発者向け情報

### ログファイル
すべてのツールは `logs/` ディレクトリにログを出力します：
- `setup.log`: セットアップツールのログ
- `health-check.log`: ヘルスチェックのログ
- `server-manager.log`: サーバー管理のログ

### エラーハンドリング
各ツールは以下の終了コードを使用します：
- `0`: 成功
- `1`: 一般的なエラー
- `2`: 環境要件不足
- `3`: 設定エラー
- `4`: 接続エラー

### カスタマイズ
ツールの動作は以下の方法でカスタマイズできます：
- 環境変数による設定
- コマンドライン引数
- 設定ファイルの編集

## トラブルシューティング

### よくある問題

1. **Node.jsバージョンエラー**
   - Node.js 18以上をインストールしてください
   - `node --version`でバージョンを確認

2. **環境変数未設定**
   - `TRIPO_API_KEY`を設定してください
   - Windows: `$env:TRIPO_API_KEY="your_key"`
   - Linux/Mac: `export TRIPO_API_KEY="your_key"`

3. **ビルドエラー**
   - `npm install`を手動実行してください
   - TypeScriptがインストールされていることを確認

4. **接続テスト失敗**
   - APIキーが正しいことを確認
   - ネットワーク接続を確認
   - ファイアウォール設定を確認

### サポート
問題が解決しない場合は、`logs/`ディレクトリのログファイルを確認し、エラーの詳細を特定してください。