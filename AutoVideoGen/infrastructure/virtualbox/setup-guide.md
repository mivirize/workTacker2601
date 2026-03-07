# AutoVideoGen VirtualBox セットアップガイド

Windows 11 Home では Hyper-V が使用できないため、VirtualBox を使用します。

## 1. VirtualBox インストール

### ダウンロード
https://www.virtualbox.org/wiki/Downloads

「Windows hosts」をクリックしてダウンロード、インストール。

## 2. ベースVM作成

### 2.1 新規VM作成
1. VirtualBoxを起動
2. 「新規」をクリック
3. 設定:
   - 名前: `AutoVideoGen-Base`
   - タイプ: Microsoft Windows
   - バージョン: Windows 11 (64-bit)
   - メモリ: 4096 MB
   - ハードディスク: 50GB (VDI、可変サイズ)

### 2.2 Windows 11 インストール
1. Windows 11 ISOをマウント
2. VMを起動してインストール
3. ローカルアカウントを作成

### 2.3 必要ソフトウェアインストール
VM内で以下を実行:

```powershell
# Chocolatey インストール
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# 必要ソフトウェア
choco install nodejs-lts python311 git -y
refreshenv

# Playwright
npm install -g playwright
npx playwright install chromium

# Python パッケージ
pip install pyautogui pygetwindow pyperclip pillow requests
```

### 2.4 Guest Additions インストール
1. メニュー: デバイス → Guest Additions CDイメージの挿入
2. CDドライブを開いてVBoxWindowsAdditions.exeを実行
3. 再起動

## 3. ワーカーVM作成（クローン）

### 3.1 ベースVMをシャットダウン

### 3.2 クローン作成
1. ベースVMを右クリック → クローン
2. 設定:
   - 名前: `AutoVideoGen-Worker-01`
   - MACアドレスポリシー: すべてのネットワークアダプターで新しいMACアドレスを生成
   - クローンの種類: リンクされたクローン（ストレージ節約）

3. Worker-02も同様に作成

## 4. ネットワーク設定

### 4.1 ホストオンリーアダプター作成
1. ファイル → ツール → ネットワークマネージャー
2. 「作成」をクリック
3. 設定:
   - IPv4アドレス: 10.0.0.1
   - IPv4ネットマスク: 255.255.255.0
   - DHCPサーバー: 有効
     - サーバーアドレス: 10.0.0.2
     - 下限アドレス: 10.0.0.11
     - 上限アドレス: 10.0.0.20

### 4.2 各VMのネットワーク設定
1. VMを選択 → 設定 → ネットワーク
2. アダプター1:
   - 有効化にチェック
   - 割り当て: ホストオンリーアダプター
   - 名前: VirtualBox Host-Only Ethernet Adapter

## 5. ワーカーエージェント設定

### 各VM内で実行:

```powershell
# ディレクトリ作成
mkdir C:\AutoVideoGen
mkdir C:\AutoVideoGen\output
mkdir C:\AutoVideoGen\chrome_profile

# 環境変数設定
[Environment]::SetEnvironmentVariable("ORCHESTRATOR_URL", "http://10.0.0.1:8000", "Machine")
[Environment]::SetEnvironmentVariable("OUTPUT_DIR", "C:\AutoVideoGen\output", "Machine")
```

### ホストからワーカーファイルをコピー:
共有フォルダまたはネットワーク経由で `worker/` フォルダをコピー

## 6. 動作確認

### ホスト側
```batch
cd C:\Users\owner\Dev\AutoVideoGen
python tools\status.py
```

### VM側
```batch
cd C:\AutoVideoGen\worker
python agent\main.py
```

## VirtualBox vs Hyper-V

| 項目 | VirtualBox | Hyper-V |
|------|------------|---------|
| 対応エディション | 全て | Pro以上 |
| パフォーマンス | 良好 | 最高 |
| クローン | リンククローン対応 | 差分ディスク対応 |
| 管理 | GUI中心 | PowerShell対応 |
