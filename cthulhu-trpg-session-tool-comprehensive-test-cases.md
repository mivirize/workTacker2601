# クトゥルフ神話TRPGセッションツール - 包括的テストケース仕様書

## 概要

このドキュメントでは、Phase 3で作成された15のUser Stories（US-001～015）を基に、包括的なテストケースを定義します。各テストケースは実際のユーザーシナリオに基づき、正常系・異常系・境界値テストを網羅します。

## 目次

1. [テスト戦略](#テスト戦略)
2. [テストレベル別分類](#テストレベル別分類)
3. [技術要件別テスト戦略](#技術要件別テスト戦略)
4. [User Story別テストケース](#user-story別テストケース)
5. [テストデータ・環境設定](#テストデータ・環境設定)
6. [自動テスト実行環境](#自動テスト実行環境)

---

## テスト戦略

### テストピラミッド

```
    /\
   /  \     E2E Tests (少数・高価値)
  /____\    - 主要ユーザーシナリオ
 /      \   - クリティカルパス
/________\  
           Integration Tests (中程度)
          - API統合テスト
         - コンポーネント統合テスト
        
        Unit Tests (多数・高速)
       - 個別関数・コンポーネント
      - ビジネスロジック単体
```

### テスト品質目標

- **Unit Test Coverage**: 80%以上
- **Integration Test Coverage**: 主要API・機能100%
- **E2E Test Coverage**: クリティカルユーザーストーリー100%
- **Performance Test**: レスポンス時間・負荷テスト

---

## テストレベル別分類

### Unit Tests
- **対象**: 個別関数、ユーティリティ、コンポーネント
- **ツール**: Jest + React Testing Library
- **実行頻度**: 全コミット時

### Integration Tests
- **対象**: API統合、データベース連携、コンポーネント間連携
- **ツール**: Jest + テストDB
- **実行頻度**: PR作成時・マージ時

### E2E Tests
- **対象**: ユーザーシナリオ、クリティカルパス
- **ツール**: Playwright
- **実行頻度**: デプロイ前・定期実行

### Performance Tests
- **対象**: レスポンス時間、負荷テスト
- **ツール**: k6、Artillery
- **実行頻度**: リリース前・定期実行

---

## 技術要件別テスト戦略

### Socket.ioリアルタイム通信テスト
```typescript
// リアルタイム通信のテストアプローチ
- WebSocket接続・切断テスト
- メッセージ送受信テスト
- 複数ユーザー同期テスト
- ネットワーク断絶時の再接続テスト
```

### OpenAI API統合テスト
```typescript
// AI機能のテストアプローチ
- APIモックを使用した単体テスト
- レート制限テスト
- エラーハンドリングテスト
- フォールバック機能テスト
```

### Prisma ORMデータベーステスト
```typescript
// データベース操作のテストアプローチ
- テスト用SQLiteDBを使用
- トランザクション処理テスト
- データ整合性テスト
- パフォーマンステスト
```

### NextAuth.js認証フローテスト
```typescript
// 認証システムのテストアプローチ
- Google OAuth フローテスト（モック）
- セッション管理テスト
- 認可・権限チェックテスト
- セキュリティテスト
```

---

## User Story別テストケース

### US-001: ユーザー認証システム

#### TC-001-001: Google OAuth 正常ログイン
- **Test ID**: TC-001-001
- **Test Name**: Google OAuth による正常ログイン
- **User Story**: US-001
- **Test Type**: E2E
- **Priority**: High
- **Preconditions**: 
  - ユーザーは未ログイン状態
  - Google OAuth設定が正常
- **Test Steps**:
  1. ホームページにアクセス
  2. 「ログイン」ボタンをクリック
  3. 「Googleでログイン」ボタンをクリック
  4. Google認証画面で有効な資格情報を入力
  5. 認証許可を承認
- **Expected Result**:
  - ダッシュボードにリダイレクトされる
  - ユーザー名が画面に表示される
  - セッションが保存される

#### TC-001-002: ログイン状態の永続化
- **Test ID**: TC-001-002
- **Test Name**: ログイン状態の永続化検証
- **User Story**: US-001
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: ユーザーがログイン済み
- **Test Steps**:
  1. ブラウザを閉じる
  2. ブラウザを再起動
  3. サイトにアクセス
- **Expected Result**:
  - 自動的にログイン状態が復元される
  - 再度ログインを求められない

#### TC-001-003: 認証エラーハンドリング
- **Test ID**: TC-001-003
- **Test Name**: Google OAuth認証エラーの処理
- **User Story**: US-001
- **Test Type**: E2E
- **Priority**: Medium
- **Preconditions**: OAuth設定が正常
- **Test Steps**:
  1. ログイン画面にアクセス
  2. 「Googleでログイン」をクリック
  3. 認証をキャンセルまたは拒否
- **Expected Result**:
  - 適切なエラーメッセージが表示される
  - ログイン画面に戻る
  - システムが正常動作を継続する

---

### US-002: キャラクターシート管理機能

#### TC-002-001: キャラクター作成（正常系）
- **Test ID**: TC-002-001
- **Test Name**: 基本情報でのキャラクター作成
- **User Story**: US-002
- **Test Type**: E2E
- **Priority**: High
- **Preconditions**: ユーザーがログイン済み
- **Test Steps**:
  1. ダッシュボードから「キャラクター作成」をクリック
  2. キャラクター名「テスト探偵」を入力
  3. ルールバージョン「7版」を選択
  4. 基本能力値を入力（STR:60, CON:50, etc.）
  5. 職業「私立探偵」を入力
  6. 「作成」ボタンをクリック
- **Expected Result**:
  - キャラクターが正常に作成される
  - キャラクター一覧に表示される
  - 派生能力値が自動計算される
  - 成功メッセージが表示される

#### TC-002-002: キャラクター上限制限（無料ユーザー）
- **Test ID**: TC-002-002
- **Test Name**: 無料ユーザーのキャラクター作成上限
- **User Story**: US-002
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - 無料ユーザーがログイン済み
  - 既に2体のキャラクターが作成済み
- **Test Steps**:
  1. 3体目のキャラクター作成を試行
  2. 必要な情報を入力
  3. 「作成」ボタンをクリック
- **Expected Result**:
  - 制限エラーメッセージが表示される
  - 有料プランへのアップグレード案内が表示される
  - キャラクターは作成されない

#### TC-002-003: キャラクター共有機能
- **Test ID**: TC-002-003
- **Test Name**: キャラクターの共有URL生成と閲覧
- **User Story**: US-002
- **Test Type**: E2E
- **Priority**: Medium
- **Preconditions**: キャラクターが作成済み
- **Test Steps**:
  1. キャラクター詳細画面を開く
  2. 「共有URL生成」をクリック
  3. 生成されたURLをコピー
  4. 新しいブラウザタブでURLにアクセス
- **Expected Result**:
  - 共有URLが生成される
  - URLアクセスでキャラクター情報が表示される
  - 編集権限はない（読み取り専用）

#### TC-002-004: ルールバージョン切り替え
- **Test ID**: TC-002-004
- **Test Name**: 6版と7版の切り替え動作
- **User Story**: US-002
- **Test Type**: Unit
- **Priority**: Medium
- **Preconditions**: キャラクター作成画面が表示中
- **Test Steps**:
  1. ルールバージョンを「6版」に設定
  2. 能力値を入力
  3. ルールバージョンを「7版」に変更
- **Expected Result**:
  - 能力値の計算式が切り替わる
  - 派生能力値が再計算される
  - スキル一覧が更新される

---

### US-003: ダイス機能

#### TC-003-001: 基本的なダイスロール
- **Test ID**: TC-003-001
- **Test Name**: 1D100ダイスロールの実行
- **User Story**: US-003
- **Test Type**: Unit
- **Priority**: High
- **Preconditions**: ダイスローラーが初期化済み
- **Test Steps**:
  1. ダイスロールボタンをクリック
  2. 結果を確認
- **Expected Result**:
  - 1-100の範囲内で結果が表示される
  - 成功/失敗判定が表示される
  - 結果がセッションログに記録される

#### TC-003-002: スキル判定ダイスロール
- **Test ID**: TC-003-002
- **Test Name**: スキル値に対する成功判定
- **User Story**: US-003
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - キャラクターが選択済み
  - スキル「聞き耳：65」が設定済み
- **Test Steps**:
  1. スキル「聞き耳」を選択
  2. ダイスロールを実行
  3. 結果を確認
- **Expected Result**:
  - ダイス結果が表示される
  - スキル値65との比較結果が表示される
  - 成功時は緑、失敗時は赤で表示される

#### TC-003-003: クリティカル・ファンブル判定
- **Test ID**: TC-003-003
- **Test Name**: 特殊成功・特殊失敗の判定
- **User Story**: US-003
- **Test Type**: Unit
- **Priority**: Medium
- **Preconditions**: ダイス機能が利用可能
- **Test Steps**:
  1. 多数回ダイスロールを実行（自動化）
  2. 結果01および96-00の出現を確認
- **Expected Result**:
  - 01でクリティカル成功の特殊エフェクトが表示
  - 96-00でファンブルの特殊エフェクトが表示
  - 通常とは異なる視覚効果が提供される

#### TC-003-004: ダイス履歴管理
- **Test ID**: TC-003-004
- **Test Name**: ダイスロール履歴の記録と表示
- **User Story**: US-003
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: セッションが開始済み
- **Test Steps**:
  1. 複数回異なるダイスロールを実行
  2. ダイス履歴パネルを確認
- **Expected Result**:
  - 全てのダイス結果が時系列で記録される
  - ロール理由とキャラクター名が記録される
  - 履歴の検索・フィルタが機能する

---

### US-004: AI描写補助機能

#### TC-004-001: 基本的な情景描写生成
- **Test ID**: TC-004-001
- **Test Name**: キーワードからの情景描写生成
- **User Story**: US-004
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - 有料ユーザーがログイン済み
  - AI機能が利用可能
- **Test Steps**:
  1. AI描写補助機能を開く
  2. キーワード「古い洋館、霧、月明かり」を入力
  3. 「生成」ボタンをクリック
- **Expected Result**:
  - 5-10秒以内に描写文が生成される
  - 雰囲気に合った文章が出力される
  - 「チャットに貼り付け」ボタンが表示される

#### TC-004-002: 再生成機能
- **Test ID**: TC-004-002
- **Test Name**: 描写の再生成機能
- **User Story**: US-004
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 描写が生成済み
- **Test Steps**:
  1. 生成された描写の「再生成」ボタンをクリック
  2. 新しい描写を確認
- **Expected Result**:
  - 同じキーワードで異なる描写が生成される
  - 生成時間は初回と同程度
  - 品質が維持される

#### TC-004-003: 利用回数制限（無料ユーザー）
- **Test ID**: TC-004-003
- **Test Name**: 無料ユーザーのAI機能利用制限
- **User Story**: US-004
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - 無料ユーザーがログイン済み
  - 当月の利用回数が上限に到達
- **Test Steps**:
  1. AI描写補助機能を使用しようとする
  2. キーワードを入力し「生成」をクリック
- **Expected Result**:
  - 利用制限エラーメッセージが表示される
  - 有料プラン案内が表示される
  - 機能は実行されない

#### TC-004-004: AI API エラーハンドリング
- **Test ID**: TC-004-004
- **Test Name**: OpenAI API障害時の対応
- **User Story**: US-004
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: AI APIが一時的に利用不可
- **Test Steps**:
  1. 描写生成を試行
  2. APIエラーレスポンスを確認
- **Expected Result**:
  - 「一時的に利用できません」メッセージが表示
  - 手動入力の代替案が提示される
  - システムが異常終了しない

---

### US-005: AIロールプレイ提案機能

#### TC-005-001: 基本的なロールプレイ提案
- **Test ID**: TC-005-001
- **Test Name**: 状況に応じたロールプレイ提案生成
- **User Story**: US-005
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - キャラクター情報が設定済み
  - セッション中
- **Test Steps**:
  1. 状況「SANチェック失敗、軽度の狂気」を入力
  2. AI提案機能を実行
- **Expected Result**:
  - 3-5個の具体的な行動提案が生成される
  - キャラクターの性格に合った提案である
  - 選択可能な形式で表示される

#### TC-005-002: 自動提案トリガー
- **Test ID**: TC-005-002
- **Test Name**: SANチェック失敗時の自動提案
- **User Story**: US-005
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 
  - セッション中にキャラクターが参加
  - AI機能が有効
- **Test Steps**:
  1. SANチェックでファンブル（96-00）を記録
  2. システムの自動反応を確認
- **Expected Result**:
  - 自動的にロールプレイ提案が表示される
  - 狂気状態に適した提案内容である
  - 手動で提案を無視することも可能

#### TC-005-003: キャラクター性格反映
- **Test ID**: TC-005-003
- **Test Name**: キャラクター設定に基づく提案カスタマイズ
- **User Story**: US-005
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 
  - 性格「冷静で論理的」のキャラクター
  - 性格「熱血で直情的」のキャラクター
- **Test Steps**:
  1. 同じ状況で両キャラクターの提案を生成
  2. 提案内容を比較
- **Expected Result**:
  - 性格に応じて異なる行動提案が生成される
  - 「冷静」キャラ: 分析的・慎重な提案
  - 「熱血」キャラ: 行動的・直接的な提案

---

### US-006: セッションログ保存機能

#### TC-006-001: 自動ログ記録
- **Test ID**: TC-006-001
- **Test Name**: セッション中のチャット・行動の自動記録
- **User Story**: US-006
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: セッションが開始済み
- **Test Steps**:
  1. チャットメッセージを送信
  2. ダイスロールを実行
  3. AI機能を使用
  4. セッション終了
  5. ログ内容を確認
- **Expected Result**:
  - 全てのアクションが時系列で記録される
  - 発言者・キャラクター情報が記録される
  - ダイス結果・AI生成内容が記録される

#### TC-006-002: プライバシー設定
- **Test ID**: TC-006-002
- **Test Name**: ログの公開範囲設定
- **User Story**: US-006
- **Test Type**: E2E
- **Priority**: High
- **Preconditions**: セッションログが存在
- **Test Steps**:
  1. ログ詳細画面を開く
  2. プライバシー設定を「友人限定」に変更
  3. 共有URLを生成
  4. 別ユーザーでアクセスを試行
- **Expected Result**:
  - 設定が正しく保存される
  - 権限のないユーザーはアクセス不可
  - 適切なエラーメッセージが表示される

#### TC-006-003: ログ検索・フィルタ機能
- **Test ID**: TC-006-003
- **Test Name**: セッションログの検索とフィルタリング
- **User Story**: US-006
- **Test Type**: E2E
- **Priority**: Medium
- **Preconditions**: 複数のセッションログが存在
- **Test Steps**:
  1. ログ一覧画面を開く
  2. 検索窓に「洋館」と入力
  3. フィルタを「ダイスロール」に設定
- **Expected Result**:
  - 「洋館」を含むログのみ表示される
  - ダイスロール部分のみハイライト表示される
  - 検索結果数が表示される

#### TC-006-004: ログエクスポート機能
- **Test ID**: TC-006-004
- **Test Name**: セッションログのエクスポート
- **User Story**: US-006
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: エクスポート対象のログが存在
- **Test Steps**:
  1. ログ詳細画面で「エクスポート」をクリック
  2. JSON形式を選択
  3. ダウンロードを実行
- **Expected Result**:
  - ファイルが正常にダウンロードされる
  - 構造化されたJSONデータが出力される
  - 文字化けなしで内容が確認できる

---

### US-007: AIあらすじ生成機能

#### TC-007-001: 基本的なあらすじ生成
- **Test ID**: TC-007-001
- **Test Name**: セッションログからのあらすじ生成
- **User Story**: US-007
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - 完了したセッションログが存在
  - 有料ユーザーがアクセス
- **Test Steps**:
  1. セッションログ詳細画面を開く
  2. 「AIあらすじ生成」ボタンをクリック
  3. 生成結果を確認
- **Expected Result**:
  - 200-300文字程度のあらすじが生成される
  - 主要な出来事が要約されている
  - 読みやすい形式で出力される

#### TC-007-002: SNS投稿用フォーマット
- **Test ID**: TC-007-002
- **Test Name**: Twitter投稿用フォーマットの生成
- **User Story**: US-007
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: あらすじが生成済み
- **Test Steps**:
  1. 「Twitter投稿用」オプションを選択
  2. フォーマット変換を実行
- **Expected Result**:
  - 280文字以内に調整される
  - ハッシュタグが適切に挿入される
  - 投稿用の装飾が付加される

#### TC-007-003: 複数セッション対応
- **Test ID**: TC-007-003
- **Test Name**: 連続セッションのあらすじ統合
- **User Story**: US-007
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 
  - 同じシナリオで複数セッションが完了
  - 各セッションにログが存在
- **Test Steps**:
  1. 複数セッションを選択
  2. 統合あらすじ生成を実行
- **Expected Result**:
  - 全セッションの流れが統合される
  - 時系列順に整理される
  - 一貫性のあるストーリーが生成される

---

### US-008: AI小説生成機能

#### TC-008-001: 基本的な小説生成
- **Test ID**: TC-008-001
- **Test Name**: セッションログから小説形式への変換
- **User Story**: US-008
- **Test Type**: Integration
- **Priority**: High
- **Preconditions**: 
  - 長時間セッションのログが存在
  - 有料ユーザーがアクセス
- **Test Steps**:
  1. 対象セッションログを選択
  2. 「AI小説生成」機能を実行
  3. 生成進行状況を確認
  4. 完成した小説を確認
- **Expected Result**:
  - チャットが自然な会話に変換される
  - ダイスロールが描写に変換される
  - 章立てされた構成で出力される
  - 生成時間5-10分以内で完了

#### TC-008-002: 挿絵自動生成・配置
- **Test ID**: TC-008-002
- **Test Name**: Stable Diffusionによる挿絵生成
- **User Story**: US-008
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 小説生成が完了済み
- **Test Steps**:
  1. 「挿絵生成」オプションを有効化
  2. 小説生成を実行
  3. 挿絵の配置を確認
- **Expected Result**:
  - 各章に適切な挿絵が配置される
  - 画像が文章内容と一致している
  - 画像読み込みが正常に完了する

#### TC-008-003: PDF/EPUBエクスポート
- **Test ID**: TC-008-003
- **Test Name**: 小説の電子書籍形式エクスポート
- **User Story**: US-008
- **Test Type**: Integration
- **Priority**: Medium
- **Preconditions**: 小説が生成済み
- **Test Steps**:
  1. エクスポート形式「PDF」を選択
  2. ダウンロードを実行
  3. 生成されたPDFを確認
  4. 同様にEPUB形式でテスト
- **Expected Result**:
  - PDF: 美しいレイアウトで出力
  - EPUB: 電子書籍リーダーで読める
  - 挿絵が正しく埋め込まれている
  - 文字化けが発生しない

---

## テストデータ・環境設定

### テスト環境構成

```yaml
# テスト環境設定
TEST_ENVIRONMENTS:
  unit:
    - Node.js v18+
    - Jest 29+
    - React Testing Library
    - テスト用SQLite DB
    
  integration:
    - Next.js開発サーバー
    - テスト用PostgreSQL
    - Redis (テスト用インスタンス)
    - OpenAI APIモック
    
  e2e:
    - Playwright
    - 複数ブラウザ (Chrome, Firefox, Safari)
    - モバイルエミュレーション
    - 本番環境模擬設定
    
  performance:
    - k6
    - 複数同時接続シミュレーション
    - レスポンス時間測定
    - 負荷テストシナリオ
```

### テストデータ設計

#### ユーザーテストデータ
```typescript
const testUsers = {
  freeUser: {
    id: 'test-free-001',
    email: 'free@test.com',
    subscriptionTier: 'free'
  },
  premiumUser: {
    id: 'test-premium-001', 
    email: 'premium@test.com',
    subscriptionTier: 'premium'
  },
  kpUser: {
    id: 'test-kp-001',
    email: 'kp@test.com',
    role: 'keeper'
  }
};
```

#### キャラクターテストデータ
```typescript
const testCharacters = {
  detective: {
    name: 'テスト探偵',
    ruleVersion: '7th',
    stats: { str: 60, con: 50, pow: 80, dex: 45, app: 55, siz: 65, int: 75, edu: 70 },
    skills: { '聞き耳': 65, '図書館': 80, '目星': 60 },
    occupation: '私立探偵'
  },
  doctor: {
    name: 'テスト医師', 
    ruleVersion: '7th',
    stats: { str: 45, con: 60, pow: 70, dex: 50, app: 60, siz: 55, int: 85, edu: 90 },
    skills: { '医学': 85, '精神分析': 60, '薬学': 50 },
    occupation: '医師'
  }
};
```

### モックサービス設定

#### OpenAI APIモック
```typescript
// AI機能のモック応答
export const mockAIResponses = {
  description: '霧に包まれた古い洋館が、月明かりの下で不気味にそびえ立っている...',
  roleplayOptions: [
    '周囲を警戒しながら慎重に歩く',
    '仲間に状況を報告する',
    '一旦安全な場所に退避する'
  ],
  synopsis: 'プレイヤーたちは霧深い街で奇怪な事件に巻き込まれ、真実を探求した。'
};
```

---

## 自動テスト実行環境

### CI/CDパイプライン設計

```yaml
# .github/workflows/test.yml
name: Comprehensive Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Setup test environment
        run: |
          npm ci
          npm run db:migrate
          npm run db:seed
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
      - name: Run performance tests
        run: |
          npm run dev &
          sleep 30
          ./k6 run scripts/performance-test.js
```

### テスト実行スクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch", 
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run scripts/performance-test.js",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:all": "npm run test:ci && npm run test:performance"
  }
}
```

### パフォーマンステストシナリオ

```javascript
// scripts/performance-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // 10ユーザーまで増加
    { duration: '5m', target: 10 }, // 10ユーザーで維持
    { duration: '2m', target: 20 }, // 20ユーザーまで増加
    { duration: '5m', target: 20 }, // 20ユーザーで維持
    { duration: '2m', target: 0 },  // 0まで減少
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%のリクエストが500ms以下
    http_req_failed: ['rate<0.1'],    // エラー率10%未満
  },
};

export default function () {
  // ホームページアクセス
  let response = http.get('http://localhost:3000');
  check(response, {
    'ホームページが200で応答': (r) => r.status === 200,
    'レスポンス時間が3秒以下': (r) => r.timings.duration < 3000,
  });

  sleep(1);

  // API エンドポイントテスト
  response = http.get('http://localhost:3000/api/health');
  check(response, {
    'Health APIが200で応答': (r) => r.status === 200,
    'APIレスポンス時間が500ms以下': (r) => r.timings.duration < 500,
  });

  sleep(2);
}
```

---

## まとめ

この包括的テストケース仕様書では、15のUser Storiesに対応する主要なテストケースを定義しました。

### 主要なテスト観点
1. **機能テスト**: 全User Storiesの受入条件を満たす
2. **品質テスト**: パフォーマンス・セキュリティ・可用性
3. **ユーザビリティテスト**: 実際のユーザー体験に基づく
4. **技術テスト**: AI統合・リアルタイム通信・データベース

### 実装優先度
- **High**: 認証、キャラクター管理、ダイス機能、リアルタイム通信
- **Medium**: AI機能、セッションログ、プロフィール管理
- **Low**: 管理機能、高度なカスタマイズ機能

このテストケースは、Phase 5の実装作業と並行して実行され、高品質なクトゥルフ神話TRPGセッションツールの開発を支援します。各テストケースは継続的に更新され、新機能追加や変更に応じて拡張されます。