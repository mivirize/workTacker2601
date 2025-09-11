# Roo（Claude Code）MCP統合設定ガイド

## 📋 概要

このガイドでは、Unity、Tripo、BlenderのMCPサーバーをRoo（Claude Code）で実際に使用するための詳細な設定手順を説明します。

## 🚀 クイックセットアップ

### 1. 前提条件の確認

以下がインストール済みであることを確認：
- **Python 3.10以上** 
- **Node.js 18以上**
- **UV パッケージマネージャー**
- **Unity 2022.3 LTS以上**
- **Blender 4.0以上**
- **Roo（Claude Code）v1.0.0以上**

### 2. 環境変数の設定

Windows PowerShellまたはコマンドプロンプトで以下を実行（すべてオプション）：

```powershell
# Tripo API キー（オプション - 設定しない場合はデモモードで動作）
[System.Environment]::SetEnvironmentVariable("TRIPO_API_KEY", "your_api_key_here", "User")

# Blender実行パス（オプション、デフォルト設定があります）
[System.Environment]::SetEnvironmentVariable("BLENDER_PATH", "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe", "User")
```

**注意**: Tripo APIキーが未設定でもすべてのMCPサーバーは起動しますが、実際の3D生成機能を使用するには有効なAPIキーが必要です。

### 3. Roo（Claude Code）設定ファイルの確認

**重要**: Roo用の設定ファイルは既に作成済みです：

```
.kiro/mcp_servers.json
```

このファイルには以下の4つのMCPサーバーが設定されています：
- **unity-mcp-python**: Unity Editor操作、ゲームオブジェクト管理
- **unity-mcp-ts**: Unity Editorメニュー実行
- **tripo-mcp**: AI 3Dモデル生成
- **blender-mcp**: Blender操作、3Dモデル編集

## 📝 Roo設定ファイルの詳細

### サーバー設定

```json
{
  "servers": {
    "unity-mcp-python": {
      "type": "stdio",
      "command": "C:/Users/owner/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe",
      "args": ["server.py"],
      "cwd": "C:/Users/owner/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src",
      "description": "Unity MCP Python Server",
      "enabled": true
    }
    // ... 他のサーバー設定
  }
}
```

### パス設定のカスタマイズ

**重要**: 他の環境で使用する場合は、以下のパスを実際の環境に合わせて変更してください：

#### 1. Unity MCP Python Server
```json
"command": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe",
"cwd": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src"
```

#### 2. Unity MCP TypeScript Server
```json
"cwd": "C:/Users/[あなたのユーザー名]/Dev/_repos/UnityMCP/unity-mcp-ts"
```

#### 3. Blender MCP Server
```json
"C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/servers/blender-mcp"
```

#### 4. ログファイル
```json
"file": "C:/Users/[あなたのユーザー名]/Dev/unity-mcp-integrated/logs/roo-mcp.log"
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

# Tripo MCP サーバー（APIキー無しでも起動可能）
uvx tripo-mcp

# Blender MCP サーバー
cd "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\servers\blender-mcp"
uv run python -m blender_mcp.server
```

### 2. Roo（Claude Code）での接続確認

Rooを起動し、以下をテスト：

```
Unity MCPサーバーに接続できますか？利用可能なツールを教えてください。
```

### 3. 各MCPサーバーの利用可能ツール確認

