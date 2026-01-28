# LP-Packager CLI

LP-CMSシステムのパッケージングCLIツール。VSCode + Claude Codeで制作したLPをクライアント向けの編集可能パッケージにパッケージ化します。

## インストール

```bash
pnpm install
pnpm build
```

## 使い方

### 新規プロジェクト作成

```bash
# 基本テンプレート
lp-packager init my-client-lp

# フルテンプレート（特徴セクション、FAQ等を含む）
lp-packager init my-client-lp --template full
```

### マーカー検証

```bash
# 基本検証
lp-packager validate src/index.html

# 詳細出力
lp-packager validate src/index.html --verbose

# JSON出力
lp-packager validate src/index.html --format json
```

### マーカー一覧表示

```bash
# 編集可能マーカーの一覧
lp-packager list-markers src/index.html

# カラー変数の一覧
lp-packager list-colors src/index.html
```

### パッケージ化

```bash
# 基本ビルド
lp-packager build

# オプション指定
lp-packager build --client "クライアント名" --output ./dist
```

## マーカー仕様

詳細は [docs/lp-cms/marker-spec.md](../../docs/lp-cms/marker-spec.md) を参照。

### 基本マーカー

```html
<!-- テキスト -->
<h1 data-editable="headline" data-type="text">キャッチコピー</h1>

<!-- 画像 -->
<img data-editable="hero-image" data-type="image" src="images/hero.jpg">

<!-- リンク -->
<a data-editable="cta-button" data-type="link" href="#">申し込む</a>
```

### カラー設定

```css
:root {
  --color-primary: #3B82F6;
  --color-secondary: #1E40AF;
  --color-accent: #F59E0B;
}
```

## 開発

```bash
# 開発モード（ウォッチ）
pnpm dev

# テスト
pnpm test

# カバレッジ付きテスト
pnpm test:coverage

# 型チェック
pnpm typecheck

# リント
pnpm lint
```

## ライセンス

MIT
