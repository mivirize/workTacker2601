/**
 * FAQ関連の型定義
 */

import type { UUID, ISODateString } from './common.js';

/** FAQアイテムの公開ステータス */
export type FaqStatus = 'draft' | 'published' | 'archived';

/** FAQカテゴリー */
export interface FaqCategory {
  id: UUID;
  siteId: UUID;
  organizationId: UUID;
  name: string;
  /** URLスラッグ（サイト内一意） */
  slug: string;
  description?: string;
  /** 親カテゴリーのID（ネストの場合） */
  parentId?: UUID;
  displayOrder: number;
  isPublished: boolean;
}

/** FAQタグ */
export interface FaqTag {
  id: UUID;
  organizationId: UUID;
  name: string;
  /** 表示色（HEXカラーコード） */
  color: string;
}

/** FAQアイテム */
export interface FaqItem {
  id: UUID;
  categoryId: UUID;
  organizationId: UUID;
  question: string;
  answer: string;
  /** 関連スクリーンショットのURL */
  screenshotUrl?: string;
  /** 参照元ページのURL */
  pageUrl?: string;
  tags: FaqTag[];
  status: FaqStatus;
  /** 閲覧数 */
  viewCount: number;
  /** 役に立った数 */
  helpfulCount: number;
  /** 役に立たなかった数 */
  notHelpfulCount: number;
  displayOrder: number;
  /** AI自動生成フラグ */
  aiGenerated: boolean;
  /** AIによる品質スコア（0〜1） */
  qualityScore?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** FAQアイテムの変更履歴 */
export interface FaqVersion {
  id: UUID;
  faqItemId: UUID;
  question: string;
  answer: string;
  /** 変更者のユーザーID */
  changedBy: UUID;
  createdAt: ISODateString;
}

/** FAQフィードバック（役立ち投票） */
export interface FaqFeedback {
  id: UUID;
  faqItemId: UUID;
  /** チャットセッションID（あれば） */
  sessionId?: UUID;
  type: 'helpful' | 'not_helpful';
  comment?: string;
  createdAt: ISODateString;
}

/** FAQアイテム作成リクエスト */
export interface CreateFaqItemRequest {
  categoryId: UUID;
  question: string;
  answer: string;
  screenshotUrl?: string;
  pageUrl?: string;
  tagIds?: UUID[];
  status?: FaqStatus;
  displayOrder?: number;
}

/** FAQアイテム更新リクエスト */
export interface UpdateFaqItemRequest {
  question?: string;
  answer?: string;
  categoryId?: UUID;
  screenshotUrl?: string;
  pageUrl?: string;
  tagIds?: UUID[];
  status?: FaqStatus;
  displayOrder?: number;
}

/** FAQ検索パラメータ */
export interface FaqSearchParams {
  query?: string;
  categoryId?: UUID;
  tags?: UUID[];
  status?: FaqStatus;
  page?: number;
  limit?: number;
}
