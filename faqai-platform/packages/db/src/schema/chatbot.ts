import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './auth.js';
import { sites } from './sites.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const chatbotTypeEnum = pgEnum('chatbot_type', [
  'scenario',
  'ai',
  'hybrid',
]);

export const chatMessageRoleEnum = pgEnum('chat_message_role', [
  'user',
  'bot',
  'system',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetConfig = {
  position: 'bottom-right' | 'bottom-left';
  primary_color: string;
  greeting_message: string;
  placeholder_text: string;
  avatar_url: string | null;
  icon_type: string;
  show_branding: boolean;
  auto_open_delay_ms: number | null;
  mobile_full_screen: boolean;
};

export type AiConfig = {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  confidence_threshold: number;
  fallback_message: string;
  max_context_messages: number;
};

export type TriggerConfig = {
  pages: string[];
  scroll_percent: number | null;
  delay_seconds: number | null;
  exit_intent: boolean;
};

export type NodeContent = {
  text?: string;
  choices?: Array<{ label: string; value: string }>;
  condition?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ChatSessionMetadata = {
  country?: string;
  language?: string;
  [key: string]: unknown;
};

export type ChatMessageMetadata = {
  selectedChoice?: string;
  formData?: Record<string, unknown>;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// chatbots
// ---------------------------------------------------------------------------

export const chatbots = pgTable(
  'chatbots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: chatbotTypeEnum('type').notNull().default('ai'),
    isActive: boolean('is_active').notNull().default(false),
    widgetConfig: jsonb('widget_config')
      .$type<WidgetConfig>()
      .notNull()
      .default({
        position: 'bottom-right',
        primary_color: '#4F46E5',
        greeting_message: 'こんにちは！何かお手伝いできますか？',
        placeholder_text: 'メッセージを入力...',
        avatar_url: null,
        icon_type: 'chat',
        show_branding: true,
        auto_open_delay_ms: null,
        mobile_full_screen: false,
      }),
    aiConfig: jsonb('ai_config')
      .$type<AiConfig>()
      .notNull()
      .default({
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1024,
        system_prompt: null,
        confidence_threshold: 0.7,
        fallback_message: '申し訳ありません。この質問にはお答えできません。',
        max_context_messages: 10,
      }),
    triggerConfig: jsonb('trigger_config')
      .$type<TriggerConfig>()
      .notNull()
      .default({
        pages: ['*'],
        scroll_percent: null,
        delay_seconds: null,
        exit_intent: false,
      }),
    allowedDomains: text('allowed_domains').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_chatbots_org').on(table.organizationId),
    index('idx_chatbots_site').on(table.siteId),
    index('idx_chatbots_active').on(table.organizationId),
  ],
);

// ---------------------------------------------------------------------------
// scenarios
// ---------------------------------------------------------------------------

export const scenarios = pgTable(
  'scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatbotId: uuid('chatbot_id')
      .notNull()
      .references(() => chatbots.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(false),
    triggerKeywords: text('trigger_keywords').array().notNull().default([]),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_scenarios_chatbot').on(table.chatbotId),
    index('idx_scenarios_org').on(table.organizationId),
  ],
);

// ---------------------------------------------------------------------------
// scenario_nodes
// ---------------------------------------------------------------------------

export const scenarioNodes = pgTable(
  'scenario_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scenarioId: uuid('scenario_id')
      .notNull()
      .references(() => scenarios.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    nodeType: varchar('node_type', { length: 50 }).notNull(),
    content: jsonb('content').$type<NodeContent>().notNull().default({}),
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    isStart: boolean('is_start').notNull().default(false),
    isEnd: boolean('is_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_scenario_nodes_scenario').on(table.scenarioId),
    index('idx_scenario_nodes_org').on(table.organizationId),
    index('idx_scenario_nodes_start').on(table.scenarioId),
  ],
);

// ---------------------------------------------------------------------------
// scenario_edges
// ---------------------------------------------------------------------------

export type EdgeCondition = {
  type?: string;
  value?: unknown;
  [key: string]: unknown;
};

export const scenarioEdges = pgTable(
  'scenario_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scenarioId: uuid('scenario_id')
      .notNull()
      .references(() => scenarios.id, { onDelete: 'cascade' }),
    fromNodeId: uuid('from_node_id')
      .notNull()
      .references(() => scenarioNodes.id, { onDelete: 'cascade' }),
    toNodeId: uuid('to_node_id')
      .notNull()
      .references(() => scenarioNodes.id, { onDelete: 'cascade' }),
    condition: jsonb('condition').$type<EdgeCondition>(),
    label: varchar('label', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_scenario_edges_scenario').on(table.scenarioId),
    index('idx_scenario_edges_from').on(table.fromNodeId),
    index('idx_scenario_edges_to').on(table.toNodeId),
  ],
);

// ---------------------------------------------------------------------------
// chat_sessions
// ---------------------------------------------------------------------------

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatbotId: uuid('chatbot_id')
      .notNull()
      .references(() => chatbots.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    visitorId: varchar('visitor_id', { length: 128 }),
    pageUrl: text('page_url'),
    referrerUrl: text('referrer_url'),
    userAgent: text('user_agent'),
    ipHash: varchar('ip_hash', { length: 64 }),
    metadata: jsonb('metadata')
      .$type<ChatSessionMetadata>()
      .notNull()
      .default({}),
    isResolved: boolean('is_resolved').notNull().default(false),
    isEscalated: boolean('is_escalated').notNull().default(false),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_chat_sessions_chatbot').on(table.chatbotId),
    index('idx_chat_sessions_org').on(table.organizationId),
    index('idx_chat_sessions_started').on(table.startedAt),
    index('idx_chat_sessions_unresolved').on(table.organizationId),
    index('idx_chat_sessions_visitor').on(table.visitorId),
  ],
);

// ---------------------------------------------------------------------------
// chat_messages
// ---------------------------------------------------------------------------

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: chatMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata')
      .$type<ChatMessageMetadata>()
      .notNull()
      .default({}),
    scenarioNodeId: uuid('scenario_node_id').references(
      () => scenarioNodes.id,
      { onDelete: 'set null' },
    ),
    confidenceScore: real('confidence_score'),
    sourceFaqIds: uuid('source_faq_ids').array(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_chat_messages_session').on(table.sessionId),
    index('idx_chat_messages_org').on(table.organizationId),
    index('idx_chat_messages_created').on(table.sessionId, table.createdAt),
  ],
);
