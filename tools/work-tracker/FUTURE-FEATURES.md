# Work Tracker 将来機能計画

## 現状分析

### 実装済み機能 ✅

| カテゴリ | 機能 | 状態 |
|---------|------|------|
| トラッキング | 自動ウィンドウ追跡 | ✅ |
| トラッキング | アイドル検出 | ✅ |
| トラッキング | 手動アクティビティ入力 | ✅ |
| 分類 | カテゴリ (自動分類ルール) | ✅ |
| 分類 | タグ (複数選択、自動適用) | ✅ |
| 分析 | 日次/週次/月次サマリー | ✅ |
| 分析 | タイムラインビュー | ✅ |
| 分析 | カレンダービュー | ✅ |
| 分析 | レポート (カテゴリ/アプリ別) | ✅ |
| 目標 | 日次/週次/カテゴリ別目標 | ✅ |
| データ | CSV/JSONエクスポート | ✅ |
| データ | 検索/フィルター | ✅ |
| システム | システムトレイ | ✅ |
| システム | 通知 (アイドル検出) | ✅ |
| 設定 | 除外アプリ、保持期間等 | ✅ |

---

## 未実装機能の優先度分析

### フェーズ8: 生産性分析強化 (高優先度)

#### 8.1 生産性スコア
**概要**: カテゴリの生産性レベルに基づいて日次/週次の生産性スコアを計算・表示

**詳細**:
- カテゴリに「生産性レベル」属性を追加 (0-100%)
  - 開発: 100% (生産的)
  - コミュニケーション: 70%
  - ミーティング: 80%
  - ブラウジング: 30%
  - その他: 50%
- 日次スコア = Σ(カテゴリ時間 × 生産性レベル) / 総時間
- ダッシュボードにスコア表示 (円形プログレス)
- 週次トレンドグラフ

**変更ファイル**:
- `src/shared/types.ts` - Category.productivityLevel追加
- `src/main/database/repositories/statistics-repository.ts` - スコア計算
- `src/renderer/pages/Dashboard.tsx` - スコア表示UI
- `src/renderer/components/charts/ProductivityGauge.tsx` - 新規

**工数**: 中 (1-2日)

---

#### 8.2 期間比較レポート
**概要**: 今週 vs 先週、今月 vs 先月の比較分析

**詳細**:
- 2つの期間を選択して比較
- 差分表示 (時間、カテゴリ分布、生産性スコア)
- 増減の視覚的インジケータ (↑↓)
- グラフでの重ね合わせ表示

**変更ファイル**:
- `src/renderer/pages/Reports.tsx` - 比較モード追加
- `src/renderer/components/charts/ComparisonChart.tsx` - 新規
- `src/main/database/repositories/statistics-repository.ts` - 比較データ取得

**工数**: 中 (1-2日)

---

#### 8.3 ヒートマップビュー
**概要**: 時間帯×曜日の活動量をヒートマップで可視化

**詳細**:
- 横軸: 時間帯 (0-23時)
- 縦軸: 曜日 (月-日)
- 色: 活動量 (淡→濃)
- ホバーで詳細表示
- カテゴリフィルター対応

**変更ファイル**:
- `src/renderer/pages/Reports.tsx` - ヒートマップタブ追加
- `src/renderer/components/charts/ActivityHeatmap.tsx` - 新規
- `src/main/database/repositories/statistics-repository.ts` - 時間帯別集計

**工数**: 中 (1-2日)

---

### フェーズ9: UX改善 (高優先度)

#### 9.1 ダークモード
**概要**: UIテーマの切り替え (ライト/ダーク/システム連動)

**詳細**:
- Tailwind CSS dark: プレフィックス活用
- テーマ設定を AppSettings に追加
- システムのダークモード検出
- トランジションアニメーション

**変更ファイル**:
- `src/shared/types.ts` - AppSettings.theme追加
- `src/renderer/styles/index.css` - ダークモード変数
- `src/renderer/App.tsx` - テーマプロバイダー
- `src/renderer/pages/Settings.tsx` - テーマ切替UI
- 各コンポーネント - dark: クラス追加

**工数**: 大 (2-3日) - 全コンポーネントの調整必要

---

#### 9.2 キーボードショートカット
**概要**: よく使う操作のホットキー

**詳細**:
| ショートカット | 動作 |
|--------------|------|
| `Ctrl+Shift+T` | トラッキング開始/停止 |
| `Ctrl+Shift+P` | 一時停止/再開 |
| `Ctrl+Shift+N` | 手動アクティビティ追加 |
| `Ctrl+1-5` | ページ切替 (Dashboard, Timeline...) |
| `Ctrl+F` | 検索フォーカス |
| `Esc` | モーダル閉じる |

