# Claude Desktop MCP統合設定ガイド

## 📋 概要

このガイドでは、Unity、Tripo、BlenderのMCPサーバーをClaude Desktopで実際に使用するための詳細な設定手順を説明します。

## 🚀 クイックセットアップ

### 1. 前提条件の確認

以下がインストール済みであることを確認：
- **Python 3.10以上** 
- **Node.js 18以上**
- **UV パッケージマネージャー**
- **Unity 2022.3 LTS以上**
- **Blender 4.0以上**

### 2. 環境変数の設定

Windows PowerShellまたはコマンドプロンプトで以下を実行（オプション）：

```powershell
# Tripo API キー（オプション - 設定しない場合はデモモードで動作）
[System.Environment]::SetEnvironmentVariable("TRIPO_API_KEY", "your_api_key_here", "User")

# Blender実行パス（オプション、デフォルト設定があります）
[System.Environment]::SetEnvironmentVariable("BLENDER_PATH", "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe", "User")
```

**注意**: Tripo APIキーが未設定でもシステムは起動しますが、実際の3D生成機能を使用するには有効なAPIキーが必要です。

### 3. Claude Desktop設定ファイルの配置

**重要**: 以下のパスにClaude Desktop設定ファイルを配置：

```
%APPDATA%\Claude\claude_desktop_config.json
```

実際のパス例：
```
C:\Users\[ユーザー名]\AppData\Roaming\Claude\claude_desktop_config.json
```

## 📝 Claude Desktop設定ファイル内容

以下の内容を`claude_desktop_config.json`にコピーしてください：

```json
{
  "mcpServers": {
    "unity-mcp-python": {
      "command": "C:/Users/owner/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe",
      "args": [
        "server.py"
      ],
      "cwd": "C:/Users/owner/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src"
    },
    "unity-mcp-ts": {
      "command": "node",
      "args": [
        "build/index.js"
      ],
      "cwd": "C:/Users/owner/Dev/_repos/UnityMCP/unity-mcp-ts"
    },
    "tripo-mcp": {
      "command": "uvx",
      "args": [
        "tripo-mcp"
      ],
      "env": {
        "TRIPO_API_KEY": "${TRIPO_API_KEY:-demo_key}"
      }
    },
    "blender-mcp": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/owner/Dev/unity-mcp-integrated/servers/blender-mcp",
        "python",
        "-m",
        "blender_mcp.server"
      ],
      "env": {
        "BLENDER_HOST": "localhost",
        "BLENDER_PORT": "9876",
        "BLENDER_PATH": "${BLENDER_PATH:-C:/Program Files/Blender Foundation/Blender 4.0/blender.exe}"
      }
    }
  },
  "global": {
    "logging": {
      "level": "info",
      "file": "C:/Users/owner/Dev/unity-mcp-integrated/logs/claude-desktop.log"
    },
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

## 🔧 パス設定のカスタマイズ

**重要**: 上記設定の以下のパスを実際の環境に合わせて変更してください：

### Unity MCP Python Server
```json
"command": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe",
"cwd": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src"
```

### Unity MCP TypeScript Server
```json
"cwd": "C:/Users/[あなたのユーザー名]/Dev/_repos/UnityMCP/unity-mcp-ts"
```

### Blender MCP Server
```json
"C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/blender-mcp"
```

### ログファイル
```json
"file": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/logs/claude-desktop.log"
```

## ✅ 動作確認手順

### 1. MCPサーバー個別テスト

各サーバーが正常に起動することを確認：

```powershell
# Unity MCP Python サーバー
cd "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\servers\unity-mcp\UnityMcpServer\src"
.venv\Scripts\python.exe server.py

# Unity MCP TypeScript サーバー  
cd "C:\Users\[ユーザー名]\Dev\_repos\UnityMCP\unity-mcp-ts"
npm run build
node build/index.js

# Tripo MCP サーバー（API キー必要）
uvx tripo-mcp

# Blender MCP サーバー
cd "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\servers\blender-mcp"
uv run python -m blender_mcp.server
```

### 2. Claude Desktop再起動

設定ファイル変更後、Claude Desktopを完全に再起動してください：

1. Claude Desktopを終了
2. タスクマネージャーでプロセスが完全に終了していることを確認
3. Claude Desktopを再起動

### 3. 接続確認

Claude Desktopで以下をテスト：

```
Unity MCPサーバーに接続できますか？
```

## 🛠️ トラブルシューティング

### 一般的な問題と解決方法

#### 1. "MCPサーバーに接続できません"
**解決方法**:
- パス設定が正確か確認
- 各サーバーが個別に起動するか確認
- ファイアウォール設定を確認

#### 2. "Python環境が見つかりません"
**解決方法**:
```powershell
# 仮想環境の再作成
cd servers/unity-mcp/UnityMcpServer/src
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. "Node.js モジュールが見つかりません"
**解決方法**:
```powershell
cd _repos/UnityMCP/unity-mcp-ts
npm install
npm run build
```

#### 4. "Tripo API キーエラー"
**解決方法**:
- 実際の3D生成を行うには有効なTripo APIキーが必要です
- 環境変数が正しく設定されているか確認
- APIキー無しでもサーバーは起動しますが、生成機能は制限されます
- Claude Desktop再起動後に再テスト

#### 5. "Blenderが見つかりません"
**解決方法**:
- Blenderがインストールされているか確認
- パス設定を実際のBlenderインストールパスに変更

### ログの確認方法

```powershell
# Claude Desktop ログ
Get-Content "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\logs\claude-desktop.log" -Tail 50

# 統合テストログ
Get-Content "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\logs\integration-test-report.json"
```

## 🎯 使用例

Claude Desktopでの基本的な使用例：

### 1. Unity操作
```
Unity Editorで新しい空のシーンを作成してください
```

### 2. 3D生成（Tripo + Unity）
```
"cute cat"というテキストから3Dモデルを生成して、Unityにインポートしてください
```

### 3. 高度なワークフロー（Tripo + Blender + Unity）
```
"robot warrior"から3Dモデルを生成し、Blenderで最適化してからUnityに統合してください
```

## 🔄 更新・メンテナンス

### 定期的なアップデート

```powershell
# プロジェクト全体の更新
cd unity-mcp-integrated
git pull origin main

# Tripo MCPの更新
uvx --reinstall tripo-mcp

# Unity MCP dependencies更新
cd servers/unity-mcp/UnityMcpServer/src
.venv\Scripts\pip install --upgrade -r requirements.txt
```

## 📞 サポート

問題が発生した場合：

1. **統合テスト実行**: `python tools/test-integration.py`
2. **ログファイル確認**: `logs/` ディレクトリ内のファイル
3. **個別サーバーテスト**: 上記の動作確認手順を実施

---

このガイドに従って設定することで、Claude DesktopでUnity、Tripo、BlenderのMCPサーバーをフル活用できます。