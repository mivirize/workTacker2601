# Vercel環境変数設定ガイド

このドキュメントでは、LP-GeneratorプロジェクトをVercelにデプロイするための環境変数設定手順を説明します。

## 目次

1. [Vercelプロジェクト設定手順](#vercelプロジェクト設定手順)
2. [必要な環境変数一覧](#必要な環境変数一覧)
3. [Vercel Secretsの設定方法](#vercel-secretsの設定方法)
4. [デプロイ手順](#デプロイ手順)

---

## Vercelプロジェクト設定手順

### 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にログイン
2. 「Add New...」→「Project」を選択
3. GitリポジトリからLP-Generatorプロジェクトをインポート

### 2. プロジェクト設定

**Framework Preset**: Next.js

**Root Directory**: `apps/web`

**Build Command**: `npm run build`（または `pnpm run build`）

**Output Directory**: `.next`

---

## 必要な環境変数一覧

### Sanity関連

| 環境変数名 | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | SanityプロジェクトID | はい | `abc123xyz` |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanityデータセット名 | はい | `production` |
| `SANITY_API_TOKEN` | Sanity APIトークン | はい | `skABC123...` |

### NextAuth関連

| 環境変数名 | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `NEXTAUTH_SECRET` | NextAuth JWTシークレット | はい | `ランダムな文字列` |
| `NEXTAUTH_URL` | NextAuth URL | いいえ（Vercelで自動設定） | `https://your-app.vercel.app` |

### Webhook関連

| 環境変数名 | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `SANITY_WEBHOOK_SECRET` | Sanity Webhookシークレット | はい | `ランダムな文字列` |

### プレビュー関連

| 環境変数名 | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `SANITY_PREVIEW_SECRET` | Sanityプレビューシークレット | はい | `ランダムな文字列` |

---

## Vercel Secretsの設定方法

### 環境変数の追加

1. Vercelプロジェクトダッシュボードで「Settings」→「Environment Variables」を選択
2. 各環境変数を以下の手順で追加：

#### 1. Sanity関連の設定

**NEXT_PUBLIC_SANITY_PROJECT_ID**
- SanityダッシュボードからプロジェクトIDをコピー
- VercelのEnvironment Variablesに追加

**NEXT_PUBLIC_SANITY_DATASET**
- 通常は `production` を使用
- VercelのEnvironment Variablesに追加

**SANITY_API_TOKEN**
- SanityダッシュボードでAPIトークンを生成
- 「Manage Tokens」→「Add Token」
- 権限: `Editor` 以上
- 生成されたトークンをVercelのEnvironment Variablesに追加

#### 2. NextAuth関連の設定

**NEXTAUTH_SECRET**
- 以下のコマンドでシークレットを生成：

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

- 生成された値をVercelのEnvironment Variablesに追加

**NEXTAUTH_URL**
- Vercel環境では自動的に設定されます
- ローカル開発環境では `http://localhost:3000` を設定

#### 3. Webhook関連の設定

**SANITY_WEBHOOK_SECRET**
- ランダムな文字列を生成（上記と同様のコマンド）
- VercelのEnvironment Variablesに追加

#### 4. プレビュー関連の設定

**SANITY_PREVIEW_SECRET**
- ランダムな文字列を生成（上記と同様のコマンド）
- VercelのEnvironment Variablesに追加

### 環境ごとの設定

環境変数は以下の環境ごとに設定できます：

- **Production**: 本番環境
- **Preview**: プレビュー環境
- **Development**: 開発環境

通常、すべての環境で同じ値を設定します。

---

## デプロイ手順

### 初回デプロイ

1. すべての環境変数を設定した後、「Deploy」ボタンをクリック
2. デプロイが完了するまで待機（通常2-5分）
3. デプロイ完了後、生成されたURLでアプリケーションにアクセス

### Sanity Webhookの設定

1. Sanityダッシュボードで「API」→「Webhooks」を選択
2. 新しいWebhookを作成：
   - **URL**: `https://your-app.vercel.app/api/revalidate`
   - **Secret**: `SANITY_WEBHOOK_SECRET` で設定した値
   - **Projection**: `{ "slug": "string" }`

### ローカル開発環境の設定

1. `.env.local` ファイルを `.env.example` から作成：

```bash
cp apps/web/.env.example apps/web/.env.local
```

2. `.env.local` に各環境変数の値を入力

3. 開発サーバーを起動：

```bash
npm run dev
# または
pnpm dev
```

---

## トラブルシューティング

### デプロイエラー

**環境変数が設定されていない場合**
- すべての必須環境変数が設定されているか確認
- 環境変数のスペルミスがないか確認

**ビルドエラー**
- `package.json` のスクリプトが正しいか確認
- 依存関係が正しくインストールされているか確認

### NextAuth関連の問題

**認証が動作しない**
- `NEXTAUTH_SECRET` が正しく設定されているか確認
- `NEXTAUTH_URL` が正しく設定されているか確認
- `trustHost: true` が有効になっているか確認（[`auth.ts`](../apps/web/src/lib/auth.ts:29)）

### Sanity関連の問題

**コンテンツが表示されない**
- SanityプロジェクトIDとデータセット名が正しいか確認
- APIトークンに適切な権限があるか確認
- Webhookが正しく設定されているか確認

---

## 参考リンク

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Sanity API Tokens](https://www.sanity.io/docs/api-tokens)
- [Sanity Webhooks](https://www.sanity.io/docs/webhooks)
