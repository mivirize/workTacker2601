/**
 * チャットボット関連の型定義
 */

import type { UUID, ISODateString } from './common.js';

/** チャットボットの種別 */
export type ChatbotType = 'scenario' | 'ai' | 'hybrid';

/** シナリオノードの種別 */
export type ScenarioNodeType =
  | 'start'
  | 'message'
  | 'options'
  | 'input'
  | 'faq'
  | 'escalate'
  | 'end';

/** チャットボットの表示トリガー設定 */
export interface TriggerConfig {
  /** トリガー種別 */
  type: 'auto' | 'click' | 'scroll' | 'exit';
  /** 自動表示までの遅延（ミリ秒、type='auto'の場合） */
  delay?: number;
  /** スクロール率（%、type='scroll'の場合） */
  scrollPercent?: number;
  /** クリック対象要素のCSSセレクター（type='click'の場合） */
  selector?: string;
}

/** AI機能の設定 */
export interface AiConfig {
  /** AIプロバイダー（例: 'openai', 'anthropic'） */
  provider: string;
  /** 使用するモデル名 */
  model: string;
  /** システムプロンプト */
  systemPrompt: string;
  /** 回答のランダム性（0〜1） */
  temperature: number;
  /** 最大トークン数 */
  maxTokens: number;
  /** 有人対応へのエスカレーションしきい値（信頼度スコア、0〜1） */
  escalationThreshold: number;
}

/** チャットボットの表示・動作設定 */
export interface ChatbotConfig {
  /** プライマリカラー（HEXカラーコード） */
  primaryColor: string;
  /** 表示位置 */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** ウェルカムメッセージ */
  welcomeMessage: string;
  /** 入力フィールドのプレースホルダー */
  placeholder: string;
  /** アバター画像URL */
  avatarUrl?: string;
  /** チャットボットを許可するドメインのリスト */
  allowedDomains: string[];
  triggerConfig: TriggerConfig;
  /** AI機能設定（type='ai'または'hybrid'の場合） */
  aiConfig?: AiConfig;
}

/** チャットボット */
export interface Chatbot {
  id: UUID;
  siteId: UUID;
  organizationId: UUID;
  name: string;
  type: ChatbotType;
  config: ChatbotConfig;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** シナリオノードの選択肢 */
export interface ScenarioOption {
  label: string;
  nextNodeId: UUID;
}

/** シナリオノードの分岐条件 */
export interface ScenarioCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
  nextNodeId: UUID;
}

/** シナリオのノード */
export interface ScenarioNode {
  id: UUID;
  type: ScenarioNodeType;
  /** ノードに表示するコンテンツ（メッセージ文など） */
  content: string;
  /** 選択肢（type='options'の場合） */
  options?: ScenarioOption[];
  /** デフォルトの遷移先ノードID */
  nextNodeId?: UUID;
  /** 条件分岐（type='input'などで使用） */
  conditions?: ScenarioCondition[];
}

/** シナリオ */
export interface Scenario {
  id: UUID;
  chatbotId: UUID;
  name: string;
  /** デフォルトシナリオフラグ */
  isDefault: boolean;
  nodes: ScenarioNode[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** チャットセッションのメタデータ */
export interface ChatSessionMetadata {
  /** ユーザーエージェント */
  userAgent?: string;
  /** 参照元URL */
  referrer?: string;
  /** IPアドレス（匿名化済み） */
  ip?: string;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}

/** チャットセッション */
export interface ChatSession {
  id: UUID;
  chatbotId: UUID;
  /** セッションを識別するトークン（ブラウザ側で保持） */
  sessionToken: string;
  metadata: ChatSessionMetadata;
  startedAt: ISODateString;
  endedAt?: ISODateString;
  /** ユーザーの問題が解決されたか */
  resolved: boolean;
}

/** チャットメッセージのメタデータ */
export interface ChatMessageMetadata {
  /** 参照したFAQのIDリスト */
  faqIds?: UUID[];
  /** AI信頼度スコア */
  confidence?: number;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}

/** チャットメッセージ */
export interface ChatMessage {
  id: UUID;
  sessionId: UUID;
  role: 'user' | 'bot';
  content: string;
  metadata: ChatMessageMetadata;
  createdAt: ISODateString;
}