**変更ファイル**:
- `src/main/index.ts` - globalShortcut登録
- `src/renderer/hooks/useKeyboardShortcuts.ts` - 新規
- `src/renderer/App.tsx` - ショートカットハンドラー
- `src/renderer/pages/Settings.tsx` - ショートカット一覧/カスタマイズ

**工数**: 中 (1-2日)

---

#### 9.3 アクティビティメモ
**概要**: アクティビティに自由記述のメモを追加

**詳細**:
- activities テーブルに notes カラム追加
- ActivityModal にテキストエリア追加
- タイムライン/カレンダーでメモアイコン表示
- 検索でメモ内容も対象

**変更ファイル**:
- `src/main/database/schema.ts` - notesカラム追加
- `src/shared/types.ts` - Activity.notes追加
- `src/main/database/repositories/activity-repository.ts` - notes対応
- `src/renderer/components/activities/ActivityModal.tsx` - メモ入力
- `src/renderer/pages/Timeline.tsx` - メモ表示

**工数**: 小 (0.5-1日)

---

### フェーズ10: 健康・集中サポート (中優先度)

#### 10.1 休憩リマインダー
**概要**: 長時間作業後に休憩を促す通知

**詳細**:
- 設定: 連続作業時間しきい値 (デフォルト: 50分)
- 設定: 推奨休憩時間 (デフォルト: 10分)
- 通知: 「50分連続で作業しています。休憩しましょう」
- 休憩中カウントダウン表示 (オプション)
- Do Not Disturb 時間帯設定

**変更ファイル**:
- `src/shared/types.ts` - AppSettings拡張
- `src/main/tracker/break-reminder.ts` - 新規
- `src/main/notifications/notification-manager.ts` - 休憩通知
- `src/renderer/pages/Settings.tsx` - 休憩設定UI

**工数**: 中 (1-2日)

---

#### 10.2 ポモドーロタイマー
**概要**: ポモドーロテクニック統合

**詳細**:
- 25分作業 + 5分休憩サイクル
- 4サイクル後に長休憩 (15分)
- ヘッダーにタイマー表示
- 通知でサイクル切替
- 統計: 今日のポモドーロ完了数

**変更ファイル**:
- `src/renderer/components/common/PomodoroTimer.tsx` - 新規
- `src/renderer/components/common/Header.tsx` - タイマー埋め込み
- `src/main/database/schema.ts` - pomodoro_sessions テーブル
- `src/renderer/stores/app-store.ts` - ポモドーロ状態

**工数**: 中 (1-2日)

---

#### 10.3 フォーカスタイム検出
**概要**: 中断なしの集中作業時間を自動検出・ハイライト

**詳細**:
- 定義: 同一カテゴリで30分以上連続 (アプリ切替5回以内)
- タイムラインでフォーカス期間をハイライト
- 日次サマリーに「集中時間」表示
- 週次トレンド: 集中時間の推移

**変更ファイル**:
- `src/main/database/repositories/statistics-repository.ts` - フォーカス検出
- `src/shared/types.ts` - FocusSession型追加
- `src/renderer/pages/Dashboard.tsx` - 集中時間表示
- `src/renderer/pages/Timeline.tsx` - フォーカスハイライト

**工数**: 中 (1-2日)

---

### フェーズ11: データ管理強化 (中優先度)

#### 11.1 PDFレポートエクスポート
**概要**: 日次/週次/月次レポートのPDF出力

**詳細**:
- レポートテンプレート (日本語対応)
- カテゴリ別円グラフ、アプリ別棒グラフ含む
- 期間指定でカスタムレポート生成
- 印刷プレビュー

**変更ファイル**:
- `package.json` - jspdf/pdfmake 追加
- `src/main/export/pdf-exporter.ts` - 新規
- `src/main/ipc/handlers.ts` - export:pdf ハンドラー
- `src/renderer/pages/Reports.tsx` - PDF出力ボタン

**工数**: 中 (1-2日)

---

#### 11.2 一括編集
**概要**: 複数アクティビティの同時編集

**詳細**:
- タイムライン/検索結果で複数選択
- 一括カテゴリ変更
- 一括タグ追加/削除
- 一括削除 (確認ダイアログ付き)

**変更ファイル**:
- `src/renderer/pages/Timeline.tsx` - 複数選択モード
- `src/renderer/components/activities/BulkEditBar.tsx` - 新規
- `src/main/database/repositories/activity-repository.ts` - バルク操作
- `src/main/ipc/handlers.ts` - activities:bulkUpdate

**工数**: 中 (1-2日)

---

#### 11.3 プロジェクト機能
**概要**: カテゴリとは別のプロジェクト単位でのグルーピング

