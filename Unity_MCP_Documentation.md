# Unity MCP サーバー機能ドキュメント

このドキュメントでは、RooCodeから利用可能な2つのUnity MCPサーバーの機能と使用方法について説明します。

## 概要

### 利用可能なMCPサーバー

1. **unity-mcp-ts** (Node.js/TypeScript実装)
   - リポジトリ: [isuzu-shiranui/UnityMCP](https://github.com/isuzu-shiranui/UnityMCP)
   - バージョン: v0.2.0
   - 実装言語: TypeScript/Node.js

2. **unity-mcp-python** (Python実装)
   - リポジトリ: [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)
   - 実装言語: Python (FastMCP)

## 共通機能

両サーバーは以下の共通機能を提供します：

### 1. エディタ管理 (`manage_editor`)
Unityエディタの状態制御と情報取得

**主な操作:**
- エディタの再生/停止/一時停止
- エディタ状態の取得
- アクティブツールの設定
- タグ・レイヤーの追加
- プロジェクト設定の変更

**使用例:**
```
エディタを再生モードにする
エディタの現在の状態を確認する
新しいタグ "Enemy" を追加する
```

### 2. メニュー実行 (`execute_menu_item`)
Unityエディタのメニュー項目を実行

**主な操作:**
- ファイルメニューの実行 (保存、ビルドなど)
- ウィンドウメニューの実行
- カスタムメニューの実行

**使用例:**
```
File/Save Project を実行
Window/Package Manager を開く
Assets/Reimport All を実行
```

### 3. コンソール管理 (`read_console`)
Unityコンソールメッセージの読み取りとクリア

**主な操作:**
- エラー、警告、ログメッセージの取得
- メッセージのフィルタリング
- コンソールのクリア
- 特定期間のメッセージ取得

**使用例:**
```
最新のエラーメッセージを10件取得
警告メッセージのみをフィルタして表示
コンソールをクリア
```

### 4. シーン管理 (`manage_scene`)
Unityシーンの作成、読み込み、保存

**主な操作:**
- 新しいシーンの作成
- 既存シーンの読み込み
- シーンの保存
- シーン階層の取得
- ビルド設定への追加

**使用例:**
```
新しいシーン "MainMenu" を作成
"GameScene" を読み込む
現在のシーンを保存
シーン階層を取得
```

### 5. GameObject管理 (`manage_gameobject`)
シーン内のGameObjectの作成、変更、削除

**主な操作:**
- GameObjectの作成 (空、プリミティブ、プレハブから)
- 位置、回転、スケールの変更
- コンポーネントの追加・削除
- プロパティの設定
- 親子関係の設定
- プレハブとして保存

**使用例:**
```
空のGameObjectを作成
Cubeプリミティブを位置(0,1,0)に作成
"Player"という名前のGameObjectにRigidbodyコンポーネントを追加
GameObjectの位置を(5,0,5)に移動
```

### 6. スクリプト管理 (`manage_script`)
C#スクリプトファイルの作成、読み取り、更新、削除

**主な操作:**
- 新しいC#スクリプトの作成
- 既存スクリプトの読み取り
- スクリプト内容の更新
- スクリプトの削除
- MonoBehaviourやScriptableObjectテンプレートの使用

**使用例:**
```
"PlayerController" MonoBehaviourスクリプトを作成
既存の "GameManager" スクリプトを読み取り
スクリプトにメソッドを追加
```

### 7. アセット管理 (`manage_asset`)
プレハブやアセットの作成、変更、削除

**主な操作:**
- マテリアルの作成・変更
- テクスチャの作成・変更
- プレハブの作成・変更
- アセットの検索
- アセットの複製・移動
- フォルダの作成

**使用例:**
```
赤いマテリアルを作成
1024x1024のテクスチャを作成
GameObjectをプレハブとして保存
"Materials"フォルダを作成
```

### 8. シェーダー管理 (`manage_shader`)
シェーダーファイルの作成、読み取り、更新、削除

**主な操作:**
- 新しいシェーダーの作成
- 既存シェーダーの読み取り
- シェーダーコードの更新
- シェーダーの削除

**使用例:**
```
"CustomLit" シェーダーを作成
既存シェーダーのプロパティを変更
```

## サーバー固有の特徴

### unity-mcp-ts (Node.js版)
- **軽量**: 起動が高速
- **シンプル**: 基本的なUnity操作に特化
- **安定性**: TypeScriptによる型安全性

### unity-mcp-python (Python版)
- **高機能**: より詳細な制御が可能
- **拡張性**: Pythonエコシステムとの連携
- **柔軟性**: カスタマイズが容易

## 使用方法

### 1. RooCodeでの接続
1. RooCodeを起動
2. MCP Servers一覧から以下のいずれかまたは両方を選択:
   - `unity-mcp-ts`
   - `unity-mcp-python`
3. 接続を確立

### 2. Unityエディタとの連携
1. Unityエディタを起動
2. MCPサーバーが自動的にUnityに接続
3. RooCodeからUnity操作が可能になる

### 3. 基本的な使用パターン

#### ゲームオブジェクトの作成
```
1. 新しいシーンを作成
2. Cubeプリミティブを作成
3. 位置を(0, 1, 0)に設定
4. Rigidbodyコンポーネントを追加
5. シーンを保存
```

#### スクリプト開発
```
1. "PlayerController" MonoBehaviourスクリプトを作成
2. 移動ロジックを実装
3. GameObjectにスクリプトをアタッチ
4. プレハブとして保存
```

#### マテリアル作成
```
1. 新しいマテリアルを作成
2. 色を設定 (例: 赤色)
3. GameObjectに適用
```

## トラブルシューティング

### 接続エラー
- Unityエディタが起動していることを確認
- ファイアウォール設定を確認
- ポート6400が使用可能であることを確認

### コマンド実行エラー
- Unityプロジェクトが開かれていることを確認
- 対象のアセットやGameObjectが存在することを確認
- コンソールでエラーメッセージを確認

## 設定ファイル

RooCodeの設定ファイル: `%APPDATA%\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`

```json
{
  "mcpServers": {
    "unity-mcp-ts": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "C:/Users/owner/Dev/_repos/UnityMCP/unity-mcp-ts",
      "env": {}
    },
    "unity-mcp-python": {
      "command": "C:/Users/owner/Dev/_repos/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe",
      "args": ["server.py"],
      "cwd": "C:/Users/owner/Dev/_repos/unity-mcp/UnityMcpServer/src",
      "env": {}
    }
  }
}
```

## 今後の拡張

### Unity側パッケージの導入
Unityプロジェクトに以下のパッケージを追加することで、より高度な連携が可能：

```json
{
  "dependencies": {
    "com.unity.nuget.newtonsoft-json": "3.2.1",
    "jp.shiranui-isuzu.unity-mcp": "file:C:/Users/owner/Dev/_repos/UnityMCP/jp.shiranui-isuzu.unity-mcp",
    "com.justinpbarnett.unity-mcp": "file:C:/Users/owner/Dev/_repos/unity-mcp/UnityMcpBridge"
  }
}
```

### カスタムツールの追加
- 独自のMCPツールを開発
- プロジェクト固有の操作を自動化
- ワークフローの最適化

---

このドキュメントは、Unity MCPサーバーの基本的な使用方法を説明しています。具体的な使用例や詳細な設定については、各リポジトリのREADMEも参照してください。