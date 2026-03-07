# AutoVideoGen 並列実行システム セットアップガイド

## 概要

AutoVideoGenを複数のHyper-V仮想マシンで並列実行するシステムです。

```
┌─────────────────────────────────────────────────────┐
│              ホストマシン（親機）                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Orchestrator API (FastAPI)                  │  │
│  │  http://localhost:8000                       │  │
│  │  - タスク割り当て（排他ロック）               │  │
│  │  - 進捗監視・ログ収集                        │  │
│  │  - SQLite-WAL DB                            │  │
│  └──────────────────────────────────────────────┘  │
│              │ Internal Switch (10.0.0.0/24)       │
│    ┌─────────┴─────────┐                          │
│    ▼                   ▼                          │
│ ┌──────────────┐  ┌──────────────┐                │
│ │ Worker-VM-01 │  │ Worker-VM-02 │                │
│ │  10.0.0.11   │  │  10.0.0.12   │                │
│ └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

## 必要要件

### ホストマシン
- Windows 10/11 Pro以上（Hyper-V対応）
- RAM: 16GB以上（ホスト8GB + VM 2台×4GB）
- CPU: 4コア以上
- SSD: 100GB以上の空き容量
- Python 3.10以上

---

## Phase 1: オーケストレーター（即時実行可能）

### 1.1 オーケストレーター起動

```batch
cd C:\Users\owner\Dev\AutoVideoGen
start-orchestrator.bat
```

または手動で:

```batch
cd C:\Users\owner\Dev\AutoVideoGen
python orchestrator\migrate_db.py
python -m uvicorn orchestrator.api.main:app --host 0.0.0.0 --port 8000
```

### 1.2 動作確認

ブラウザで開く: http://localhost:8000/api/v1/health

またはコマンドラインで:

```batch
curl http://localhost:8000/api/v1/stats
```

### 1.3 運用ツール

```batch
:: システム状態確認
python tools\status.py

:: タスク追加
python tools\add_task.py --title "動画タイトル" --script "台本内容"

:: サンプルタスク追加
python tools\add_task.py --file tools\sample_tasks.json
```

---

## Phase 2: Hyper-V環境構築（管理者権限必要）

### 2.1 Hyper-V有効化

1. 「Windowsの機能の有効化または無効化」を開く
2. 「Hyper-V」にチェックを入れる
3. PCを再起動

または管理者PowerShellで:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

### 2.2 ネットワーク設定

管理者PowerShellで:

```powershell
cd C:\Users\owner\Dev\AutoVideoGen\infrastructure\hyper-v
.\network-setup.ps1
```

これにより:
- 仮想スイッチ「AutoVideoGen-Net」が作成される
- ホストIPが10.0.0.1に設定される

### 2.3 ベースVMテンプレート作成

詳細手順は `infrastructure\hyper-v\create-base-vm.ps1` を参照

要約:
1. Windows 11をインストールした新規VMを作成
2. 必要ソフトウェアをインストール:
   - Node.js (LTS)
   - Python 3.11+
   - Playwright + Chrome
   - PyAutoGUI
3. Sysprepで汎用化（オプション）
4. VHDXを読み取り専用に設定

### 2.4 ワーカーVM作成

管理者PowerShellで:

```powershell
cd C:\Users\owner\Dev\AutoVideoGen\infrastructure\hyper-v
.\create-worker-vm.ps1 -ParentVHDX "C:\VMs\Base-Template.vhdx" -WorkerCount 2
```

### 2.5 ワーカーVM設定

各VMで:

1. 静的IPを設定:
   - Worker-01: 10.0.0.11
   - Worker-02: 10.0.0.12
   - サブネット: 255.255.255.0
   - ゲートウェイ: 10.0.0.1

2. ワーカーエージェントをインストール:

```powershell
# ホストからファイルをコピー後、VM内で実行
cd C:\AutoVideoGen\worker
.\install.ps1 -OrchestratorIP "10.0.0.1"
```

### 2.6 VM管理

```powershell
# 全ワーカー起動
.\manage-workers.ps1 -Action start

# 全ワーカー停止
.\manage-workers.ps1 -Action stop

# 状態確認
.\manage-workers.ps1 -Action status

# チェックポイント作成
.\manage-workers.ps1 -Action checkpoint
```

---

## API リファレンス

### タスク管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/v1/health` | ヘルスチェック |
| GET | `/api/v1/stats` | タスク統計 |
| GET | `/api/v1/tasks` | タスク一覧 |
| POST | `/api/v1/tasks/acquire` | タスク取得（ワーカー用） |
| PUT | `/api/v1/tasks/{id}/complete` | 完了報告 |
| PUT | `/api/v1/tasks/{id}/fail` | 失敗報告 |

### ワーカー管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/v1/workers` | ワーカー一覧 |
| POST | `/api/v1/workers/register` | ワーカー登録 |
| POST | `/api/v1/workers/{id}/heartbeat` | ハートビート |

---

## トラブルシューティング

### オーケストレーターが起動しない

```batch
:: 依存関係を再インストール
pip install -r orchestrator\requirements.txt

:: DBマイグレーションを再実行
python orchestrator\migrate_db.py
```

### ワーカーがタスクを取得できない

1. オーケストレーターが起動しているか確認
2. ネットワーク接続を確認: `ping 10.0.0.1`
3. ファイアウォール設定を確認（ポート8000）

### VMが起動しない

```powershell
# VMの状態を確認
Get-VM | Select Name, State

# 強制停止して再起動
Stop-VM -Name "AutoVideoGen-Worker-01" -Force
Start-VM -Name "AutoVideoGen-Worker-01"
```

---

## ディレクトリ構成

```
AutoVideoGen/
├── orchestrator/           # オーケストレーター
│   ├── api/               # FastAPI
│   ├── core/              # 設定・DB
│   ├── models/            # データモデル
│   └── services/          # ビジネスロジック
├── worker/                # ワーカーエージェント
│   ├── agent/             # メインループ
│   ├── automation/        # Vrew自動化
│   └── config/            # 設定
├── infrastructure/        # インフラスクリプト
│   └── hyper-v/
├── tools/                 # 運用ツール
│   ├── add_task.py
│   ├── status.py
│   └── sample_tasks.json
├── output/                # 出力動画
├── database.db            # SQLite DB
└── start-orchestrator.bat # 起動スクリプト
```

---

## 次のステップ

1. オーケストレーターを起動して動作確認
2. Hyper-V環境を構築（管理者権限で）
3. ベースVMテンプレートを作成
4. ワーカーVMを作成・設定
5. 並列処理テスト実行