**詳細**:
- projects テーブル追加
- アクティビティにproject_id追加
- プロジェクト別レポート
- プロジェクト切替ドロップダウン

**変更ファイル**:
- `src/main/database/schema.ts` - projectsテーブル
- `src/shared/types.ts` - Project型、Activity.projectId
- `src/main/database/repositories/project-repository.ts` - 新規
- `src/renderer/pages/Settings.tsx` - プロジェクト管理
- `src/renderer/components/activities/ActivityModal.tsx` - プロジェクト選択

**工数**: 大 (2-3日)

---

### フェーズ12: システム統合 (低優先度)

#### 12.1 アプリ使用制限アラート
**概要**: 特定アプリの使用時間が上限を超えたら警告

**詳細**:
- アプリ/カテゴリごとの日次上限設定
- 80%到達時の事前警告
- 100%到達時の通知
- 超過時間の記録

**変更ファイル**:
- `src/main/database/schema.ts` - app_limits テーブル
- `src/main/tracker/limit-checker.ts` - 新規
- `src/renderer/pages/Settings.tsx` - 制限設定UI

**工数**: 中 (1-2日)

---

#### 12.2 システムトレイ強化
**概要**: トレイからのクイックアクセス改善

**詳細**:
- 今日の作業時間表示
- 最近のアクティビティ (5件)
- クイック手動入力
- 目標進捗バー

**変更ファイル**:
- `src/main/tray/tray-manager.ts` - メニュー拡張
- `src/main/tray/tray-window.tsx` - ミニウィンドウ (オプション)

**工数**: 中 (1-2日)

---

#### 12.3 自動バックアップ
**概要**: データベースの定期自動バックアップ

**詳細**:
- 日次/週次バックアップ (設定可能)
- バックアップ先: ローカル / クラウドストレージ (Dropbox等)
- 保持世代数設定
- リストア機能

**変更ファイル**:
- `src/main/backup/backup-manager.ts` - 新規
- `src/renderer/pages/Settings.tsx` - バックアップ設定

**工数**: 中 (1-2日)

---

### フェーズ13: 将来拡張 (検討中)

#### 13.1 ブラウザ拡張
**概要**: Chrome/Firefox拡張でより正確なWeb追跡

**優先度**: 低 (別プロジェクト)
**理由**: メンテナンス負荷が高い

---

#### 13.2 モバイルアプリ
**概要**: iOS/Androidアプリ

**優先度**: 低 (大規模開発)
**理由**: React Native/Flutter別プロジェクト

---

#### 13.3 チーム機能
**概要**: 複数ユーザー、チームダッシュボード

**優先度**: 低 (アーキテクチャ変更必要)
**理由**: バックエンドサーバー必要

---

#### 13.4 外部連携
**概要**: JIRA, Trello, GitHub, Notion等との統合

**優先度**: 低 (個別実装必要)
**検討**: MCP Server として実装の可能性

---

## 推奨実装順序

```
フェーズ8.3 アクティビティメモ (小)     ← まず簡単なものから
    ↓
フェーズ8.1 生産性スコア (中)
    ↓
フェーズ9.1 ダークモード (大)           ← UX改善
    ↓
フェーズ9.2 キーボードショートカット (中)
    ↓
フェーズ10.1 休憩リマインダー (中)      ← 健康サポート
    ↓
フェーズ8.2 期間比較レポート (中)
    ↓
フェーズ8.3 ヒートマップビュー (中)
    ↓
フェーズ11.1 PDFエクスポート (中)
    ↓
フェーズ10.2 ポモドーロタイマー (中)
    ↓
フェーズ11.2 一括編集 (中)
    ↓
以降は優先度に応じて
```

---

## 工数サマリー

| フェーズ | 機能数 | 推定工数 |
|---------|--------|---------|
| 8: 生産性分析 | 3 | 4-6日 |
| 9: UX改善 | 3 | 3.5-6日 |
| 10: 健康サポート | 3 | 3-5日 |
| 11: データ管理 | 3 | 5-8日 |
| 12: システム統合 | 3 | 3-5日 |
| **合計** | **15** | **18.5-30日** |

---

## 技術的考慮事項

### パフォーマンス
- ヒートマップ: 大量データの集計最適化
- 比較レポート: クエリ効率化
- 一括編集: トランザクション処理

### セキュリティ
- バックアップ: 暗号化オプション
- エクスポート: 機密情報の取り扱い

### 互換性
- ダークモード: Electron/OS連携
- ショートカット: OS間の差異対応
- PDF: 日本語フォント埋め込み

---

## 次のアクション

1. ユーザーフィードバック収集
2. 優先度の再評価
3. フェーズ8から順次実装開始

