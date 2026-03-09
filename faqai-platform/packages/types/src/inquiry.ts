/**
 * 問い合わせ・返信テンプレート関連の型定義
 */

import type { UUID, ISODateString } from './common.js';

/** 問い合わせのステータス */
export type InquiryStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

/** 問い合わせの優先度 */
export type InquiryPriority = 'low' | 'medium' | 'high' | 'urgent';

/** 問い合わせの受信元 */
export type InquirySource = 'email' | 'chat' | 'webhook' | 'manual';

/** 問い合わせ */
export interface Inquiry {
  id: UUID;
  organizationId: UUID;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  /** 担当者のユーザーID */
  assigneeId?: UUID;
  tags: string[];
  source: InquirySource;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 返信テンプレートのタグ */
export interface TemplateTag {
  id: UUID;
  organizationId: UUID;
  name: string;
  /** 表示色（HEXカラーコード） */
  color: string;
}

/** 返信テンプレート */
export interface ResponseTemplate {
  id: UUID;
  organizationId: UUID;
  name: string;
  subject: string;
  body: string;
  tags: TemplateTag[];
  /** テンプレート内の変数名リスト（例: ['customer_name', 'order_id']） */
  variables: string[];
  /** このテンプレートが使用された回数 */
  usageCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** AI生成返信 */
export interface AiResponse {
  id: UUID;
  inquiryId: UUID;
  /** ベースにしたテンプレートのID（あれば） */
  templateId?: UUID;
  /** 生成された返信文 */
  content: string;
  /** 信頼度スコア（0〜1） */
  confidence: number;
  /** 使用したAIプロバイダー（例: 'openai', 'anthropic'） */
  provider: string;
  /** 参照したFAQアイテムのIDリスト */
  usedFaqIds: UUID[];
  /** 担当者による承認フラグ */
  isApproved: boolean;
  createdAt: ISODateString;
}

/** 問い合わせ作成リクエスト */
export interface CreateInquiryRequest {
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  priority?: InquiryPriority;
  source?: InquirySource;
  tags?: string[];
}

/** AI返信生成リクエスト */
export interface GenerateResponseRequest {
  inquiryId: UUID;
  /** ベースにするテンプレートIDのリスト（省略時はAIが自動選択） */
  templateIds?: UUID[];
  /** 返信のトーン（例: 'formal', 'friendly', 'concise'） */
  tone?: string;
  /** 返信言語（BCP 47形式、例: 'ja', 'en'） */
  language?: string;
}
