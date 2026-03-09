/**
 * APIエンドポイントの入出力型定義
 */

import type { UUID } from './common.js';
import type { ApiResponse } from './common.js';
import type { User, AuthTokens } from './auth.js';
import type { ChatbotConfig } from './chatbot.js';
import type { ChatMessage } from './chatbot.js';
import type { FaqItem } from './faq.js';
import type { CrawlConfig } from './site.js';

// ============================================================
// Auth API
// ============================================================

/** ログインAPIレスポンス */
export type LoginResponse = ApiResponse<{
  user: User;
  tokens: AuthTokens;
}>;

/** トークンリフレッシュリクエスト */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** トークンリフレッシュレスポンス */
export type RefreshTokenResponse = ApiResponse<AuthTokens>;

// ============================================================
// Widget API
// ============================================================

/** ウィジェット設定レスポンス（チャットボット設定+初期FAQリスト） */
export type WidgetConfigResponse = ApiResponse<{
  chatbot: {
    id: UUID;
    name: string;
    type: string;
    config: ChatbotConfig;
  };
  /** ウィジェット初期表示用FAQリスト */
  initialFaqs: FaqItem[];
}>;

// ============================================================
// Chat API
// ============================================================

/** チャットメッセージ送信リクエスト */
export interface ChatMessageRequest {
  sessionId: UUID;
  content: string;
}

/** チャットメッセージ送信レスポンス */
export type ChatMessageResponse = ApiResponse<{
  message: ChatMessage;
  /** 関連FAQ等のサジェスト */
  suggestions?: FaqItem[];
}>;

// ============================================================
// FAQ Generation API
// ============================================================

/** AI FAQ自動生成リクエスト */
export interface GenerateFaqRequest {
  siteId: UUID;
  /** 生成対象のクロールページIDリスト（省略時は全ページ対象） */
  pageIds?: UUID[];
  /** 生成する観点のリスト（例: ['usage', 'troubleshooting', 'pricing']） */
  perspectives?: string[];
}

// ============================================================
// Crawl API
// ============================================================

/** クロール開始リクエスト */
export interface CrawlStartRequest {
  siteId: UUID;
  /** 一時的な上書き設定（省略時はサイト登録済みの設定を使用） */
  config?: Partial<CrawlConfig>;
}
