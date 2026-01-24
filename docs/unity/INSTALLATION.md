# Unity MCP統合プロジェクト インストールガイド

## 📋 システム要件

### 必須要件
- **OS**: Windows 10/11 (64-bit)
- **Python**: 3.10以上
- **Node.js**: 18.0以上
- **Unity**: 2022.3 LTS以上
- **Blender**: 4.0以上
- **UV**: 最新版（Python パッケージマネージャー）

### 推奨システムスペック
- **CPU**: Intel i7/AMD Ryzen 7 以上（8コア推奨）
- **メモリ**: 16GB以上
- **GPU**: RTX 3060/RX 6600 以上（AI処理高速化）
- **ストレージ**: 20GB以上の空き容量（SSD推奨）

## 🚀 自動インストール（推奨）

### ワンクリックセットアップ
```bash
# プロジェクトをクローンしてセットアップを実行
git clone <repository-url> unity-mcp-integrated
cd unity-mcp-integrated
python tools/setup-all.py
```

この自動セットアップスクリプトが以下を実行します：
- すべての依存関係のインストール
- Python仮想環境の作成
- MCPサーバーの設定
- Claude Desktop統合
- 初期テスト実行

## 🔧 手動インストール

### 1. 基本環境のセットアップ

#### Python環境
```bash
# uvのインストール（Python パッケージマネージャー）
curl -LsSf https://astral.sh/uv/install.sh | sh
# または Windows用
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# プロジェクトディレクトリに移動
cd unity-mcp-integrated

# Python仮想環境の作成
uv venv
uv pip install -r requirements.txt
```

#### Node.js環境
```bash
# Node.jsの確認
node --version
npm --version

# 必要に応じてNode.jsをインストール
# https://nodejs.org/ からダウンロード
```

### 2. 各MCPサーバーのセットアップ

#### Unity MCP サーバー
```bash
# Unity MCPサーバーのセットアップ
cd servers/unity-mcp/UnityMcpServer/src
uv venv
uv pip install -r requirements.txt

# Unity Bridgeの設定（TypeScript）
cd ../../UnityMcpBridge
npm install
npm run build
```

#### Tripo MCP サーバー
```bash
# Tripo APIキーの設定
set TRIPO_API_KEY=your_tripo_api_key_here

# Tripo MCPパッケージのインストール
uvx tripo-mcp --help
```

#### Blender MCP サーバー
```bash
cd servers/blender-mcp
uv venv
uv pip install -e .

# Blender アドオンのインストール
# Blender起動 → Edit → Preferences → Add-ons → Install → addon.py を選択
```

### 3. アプリケーションのインストール