#### Unity MCP Python Server
- [`manage_script`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - C#スクリプト作成・管理
- [`manage_scene`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - Unity シーン操作
- [`manage_editor`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - Unity Editor制御
- [`manage_gameobject`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - ゲームオブジェクト操作
- [`manage_asset`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - アセット管理
- [`manage_shader`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - シェーダー作成・編集
- [`read_console`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - Unity Console読み取り
- [`execute_menu_item`](unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src/server.py) - Unity Editor メニュー実行

#### Unity MCP TypeScript Server
- [`menu_execute`](_repos/UnityMCP/unity-mcp-ts/src/index.ts) - Unity Editor メニュー実行

#### Tripo MCP Server
- `generate_3d_model` - テキストから3Dモデル生成
- `refine_model` - 3Dモデルの最適化
- `get_model_status` - 生成状況確認
- `download_model` - モデルダウンロード

#### Blender MCP Server
- `create_object` - Blenderオブジェクト作成
- `modify_object` - オブジェクト編集
- `render_scene` - シーンレンダリング
- `export_model` - モデルエクスポート
- `import_model` - モデルインポート
- `optimize_mesh` - メッシュ最適化

## 🛠️ トラブルシューティング

### 一般的な問題と解決方法

#### 1. "MCPサーバーに接続できません"
**解決方法**:
- [`.kiro/mcp_servers.json`](.kiro/mcp_servers.json) のパス設定が正確か確認
- 各サーバーが個別に起動するか確認
- ファイアウォール設定を確認
- Rooを再起動

#### 2. "Python環境が見つかりません"
**解決方法**:
```powershell
# 仮想環境の再作成
cd unity-mcp-integrated/servers/unity-mcp/UnityMcpServer/src
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
- 環境変数 `TRIPO_API_KEY` が正しく設定されているか確認
- APIキー無しでもサーバーは起動しますが、生成機能は制限されます
- Roo再起動後に再テスト
- API キーが有効か Tripo ダッシュボードで確認

#### 5. "Blenderが見つかりません"
**解決方法**:
- Blenderがインストールされているか確認
- `BLENDER_PATH` 環境変数を実際のBlenderインストールパスに設定
- パス設定を確認（例：`C:\Program Files\Blender Foundation\Blender 4.0\blender.exe`）

#### 6. "Roo（Claude Code）で MCP サーバーが認識されない"
**解決方法**:
- [`.kiro/mcp_servers.json`](.kiro/mcp_servers.json) の JSON 形式が正しいか確認
- ファイルが正しい場所に配置されているか確認
- Rooを完全に再起動
- Rooの設定画面でMCPサーバーの状態を確認

### ログの確認方法

```powershell
# Roo MCP ログ
Get-Content "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\logs\roo-mcp.log" -Tail 50

# 統合テストログ
Get-Content "C:\Users\[ユーザー名]\Dev\unity-mcp-integrated\logs\integration-test-report.json"
```

## 🎯 使用例（Roo向け）

### 1. Unity基本操作
```
Unity Editorで新しい空のシーンを作成してください
```

### 2. 3D生成（Tripo + Unity）
```
"cute robot cat"というテキストから3Dモデルを生成して、Unityにインポートしてください
```

### 3. 高度なワークフロー（Tripo + Blender + Unity）
```
"fantasy sword"から3Dモデルを生成し、Blenderで最適化してからUnityに統合してください
```

### 4. Unity スクリプト開発
```
プレイヤーの移動を制御するC#スクリプト「PlayerController」を作成してください
```

### 5. Unity Editor操作
```
Unity Editorで現在のシーンを保存し、Build Settingsを開いてください
```

## 🔄 定義済みワークフロー

### AI 3D パイプライン
1. **Tripo MCP**: テキストから3Dモデル生成
2. **Blender MCP**: モデル最適化・編集
3. **Unity MCP**: Unityへの統合・シーンセットアップ

### シンプル3D生成
1. **Tripo MCP**: テキストから3Dモデル生成
2. **Unity MCP**: Unityへの直接インポート

### Unity開発ワークフロー
1. **Unity MCP Python**: シーン・オブジェクト管理
2. **Unity MCP TypeScript**: Editor コマンド実行

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

# TypeScript サーバーの更新
cd _repos/UnityMCP/unity-mcp-ts
npm update
npm run build
```

## 🌟 Roo（Claude Code）特有の機能

### 1. 並行処理サポート
- 複数のMCPサーバーを同時に利用可能
- 最大4つのサーバーへの同時接続をサポート

### 2. 統合ワークフロー
- 定義済みワークフローの自動実行
- サーバー間の依存関係を自動管理

### 3. 高度な環境管理
- 環境変数の自動展開
- パス設定の動的解決

### 4. エラーハンドリング
- 自動リトライ機能
- タイムアウト設定
- 詳細なログ出力

## 📞 サポート

問題が発生した場合：

1. **統合テスト実行**: `python unity-mcp-integrated/tools/test-integration.py`
2. **ログファイル確認**: `unity-mcp-integrated/logs/` ディレクトリ内のファイル
3. **個別サーバーテスト**: 上記の動作確認手順を実施
4. **Roo設定確認**: [`.kiro/mcp_servers.json`](.kiro/mcp_servers.json) の内容を検証

## 📋 チェックリスト

### 初回設定時
- [ ] 前提条件のソフトウェアがインストール済み
- [ ] 環境変数が正しく設定されている
- [ ] [`.kiro/mcp_servers.json`](.kiro/mcp_servers.json) のパスが現在の環境に合っている
- [ ] 各MCPサーバーが個別に起動できる
- [ ] Roo（Claude Code）でサーバーが認識されている

### 日常使用時
- [ ] Unity Editorが起動している（Unity MCP使用時）
- [ ] Blenderが適切にインストールされている（Blender MCP使用時）
- [ ] Tripo API キーが有効である（Tripo MCP使用時）
- [ ] 必要な Python/Node.js 環境がアクティブ

---

このガイドに従って設定することで、Roo（Claude Code）でUnity、Tripo、BlenderのMCPサーバーをフル活用できます。