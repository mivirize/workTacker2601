# LP-Editor

LP-CMSシステムのElectronエディタアプリ。クライアントがテキスト・画像・カラーを編集し、静的HTMLを出力できます。

## 概要

- **編集パネル**: テキスト、リッチテキスト、画像、リンク、カラーの編集
- **リアルタイムプレビュー**: 編集内容を即座にプレビュー
- **HTML出力**: マーカーを削除したクリーンなHTMLを出力

## 開発

### セットアップ

```bash
pnpm install
```

### 開発モード

```bash
pnpm dev
```

### ビルド

```bash
pnpm build
```

### パッケージ化

```bash
# Electron Forgeでパッケージ化
pnpm package

# インストーラー作成
pnpm make
```

## アーキテクチャ

```
src/
├── main/           # Electronメインプロセス
│   └── index.ts    # IPC通信、ファイルI/O
├── preload/        # プリロードスクリプト
│   └── index.ts    # セキュアなAPI公開
└── renderer/       # Reactレンダラー
    ├── App.tsx
    ├── components/
    │   ├── EditorPanel.tsx   # 編集パネル
    │   ├── PreviewPanel.tsx  # プレビュー
    │   └── Toolbar.tsx       # ツールバー
    ├── stores/
    │   └── editor-store.ts   # Zustand状態管理
    └── services/
        └── html-service.ts   # HTMLパース・変換
```

## 使用技術

- **Electron**: デスクトップアプリフレームワーク
- **electron-vite**: ビルドツール
- **React**: UIライブラリ
- **Zustand**: 状態管理
- **Tailwind CSS**: スタイリング
- **Cheerio**: HTMLパース

## クライアント向け機能

1. **テキスト編集**: 単一行・複数行テキストの編集
2. **画像差し替え**: ローカル画像ファイルの選択・差し替え
3. **カラー変更**: CSS変数によるカラーパレット変更
4. **プレビュー**: レスポンシブプレビュー（モバイル/タブレット/デスクトップ）
5. **HTML出力**: マーカーを削除したクリーンなHTML出力

## ライセンス

MIT