#### Unity Hub & Unity Editor
1. [Unity Hub](https://unity.com/download) をダウンロード・インストール
2. Unity Editor 2022.3 LTS をインストール
3. Unityを起動して動作確認

#### Blender
1. [Blender](https://www.blender.org/download/) をダウンロード・インストール
2. バージョン4.0以上を確認
3. アドオン `servers/blender-mcp/addon.py` をインストール

### 4. Claude Desktop統合

#### 設定ファイルのコピー
```bash
# Claude Desktop設定ディレクトリへコピー
# Windows の場合
copy config\claude-desktop-config.json %APPDATA%\Claude\claude_desktop_config.json

# または手動で Claude Desktop の設定に追加
```

#### 環境変数の設定
```bash
# 必要な環境変数を設定
set TRIPO_API_KEY=your_api_key
set BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 4.0\blender.exe
set UNITY_PATH=C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe
```

## 🧪 インストール確認

### 統合テストの実行
```bash
# 全システムのテスト
python tools/test-integration.py

# 個別サーバーテスト
python tools/setup-unity.py --test
python tools/setup-tripo.py --test
python tools/setup-blender.py --test
```

### 期待される出力例
```
=======================================================================
統合MCPテストツール v1.0.0
Unity + Tripo + Blender MCP 統合テスト
=======================================================================

🧪 各MCPサーバーのテストを実行中...

📋 Unity MCPテスト...
✅ PASS unity-mcp: ディレクトリ確認 - サーバースクリプトが存在します
✅ PASS unity-mcp: Python環境確認 - モジュールのimportが成功
✅ PASS unity-mcp: MCPプロトコル確認 - サーバーが正常に応答

📋 Tripo MCPテスト...
✅ PASS tripo-mcp: 環境変数確認 - TRIPO_API_KEY が設定されています
✅ PASS tripo-mcp: uvxコマンド確認 - uvx が利用可能
✅ PASS tripo-mcp: パッケージ確認 - tripo-mcp が正常に実行可能

📋 Blender MCPテスト...
✅ PASS blender-mcp: ディレクトリ確認 - blender-mcpディレクトリが存在
✅ PASS blender-mcp: Python環境確認 - モジュールのimportが成功
✅ PASS blender-mcp: サーバー起動確認 - サーバーが正常に起動

🎉 統合テストが正常に完了しました！
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### Python関連
```bash
# Python バージョンエラー
python --version  # 3.10以上を確認

# UV インストールエラー
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc  # または新しいターミナルを開く

# 依存関係エラー
uv pip install --upgrade pip
uv pip install -r requirements.txt --force-reinstall
```

#### Unity関連
```bash
# Unity Hub が見つからない
# パスを手動設定
set UNITY_HUB_PATH=C:\Program Files\Unity Hub\Unity Hub.exe

# Unity Editor バージョンエラー
# Unity Hub から 2022.3 LTS をインストール

# Unity MCP Bridge ビルドエラー
cd servers/unity-mcp/UnityMcpBridge
npm install --force
npm run build
```

#### Blender関連
```bash
# Blender パスエラー
set BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 4.0\blender.exe

# アドオン インストールエラー
# 手動でBlenderのPreferencesからインストール
# Edit → Preferences → Add-ons → Install → addon.py

# ソケット接続エラー
# Windows ファイアウォールでポート9876を開放
netsh advfirewall firewall add rule name="Blender MCP" dir=in action=allow protocol=TCP localport=9876
```

#### Tripo API関連
```bash
# API キーエラー
# 環境変数の確認
echo $TRIPO_API_KEY

# API 制限エラー
# Tripo アカウントのクォータを確認
# https://platform.tripo3d.ai/ でアカウント状況を確認
```

### ログの確認
```bash
# 詳細なログを確認
cat logs/test-integration.log
cat logs/unity-mcp.log
cat logs/blender-mcp.log
cat logs/tripo-mcp.log
```

## 📊 個別セットアップスクリプト

### Unity MCP のみセットアップ
```bash
python tools/setup-unity.py
```

### Tripo MCP のみセットアップ
```bash
python tools/setup-tripo.py
```

### Blender MCP のみセットアップ
```bash
python tools/setup-blender.py
```

## 🔄 アップデート手順

### プロジェクト全体のアップデート
```bash
git pull origin main
python tools/setup-all.py --update
```

### 個別コンポーネントのアップデート
```bash
# Unity MCP更新
cd servers/unity-mcp
git pull origin main

# Tripo MCP更新
uvx --reinstall tripo-mcp

# Blender MCP更新
cd servers/blender-mcp
uv pip install --upgrade -e .
```

## 🚀 本格運用に向けて

### パフォーマンス最適化
```bash
# GPU使用の有効化
set CUDA_VISIBLE_DEVICES=0
set TORCH_CUDA_ARCH_LIST="7.5;8.0;8.6"

# 並列処理の最適化
set UV_CONCURRENT_INSTALLS=8
set NODE_OPTIONS="--max-old-space-size=8192"
```

### セキュリティ設定
```bash
# APIキーの安全な管理
# .env ファイルを使用
echo "TRIPO_API_KEY=your_key_here" > .env

# ファイアウォール設定
# ポート27182（Unity MCP）、27183（Tripo MCP）、27184（Blender MCP）、9876（Blender）
```

### 監視とロギング
```bash
# ログローテーション設定
# config/logging.conf を編集

# ヘルスチェックの設定
python tools/health-check.py --daemon
```

## 📞 サポート

### エラー報告
問題が発生した場合：
1. `logs/` ディレクトリの全ログファイルを確認
2. `python tools/test-integration.py` でシステム状況を確認
3. GitHub Issues で報告

### 開発者向け情報
- API ドキュメント: `docs/api/`
- 開発者ガイド: `DEVELOPMENT.md`
- 貢献ガイド: `CONTRIBUTING.md`

---

このインストールガイドに従うことで、Unity MCP統合プロジェクトの完全なセットアップが可能です。問題が発生した場合は、トラブルシューティングセクションを参照してください。