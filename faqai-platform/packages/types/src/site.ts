/**
 * サイト・クロール関連の型定義
 */

import type { UUID, ISODateString } from './common.js';

/** サイトの公開・運用ステータス */
export type SiteStatus = 'active' | 'paused' | 'archived';

/** ドメイン所有権の確認ステータス */
export type SiteVerificationStatus = 'pending' | 'verified' | 'failed';

/** クロールジョブの実行ステータス */
export type CrawlJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** クロールの設定 */
export interface CrawlConfig {
  /** クロールする最大深度 */
  maxDepth: number;
  /** クロールする最大ページ数 */
  maxPages: number;
  /** クロール対象URLのパターン（正規表現またはglob） */
  includePatterns: string[];
  /** クロール除外URLのパターン（正規表現またはglob） */
  excludePatterns: string[];
  /** リクエスト間の遅延（ミリ秒） */
  crawlDelay: number;
  /** スクリーンショット取得の有無 */
  screenshotEnabled: boolean;
  /** 自動クロールのスケジュール式（cron形式、省略時は手動のみ） */
  scheduleExpression?: string;
}

/** サイト情報 */
export interface Site {
  id: UUID;
  organizationId: UUID;
  name: string;
  url: string;
  /** 認証済みドメイン */
  domain: string;
  status: SiteStatus;
  verificationStatus: SiteVerificationStatus;
  crawlConfig: CrawlConfig;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** クロールジョブ */
export interface CrawlJob {
  id: UUID;
  siteId: UUID;
  status: CrawlJobStatus;
  /** 進捗率（0〜100） */
  progress: number;
  /** クロール対象ページの総数 */
  pagesTotal: number;
  /** クロール完了ページ数 */
  pagesCrawled: number;
  /** エラーが発生したページ数 */
  pagesError: number;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  /** エラー詳細（失敗時のみ） */
  error?: string;
}

/** クロール済みページ */
export interface CrawlPage {
  id: UUID;
  jobId: UUID;
  url: string;
  title: string;
  /** ページコンテンツのハッシュ値（変更検知用） */
  contentHash: string;
  screenshotUrl?: string;
  status: 'success' | 'error' | 'skipped';
  createdAt: ISODateString;
}
