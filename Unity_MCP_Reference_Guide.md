# Unity MCP 機能参照ガイド

Unity MCPは、AI アシスタント（Claude、Cursor など）がModel Context Protocol（MCP）を通じて Unity Editor と直接やり取りできるようにするツールです。このガイドでは、実際の Unity 開発現場で効率的に MCP を活用するための包括的な情報を提供します。

**最終更新日**: 2025年8月26日
**対応MCPサーバーバージョン**: Python版 1.0.0, TypeScript版 1.0.0
**対応Unity バージョン**: 2020.3 LTS 以降

## 目次

1. [クイックリファレンス](#クイックリファレンス)
2. [逆引きリファレンス（目的別ガイド）](#逆引きリファレンス目的別ガイド)
3. [MCPサーバー概要](#mcpサーバー概要)
4. [実用的なツールリファレンス](#実用的なツールリファレンス)
5. [実践的な使用例集](#実践的な使用例集)
6. [カスタムハンドラー作成ガイド](#カスタムハンドラー作成ガイド)
7. [トラブルシューティング](#トラブルシューティング)
8. [制限事項と注意点](#制限事項と注意点)

---

## クイックリファレンス

### 🚀 よく使うコマンド一覧

| 操作 | ツール | 基本コマンド例 |
|-----|--------|---------------|
| プレイモード開始 | [`manage_editor`](#1-manage_editor) | `action="play"` |
| GameObject作成 | [`manage_gameobject`](#3-manage_gameobject) | `action="create", name="Player", primitive_type="Cube"` |
| スクリプト作成 | [`manage_script`](#4-manage_script) | `action="create", name="PlayerController"` |
| シーン保存 | [`manage_scene`](#2-manage_scene) | `action="save"` |
| マテリアル作成 | [`manage_asset`](#5-manage_asset) | `action="create", asset_type="Material"` |
| コンソール確認 | [`read_console`](#7-read_console) | `action="get", types=["error"]` |

### 📋 頻繁に使われるパラメータ

#### 位置・回転・スケール
```json
"position": [0, 1, 0]      // X, Y, Z 座標
"rotation": [0, 0, 0]      // X, Y, Z 回転角（度）
"scale": [1, 1, 1]         // X, Y, Z スケール
```

#### 検索方法
```json
"search_method": "by_name"    // 名前で検索（最高速）
"search_method": "by_id"      // IDで検索（高速）
"search_method": "by_path"    // パスで検索（中速）
```

#### アセットタイプ
```json
"asset_type": "Material"         // マテリアル
"asset_type": "Texture"          // テクスチャ
"asset_type": "PhysicsMaterial"  // 物理マテリアル
"asset_type": "Folder"           // フォルダ
```

### ⚡ 緊急時のトラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| **Unity Bridgeが接続しない** | 1. Unity再起動 2. `Window > Unity MCP` で接続確認 3. パッケージ再インストール |
| **MCPサーバーが起動しない** | 1. パス確認 2. `uv --version` 確認 3. 手動実行テスト: `uv run server.py` |
| **権限エラー（macOS/Linux）** | `chmod +x /path/to/server.py` |
| **GameObject が見つからない** | `manage_scene(action="get_hierarchy")` で階層確認 |
| **スクリプトコンパイルエラー** | `read_console(action="get", types=["error"])` でエラー詳細確認 |

---

## 逆引きリファレンス（目的別ガイド）

### 🎮 ゲーム開発

<details>
<summary><b>プロトタイプを素早く作りたい</b></summary>

1. **基本シーンセットアップ**
   ```
   manage_scene(action="create", name="Prototype")
   manage_gameobject(action="create", name="Player", primitive_type="Capsule")
   manage_gameobject(action="create", name="Ground", primitive_type="Cube", scale=[10,0.1,10])
   ```

2. **プレイヤー移動スクリプト追加**
   ```
   manage_script(action="create", name="PlayerController", ...)
   manage_gameobject(action="modify", target="Player", components_to_add=["PlayerController"])
   ```

3. **テスト実行**
   ```
   manage_editor(action="play")
   ```
</details>

<details>
<summary><b>敵キャラクターを配置したい</b></summary>

1. **敵プレハブ作成**
   ```
   manage_gameobject(action="create", name="Enemy", primitive_type="Cube",
                    components_to_add=["Rigidbody"], save_as_prefab=true)
   ```

2. **複数配置**
   ```
   manage_gameobject(action="create", name="Enemy1", position=[5,0,0])
   manage_gameobject(action="create", name="Enemy2", position=[-5,0,0])
   ```
</details>

### 🎨 アート・デザイン

<details>
<summary><b>マテリアルを作成・適用したい</b></summary>

1. **マテリアル作成**
   ```
   manage_asset(action="create", path="Assets/Materials/Red.mat",
               asset_type="Material", properties={"color": [1,0,0,1]})
   ```

2. **オブジェクトに適用**
   ```
   manage_gameobject(action="modify", target="Player",
                    component_properties={"MeshRenderer": {"material": "Assets/Materials/Red.mat"}})
   ```
</details>

<details>
<summary><b>カスタムシェーダーを作成したい</b></summary>

```
manage_shader(action="create", name="CustomShader", path="Assets/Shaders/",
             contents="Shader \"Custom/MyShader\" { ... }")
```
</details>

### 🔧 技術・システム

<details>
<summary><b>パフォーマンスをデバッグしたい</b></summary>

1. **コンソールエラー確認**
   ```
   read_console(action="get", types=["error", "warning"], count=20)
   ```

2. **シーン階層分析**
   ```
   manage_scene(action="get_hierarchy")
   ```

3. **オブジェクト検索**
   ```
   manage_gameobject(action="find", search_term="Heavy", find_all=true)
   ```
</details>

<details>
<summary><b>スクリプトを効率的に管理したい</b></summary>

1. **既存スクリプト読み取り**
   ```
   manage_script(action="read", name="ExistingScript", path="Assets/Scripts/")
   ```

2. **スクリプト更新**
   ```
   manage_script(action="update", name="PlayerController", contents="...", ...)
   ```

3. **名前空間整理**
   ```
   namespace="Game.Player", script_type="MonoBehaviour"
   ```
</details>

### 📁 プロジェクト管理

<details>
<summary><b>アセットを整理したい</b></summary>

1. **フォルダ作成**
   ```
   manage_asset(action="create", path="Assets/Characters/", asset_type="Folder")
   ```

2. **アセット移動**
   ```
   manage_asset(action="move", path="Assets/Player.prefab",
               destination="Assets/Characters/Player.prefab")
   ```

3. **アセット検索**
   ```
   manage_asset(action="search", search_pattern="*.prefab",
               filter_type="Prefab")
   ```
</details>

<details>
<summary><b>シーンを効率的に管理したい</b></summary>

1. **シーン作成・切り替え**
   ```
   manage_scene(action="create", name="Level1", path="Assets/Scenes/")
   manage_scene(action="load", name="Level1")
   ```

2. **バックアップ作成**
   ```
   manage_scene(action="save", name="Level1_Backup")
   ```
</details>

### 🐛 デバッグ・テスト

<details>
<summary><b>実行時エラーを調査したい</b></summary>

1. **プレイモード開始**
   ```
   manage_editor(action="play")
   ```

2. **エラーログ確認**
   ```
   read_console(action="get", types=["error"], include_stacktrace=true)
   ```

3. **特定オブジェクトの状態確認**
   ```
   manage_gameobject(action="get_components", target="Player", search_method="by_name")
   ```
</details>

<details>
<summary><b>メモリリークを調査したい</b></summary>

1. **オブジェクト数確認**
   ```
   manage_scene(action="get_hierarchy")
   ```

2. **コンソールでメモリ関連警告確認**
   ```
   read_console(action="get", filter_text="memory", types=["warning"])
   ```
</details>

---

## MCPサーバー概要

### 利用可能なサーバー

Unity MCPは2つの異なるサーバー実装を提供しています：

#### 1. Python版MCPサーバー（推奨）
- **場所**: `UnityMcpServer/src/server.py`
- **特徴**:
  - FastMCP フレームワークを使用
  - 高度なロギングとエラーハンドリング
  - Base64エンコーディングによる安全なテキスト転送
  - 豊富なツールセット（8つの主要ツール）
- **実行方法**: `uv run server.py`

#### 2. TypeScript版MCPサーバー
- **場所**: `unity-mcp-ts/src/index.ts`
- **特徴**:
  - MCP SDK の公式実装を使用
  - 動的ハンドラー発見システム
  - 拡張可能なアーキテクチャ
  - カスタムハンドラーの柔軟な追加
- **実行方法**: `npm run build && node build/index.js`

### アーキテクチャ

```
[AI アシスタント] ←→ [MCPクライアント] ←→ [MCPサーバー] ←→ [Unity MCP Bridge] ←→ [Unity Editor]
```

### 接続と設定

#### 自動設定（推奨）
1. Unity で `Window > Unity MCP` を開く
2. 使用する IDE の `Auto Configure` をクリック
3. 緑色のステータスインジケーター 🟢 と「Connected」を確認

#### 手動設定
MCP クライアントの設定ファイルを編集：

**Windows（Claude Desktop）**:
```json
{
  "mcpServers": {
    "UnityMCP": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Programs\\UnityMCP\\UnityMcpServer\\src",
        "server.py"
      ]
    }
  }
}
```

**macOS（Claude Desktop）**:
```json
{
  "mcpServers": {
    "UnityMCP": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/usr/local/bin/UnityMCP/UnityMcpServer/src",
        "server.py"
      ]
    }
  }
}
```

---

## 実用的なツールリファレンス

Unity MCPは8つの主要ツールを提供します。以下に各ツールの詳細な仕様を示します。

### 1. manage_editor

エディターの状態制御とクエリを行います。

**パラメータ**:
- `action` (必須): 実行する操作
  - `"play"`: プレイモード開始
  - `"pause"`: プレイモード一時停止
  - `"stop"`: プレイモード停止
  - `"get_state"`: 現在の状態を取得
  - `"set_active_tool"`: アクティブツールを設定
  - `"add_tag"`: 新しいタグを追加
  - `"add_layer"`: 新しいレイヤーを追加
- `wait_for_completion` (オプション): 操作完了まで待機するか
- `tool_name` (オプション): 設定するツール名
- `tag_name` (オプション): 追加するタグ名
- `layer_name` (オプション): 追加するレイヤー名

**戻り値**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "isPlaying": false,
    "isPaused": false,
    "activeSceneName": "SampleScene"
  }
}
```

**使用例**:
```
プレイモードを開始してください
→ manage_editor(action="play")

現在のエディター状態を確認してください
→ manage_editor(action="get_state")
```

### 2. manage_scene

シーンの作成、読み込み、保存、階層取得などを行います。

**パラメータ**:
- `action` (必須): 実行する操作
  - `"create"`: 新しいシーンを作成
  - `"load"`: シーンを読み込み
  - `"save"`: 現在のシーンを保存
  - `"get_hierarchy"`: シーン階層を取得
  - `"get_active_scene"`: アクティブシーンを取得
- `name` (必須): シーン名（拡張子なし）
- `path` (必須): アセットパス（デフォルト: "Assets/"）
- `build_index` (必須): ビルドインデックス

**戻り値**:
```json
{
  "success": true,
  "message": "Scene created successfully",
  "data": {
    "sceneName": "NewScene",
    "scenePath": "Assets/Scenes/NewScene.unity"
  }
}
```

**使用例**:
```
"GameScene"という名前のシーンを作成してください
→ manage_scene(action="create", name="GameScene", path="Assets/Scenes/", build_index=0)

現在のシーン階層を表示してください
→ manage_scene(action="get_hierarchy", name="", path="", build_index=0)
```

### 3. manage_gameobject

GameObjectの作成、変更、削除、検索、コンポーネント操作を行います。

**主要パラメータ**:
- `action` (必須): 実行する操作
  - `"create"`: 新しいGameObjectを作成
  - `"modify"`: 既存のGameObjectを変更
  - `"delete"`: GameObjectを削除
  - `"find"`: GameObjectを検索
  - `"add_component"`: コンポーネントを追加
  - `"remove_component"`: コンポーネントを削除
  - `"get_components"`: コンポーネント情報を取得
- `target` (オプション): 操作対象のGameObject名またはパス
- `search_method` (オプション): 検索方法（"by_name", "by_id", "by_path"）
- `name` (オプション): GameObject名
- `position`, `rotation`, `scale` (オプション): 位置、回転、スケール（配列形式）
- `components_to_add` (オプション): 追加するコンポーネントのリスト
- `component_properties` (オプション): コンポーネントプロパティの辞書

**戻り値**:
```json
{
  "success": true,
  "message": "GameObject created successfully",
  "data": {
    "objectName": "Player",
    "objectId": "12345",
    "position": [0, 0, 0],
    "components": ["Transform", "Rigidbody", "BoxCollider"]
  }
}
```

**使用例**:
```
プレイヤー用のキューブを作成してください
→ manage_gameobject(action="create", name="Player", primitive_type="Cube", position=[0, 1, 0], components_to_add=["Rigidbody", "BoxCollider"])

"Enemy"という名前のオブジェクトを見つけてください
→ manage_gameobject(action="find", search_term="Enemy", search_method="by_name")
```

### 4. manage_script

C#スクリプトの作成、読み取り、更新、削除を行います。

**パラメータ**:
- `action` (必須): 実行する操作（"create", "read", "update", "delete"）
- `name` (必須): スクリプト名（.cs拡張子なし）
- `path` (必須): アセットパス
- `contents` (必須): スクリプトのC#コード
- `script_type` (必須): スクリプトタイプ（例: "MonoBehaviour"）
- `namespace` (必須): 名前空間

**戻り値**:
```json
{
  "success": true,
  "message": "Script created successfully",
  "data": {
    "scriptName": "PlayerController",
    "scriptPath": "Assets/Scripts/PlayerController.cs",
    "compilationStatus": "Success"
  }
}
```

**使用例**:
```
プレイヤーコントローラースクリプトを作成してください
→ manage_script(action="create", name="PlayerController", path="Assets/Scripts/", contents="...", script_type="MonoBehaviour", namespace="Game.Player")
```

### 5. manage_asset

アセットのインポート、作成、変更、削除などを行います。

**パラメータ**:
- `action` (必須): 実行する操作
  - `"create"`: 新しいアセットを作成
  - `"import"`: アセットをインポート
  - `"modify"`: 既存アセットを変更
  - `"delete"`: アセットを削除
  - `"search"`: アセットを検索
  - `"get_info"`: アセット情報を取得
- `path` (必須): アセットパス
- `asset_type` (オプション): アセットタイプ（"Material", "Texture", "PhysicsMaterial"など）
- `properties` (オプション): アセットプロパティの辞書

**プロパティ例**:
- Material: `{"color": [1, 0, 0, 1], "shader": "Standard"}`
- Texture: `{"width": 1024, "height": 1024, "format": "RGBA32"}`
- PhysicsMaterial: `{"bounciness": 1.0, "staticFriction": 0.5}`

**戻り値**:
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "assetPath": "Assets/Materials/RedMaterial.mat",
    "assetType": "Material",
    "guid": "abc123def456"
  }
}
```

### 6. manage_shader

シェーダーの作成、読み取り、更新、削除を行います。

**パラメータ**:
- `action` (必須): 実行する操作（"create", "read", "update", "delete"）
- `name` (必須): シェーダー名
- `path` (必須): アセットパス
- `contents` (必須): シェーダーコード

**使用例**:
```
カスタムシェーダーを作成してください
→ manage_shader(action="create", name="CustomShader", path="Assets/Shaders/", contents="Shader \"Custom/MyShader\" { ... }")
```

### 7. read_console

Unity エディターのコンソールメッセージの取得またはクリアを行います。

**パラメータ**:
- `action` (オプション): 実行する操作（"get", "clear"）
- `types` (オプション): メッセージタイプ（["error", "warning", "log", "all"]）
- `count` (オプション): 取得する最大メッセージ数
- `filter_text` (オプション): テキストフィルター
- `since_timestamp` (オプション): 指定時刻以降のメッセージ（ISO 8601形式）
- `format` (オプション): 出力形式（"plain", "detailed", "json"）
- `include_stacktrace` (オプション): スタックトレースを含めるか

**戻り値**:
```json
{
  "success": true,
  "data": [
    {
      "message": "GameObject 'Player' was created",
      "type": "Log",
      "timestamp": "2024-01-01T12:00:00Z",
      "stackTrace": "..."
    }
  ]
}
```

### 8. execute_menu_item

Unity エディターのメニューアイテムをパス指定で実行します。

**パラメータ**:
- `menu_path` (必須): メニューアイテムのフルパス
- `action` (オプション): 実行する操作（デフォルト: "execute"）
- `parameters` (オプション): メニューアイテム用パラメータ

**使用例**:
```
プロジェクトを保存してください
→ execute_menu_item(menu_path="File/Save Project")

シーンを保存してください
→ execute_menu_item(menu_path="File/Save Scene")
```

---

## 実践的な使用例集

### 基本的なシーンセットアップ

```
新しいゲームシーンを作成して基本的なセットアップを行ってください：
1. "MainGame"という名前のシーンを作成
2. プレイヤー用のカプセルを作成（位置: 0, 1, 0）
3. 地面用のキューブを作成（位置: 0, 0, 0、スケール: 10, 0.1, 10）
4. メインカメラの位置を調整（位置: 0, 3, -5）
5. ディレクショナルライトを追加
```

**実行結果**:
1. `manage_scene(action="create", name="MainGame", path="Assets/Scenes/", build_index=1)`
2. `manage_gameobject(action="create", name="Player", primitive_type="Capsule", position=[0, 1, 0])`
3. `manage_gameobject(action="create", name="Ground", primitive_type="Cube", position=[0, 0, 0], scale=[10, 0.1, 10])`
4. `manage_gameobject(action="modify", target="Main Camera", search_method="by_name", position=[0, 3, -5])`
5. `manage_gameobject(action="create", name="Directional Light", components_to_add=["Light"])`

### プレイヤーコントローラーの作成

```
3Dプレイヤーコントローラーを作成してください：
1. PlayerControllerスクリプトを作成
2. プレイヤーオブジェクトにスクリプトを追加
3. 移動速度を設定
```

**スクリプト例**:
```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 5.0f;
    public float jumpForce = 10.0f;
    private Rigidbody rb;
    private bool isGrounded;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        MovePlayer();
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            Jump();
        }
    }

    void MovePlayer()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");
        
        Vector3 movement = new Vector3(horizontal, 0, vertical) * moveSpeed * Time.deltaTime;
        transform.Translate(movement);
    }

    void Jump()
    {
        rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        isGrounded = false;
    }
}
```

### マテリアルとシェーダーの作成

```
カスタムマテリアルとシェーダーを作成してください：
1. 赤色のマテリアルを作成
2. カスタムシェーダーを作成
3. プレイヤーオブジェクトにマテリアルを適用
```

**実行手順**:
1. `manage_asset(action="create", path="Assets/Materials/RedMaterial.mat", asset_type="Material", properties={"color": [1, 0, 0, 1]})`
2. `manage_shader(action="create", name="CustomPlayer", path="Assets/Shaders/", contents="...")`
3. `manage_gameobject(action="modify", target="Player", component_properties={"MeshRenderer": {"material": "Assets/Materials/RedMaterial.mat"}})`

### デバッグとテスト

```
現在のシーン状態をデバッグしてください：
1. コンソールログを確認
2. すべてのGameObjectを列挙
3. プレイモードで動作確認
```

**実行手順**:
1. `read_console(action="get", types=["all"], count=50)`
2. `manage_scene(action="get_hierarchy")`
3. `manage_editor(action="play")`

---

## カスタムハンドラー作成ガイド

Unity MCPでは、独自の機能を追加するためのカスタムハンドラーを作成できます。

### C#でのカスタムハンドラー実装

Unity側でカスタムコマンドハンドラーを作成する例：

```csharp
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

public static class CustomCommandHandlers
{
    [InitializeOnLoadMethod]
    static void RegisterCustomHandlers()
    {
        // カスタムハンドラーを登録
        UnityMcpBridge.CommandRegistry.RegisterCommand("custom_analytics", HandleAnalytics);
        UnityMcpBridge.CommandRegistry.RegisterCommand("custom_performance", HandlePerformance);
    }

    static object HandleAnalytics(Dictionary<string, object> parameters)
    {
        try
        {
            string action = parameters.ContainsKey("action") ? parameters["action"].ToString() : "";
            
            switch (action)
            {
                case "get_object_count":
                    return GetGameObjectCount();
                case "get_component_stats":
                    return GetComponentStatistics();
                default:
                    return new { success = false, error = $"Unknown action: {action}" };
            }
        }
        catch (System.Exception e)
        {
            return new { success = false, error = e.Message };
        }
    }

    static object HandlePerformance(Dictionary<string, object> parameters)
    {
        return new
        {
            success = true,
            data = new
            {
                frameRate = Application.targetFrameRate,
                memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false),
                renderTime = Time.unscaledDeltaTime * 1000 // ms
            }
        };
    }

    static object GetGameObjectCount()
    {
        var allObjects = GameObject.FindObjectsOfType<GameObject>();
        return new
        {
            success = true,
            data = new
            {
                totalObjects = allObjects.Length,
                activeObjects = System.Array.FindAll(allObjects, go => go.activeInHierarchy).Length
            }
        };
    }

    static object GetComponentStatistics()
    {
        var stats = new Dictionary<string, int>();
        var allObjects = GameObject.FindObjectsOfType<GameObject>();
        
        foreach (var obj in allObjects)
        {
            var components = obj.GetComponents<Component>();
            foreach (var component in components)
            {
                if (component != null)
                {
                    string typeName = component.GetType().Name;
                    stats[typeName] = stats.ContainsKey(typeName) ? stats[typeName] + 1 : 1;
                }
            }
        }

        return new { success = true, data = stats };
    }
}
```

### TypeScriptでのカスタムハンドラー実装

TypeScript版MCPサーバー用のカスタムハンドラー：

```typescript
import { z } from "zod";
import { BaseCommandHandler } from "../core/BaseCommandHandler.js";

export class ProjectAnalyticsHandler extends BaseCommandHandler {
    get commandPrefix(): string {
        return "analytics";
    }

    get description(): string {
        return "Unity project analytics and statistics";
    }

    async executeCommand(action: string, parameters: Record<string, any>): Promise<any> {
        try {
            switch (action.toLowerCase()) {
                case "get_project_stats":
                    return await this.getProjectStatistics();
                case "analyze_dependencies":
                    return await this.analyzeDependencies();
                case "performance_report":
                    return await this.generatePerformanceReport();
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    getToolDefinitions(): Map<string, any> {
        const tools = new Map();

        tools.set("analytics_get_stats", {
            description: "Get comprehensive project statistics",
            parameterSchema: {
                includeAssets: z.boolean().optional().describe("Include asset statistics"),
                includeScripts: z.boolean().optional().describe("Include script analysis")
            }
        });

        tools.set("analytics_performance", {
            description: "Generate performance analysis report",
            parameterSchema: {
                frameCount: z.number().optional().describe("Number of frames to analyze")
            }
        });

        return tools;
    }

    private async getProjectStatistics(): Promise<any> {
        const params = {
            action: "get_project_stats"
        };

        return await this.sendUnityRequest("custom_analytics.get_object_count", params);
    }

    private async analyzeDependencies(): Promise<any> {
        // Unity側でアセット依存関係を分析
        return await this.sendUnityRequest("custom_analytics.analyze_dependencies", {});
    }

    private async generatePerformanceReport(): Promise<any> {
        return await this.sendUnityRequest("custom_performance", {
            action: "get_stats"
        });
    }
}
```

### JavaScriptでのシンプルなハンドラー

簡単なJavaScriptハンドラーの例：

```javascript
export class SimpleUtilityHandler {
    constructor(unityConnection) {
        this.unity = unityConnection;
        this.commandPrefix = "utility";
    }

    async executeCommand(action, parameters) {
        switch (action) {
            case "cleanup_empty_objects":
                return await this.cleanupEmptyObjects();
            case "optimize_hierarchy":
                return await this.optimizeHierarchy();
            case "backup_scene":
                return await this.backupCurrentScene();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    async cleanupEmptyObjects() {
        // 空のGameObjectを検索して削除
        const emptyObjects = await this.unity.sendCommand("manage_gameobject", {
            action: "find",
            search_method: "empty_objects"
        });

        if (emptyObjects.success && emptyObjects.data.length > 0) {
            for (const obj of emptyObjects.data) {
                await this.unity.sendCommand("manage_gameobject", {
                    action: "delete",
                    target: obj.name,
                    search_method: "by_name"
                });
            }
        }

        return {
            success: true,
            message: `Cleaned up ${emptyObjects.data?.length || 0} empty objects`
        };
    }

    async optimizeHierarchy() {
        // 階層の最適化ロジック
        return { success: true, message: "Hierarchy optimized" };
    }

    async backupCurrentScene() {
        // 現在のシーンをバックアップ
        return await this.unity.sendCommand("manage_scene", {
            action: "save",
            name: `Backup_${Date.now()}`,
            path: "Assets/Backups/"
        });
    }
}
```

---

## トラブルシューティング

### よくある問題と解決法

#### 1. Unity Bridgeが接続しない

**症状**: Unity MCP windowで「Disconnected」と表示される

**解決方法**:
1. Unity Editor が開いていることを確認
2. Unity を再起動
3. Package Manager から Unity MCP Bridge パッケージを再インストール
4. `Window > Unity MCP` でステータスを確認

**デバッグ手順**:
```csharp
// Unity Console で接続状態を確認
Debug.Log($"MCP Bridge Status: {UnityMcpBridge.IsConnected}");
Debug.Log($"Active Port: {UnityMcpBridge.GetActivePort()}");
```

#### 2. MCPサーバーが起動しない

**症状**: AI アシスタントで Unity MCP ツールが利用できない

**解決方法**:
1. **パスの確認**: MCP 設定ファイルのディレクトリパスが正確か確認
   ```bash
   # パスの存在確認（Windows）
   dir "C:\Users\USERNAME\AppData\Local\Programs\UnityMCP\UnityMcpServer\src"
   
   # パスの存在確認（macOS/Linux）
   ls -la "/usr/local/bin/UnityMCP/UnityMcpServer/src"
   ```

2. **uv の確認**: Python パッケージマネージャーが正しくインストールされているか
   ```bash
   uv --version
   # インストールされていない場合
   pip install uv
   ```

3. **手動実行テスト**: サーバーを直接実行してエラーを確認
   ```bash
   cd /path/to/UnityMCP/UnityMcpServer/src
   uv run server.py
   ```

#### 3. 権限エラー（macOS/Linux）

**症状**: "Permission denied" エラーが発生

**解決方法**:
1. ファイルの実行権限を付与
   ```bash
   chmod +x /usr/local/bin/UnityMCP/UnityMcpServer/src/server.py
   ```

2. より安全な場所にインストール
   ```bash
   # ホームディレクトリにインストール
   mkdir -p ~/bin/UnityMCP
   # パッケージを移動後、設定ファイルのパスを更新
   ```

#### 4. スクリプトコンパイルエラー

**症状**: `manage_script` 実行時にコンパイルエラー

**解決方法**:
1. **構文確認**: C# コードの構文をチェック
2. **名前空間確認**: 必要な using 文が含まれているか
3. **Unity バージョン互換性**: Unity のバージョンと互換性があるか

**デバッグ例**:
```csharp
// エラー詳細の確認
var result = manage_script(
    action: "create",
    name: "TestScript", 
    path: "Assets/Scripts/",
    contents: "using UnityEngine; public class TestScript : MonoBehaviour { }",
    script_type: "MonoBehaviour",
    namespace: "Game"
);

// コンソールログでエラー詳細を確認
read_console(action: "get", types: ["error"], count: 10)
```

#### 5. GameObjectが見つからない

**症状**: `manage_gameobject` で対象オブジェクトが見つからない

**解決方法**:
1. **検索方法の確認**: `search_method` パラメータを適切に設定
   ```
   # 名前で検索
   manage_gameobject(action="find", target="Player", search_method="by_name")
   
   # 非アクティブオブジェクトも含めて検索
   manage_gameobject(action="find", target="Player", search_method="by_name", search_inactive=true)
   ```

2. **階層の確認**: シーン階層を取得して対象オブジェクトの存在を確認
   ```
   manage_scene(action="get_hierarchy")
   ```

### パフォーマンス最適化のヒント

#### 1. バッチ操作の活用
複数の操作は可能な限りまとめて実行：

```
# 非効率：個別に実行
manage_gameobject(action="create", name="Enemy1", ...)
manage_gameobject(action="create", name="Enemy2", ...)
manage_gameobject(action="create", name="Enemy3", ...)

# 効率的：一度に複数作成
manage_gameobject(action="create", name="EnemyPrefab", save_as_prefab=true, ...)
# その後プレハブから複数インスタンスを作成
```

#### 2. 適切な検索方法の選択
- `by_name`: 最も高速、名前が分かっている場合
- `by_id`: 高速、IDが分かっている場合
- `by_path`: 中速、階層パスが必要な場合

#### 3. コンソールログの制限
大量のログはパフォーマンスに影響：

```
# 必要最小限のログのみ取得
read_console(action="get", types=["error"], count=20)
```

### デバッグ方法

#### 1. 詳細ログの有効化
Python サーバーでデバッグログを有効に：

```python
# config.py を編集
LOG_LEVEL = "DEBUG"
```

#### 2. Unity側でのデバッグ
```csharp
// Unity Console でMCP Bridge の状態をログ出力
[MenuItem("Unity MCP/Debug/Print Status")]
static void PrintMCPStatus()
{
    Debug.Log($"MCP Bridge Connected: {UnityMcpBridge.IsConnected}");
    Debug.Log($"Active Commands: {UnityMcpBridge.GetRegisteredCommands().Count}");
    Debug.Log($"Port: {UnityMcpBridge.GetActivePort()}");
}
```

#### 3. ネットワーク接続の確認
```bash
# ポートの使用状況確認（Windows）
netstat -an | findstr :27182

# ポートの使用状況確認（macOS/Linux）
netstat -an | grep :27182
```

---

## 制限事項と注意点

### 技術的制限

#### 1. Unity バージョン
- **対応バージョン**: Unity 2020.3 LTS 以降
- **推奨バージョン**: Unity 2021.3 LTS 以降
- **制限**: 古いバージョンでは一部 API が利用できない場合があります

#### 2. プラットフォーム制限
- **対応OS**: Windows、macOS、Linux
- **制限**: 
  - Unity Cloud Build では利用不可
  - Unity Hub でのバッチモード実行では制限あり

#### 3. 同時接続制限
- **同時接続数**: 1つのUnityインスタンスにつき1つのMCPサーバー
- **マルチプロジェクト**: 異なるプロジェクトで同時利用する場合は異なるポートが必要

#### 4. メモリとパフォーマンス
- **大量データ転送**: Base64エンコーディングによりメモリ使用量が増加
- **同期処理**: すべての操作は同期的に実行されるため、重い処理では注意が必要

### セキュリティ考慮事項

#### 1. ローカル実行限定
- Unity MCP は**ローカル開発環境でのみ使用**してください
- 本番環境やクラウド環境での使用は推奨しません
- ネットワーク接続は localhost (127.0.0.1) に制限されています

#### 2. コード実行権限
```csharp
// manage_script で実行されるコードは完全なUnity API アクセス権限を持ちます
// 信頼できないコードは実行しないでください
```

#### 3. ファイルシステムアクセス
- スクリプトやアセットの作成時は適切なパス制限を確認
- プロジェクト外のファイルへのアクセスは制限されています

### ベストプラクティス

#### 1. エラーハンドリング
常にレスポンスの `success` フィールドを確認：

```javascript
const result = await manage_gameobject({
    action: "create",
    name: "Player"
});

if (!result.success) {
    console.error("GameObject creation failed:", result.message);
    // フォールバック処理
}
```

#### 2. リソース管理
- 大きなアセットやテクスチャの操作は分割して実行
- 不要なオブジェクトは適切にクリーンアップ
- メモリリークを避けるため定期的にシーンを保存

#### 3. バージョン管理との併用
```bash
# .gitignore に追加推奨
# Unity MCP 一時ファイル
UnityMcpServer/src/.venv/
UnityMcpServer/src/uv.lock
.unity-mcp-cache/
```

#### 4. チーム開発での注意
- MCP設定ファイルはプロジェクトに含めない
- チームメンバーそれぞれが個別に設定する
- カスタムハンドラーのコードは適切にバージョン管理

#### 5. 開発ワークフローの統合
```
推奨ワークフロー:
1. 設計・プロトタイピング（AI アシスタント + MCP）
2. 実装・リファクタリング（従来のIDE）  
3. テスト・デバッグ（AI アシスタント + MCP）
4. 最終調整・最適化（従来のIDE）
```

### サポートとコミュニティ

#### 公式リソース
- **GitHub リポジトリ**: [unity-mcp](https://github.com/justinpbarnett/unity-mcp)
- **Discord コミュニティ**: [Unity MCP Discord](https://discord.gg/vhTUxXaqYr)
- **イシュー報告**: GitHub Issues

#### よくある質問
**Q: 商用プロジェクトで利用できますか？**
A: MIT ライセンスのため商用利用可能ですが、開発環境でのみ使用することを推奨します。

**Q: Unity のバージョンアップ時の互換性は？**
A: メジャーバージョンアップ時は互換性を確認してからアップデートしてください。

**Q: カスタムハンドラーの配布方法は？**
A: Unity Package として配布するか、プロジェクトリポジトリに含めることを推奨します。

---

このガイドは Unity MCP の包括的な参照として、実際の開発現場での効率的な活用を支援することを目的としています。新しい機能や改善点については、公式リポジトリの最新情報を確認してください。

---

## 付録

### A. バージョン履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|----------|
| 1.0.0 | 2025-08-26 | 初版リリース - 包括的な機能参照ガイド |
| | | - クイックリファレンス追加 |
| | | - 逆引きリファレンス（目的別ガイド）追加 |
| | | - 緊急時トラブルシューティング追加 |

### B. 今後の予定

#### 予定されている機能追加
- **Unity 2023.x 対応**: 新しいUnity機能への対応
- **拡張エディターウィンドウ**: より直感的なGUI操作
- **バッチ処理機能**: 複数オブジェクトの一括操作
- **プロファイリング統合**: パフォーマンス測定機能

#### ドキュメント改善計画
- **動画チュートリアル**: 実践的な使用例のビデオガイド
- **API リファレンス**: より詳細な技術仕様
- **ベストプラクティス集**: 実際のプロジェクト事例

### C. コントリビューション

このドキュメントの改善にご協力いただける方は、以下の方法でご参加ください：

1. **フィードバック**: [GitHub Issues](https://github.com/justinpbarnett/unity-mcp/issues) でご報告
2. **ドキュメント改善**: プルリクエストをお送りください  
3. **使用例追加**: 実践的な例をシェア
4. **翻訳協力**: 多言語対応にご協力ください

### D. 謝辞

Unity MCPの開発・改善にご協力いただいた全ての方々に感謝いたします：
- コア開発チーム
- コミュニティコントリビューター
- フィードバックをお寄せいただいたユーザーの皆様

---

## ライセンスと免責事項

本ドキュメントは [MIT License](https://opensource.org/licenses/MIT) の下で公開されています。

**免責事項**: Unity MCPはサードパーティーツールです。Unity Technologies公式製品ではありません。使用に際しては十分な検証とバックアップをお願いいたします。

---

**このガイドは Unity MCP の包括的な参照として、実際の開発現場での効率的な活用を支援することを目的としています。**

**🔄 最新情報**: 新しい機能や改善点については、[公式リポジトリ](https://github.com/justinpbarnett/unity-mcp)の最新情報を定期的にご確認ください。

**📧 サポート**: ご質問は [Discord コミュニティ](https://discord.gg/vhTUxXaqYr) または GitHub Issues でお気軽にどうぞ。

---

*Unity MCP 機能参照ガイド v1.0.0 - 最終更新: 2025年8月26日*