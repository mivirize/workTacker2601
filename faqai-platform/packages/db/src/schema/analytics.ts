import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  bigint,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './auth.js';
import { sites } from './sites.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  'faq_view',
  'faq_search',
  'faq_feedback',
  'chat_session_start',
  'chat_message_sent',
  'chat_escalation',
  'widget_loaded',
  'inquiry_created',
  'ai_response_generated',
]);

export const usageMetricEnum = pgEnum('usage_metric', [
  'crawl_pages',
  'faq_items',
  'chat_sessions',
  'ai_api_calls',
  'storage_bytes',
  'api_requests',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventProperties = {
  faqId?: string;
  query?: string;
  chatbotId?: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// analytics_events
// ---------------------------------------------------------------------------

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id').references(() => sites.id, {
      onDelete: 'set null',
    }),
    eventType: analyticsEventTypeEnum('event_type').notNull(),
    entityId: uuid('entity_id'),
    sessionId: varchar('session_id', { length: 128 }),
    properties: jsonb('properties')
      .$type<EventProperties>()
      .notNull()
      .default({}),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: text('user_agent'),
    pageUrl: text('page_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_analytics_org').on(table.organizationId),
    index('idx_analytics_type').on(table.eventType),
    index('idx_analytics_org_type').on(table.organizationId, table.eventType),
    index('idx_analytics_site').on(table.siteId),
    index('idx_analytics_entity').on(table.entityId),
    index('idx_analytics_created_brin').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// usage_records
// ---------------------------------------------------------------------------

export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    metric: usageMetricEnum('metric').notNull(),
    value: bigint('value', { mode: 'number' }).notNull().default(0),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_usage_org_metric_period').on(
      table.organizationId,
      table.metric,
      table.periodStart,
    ),
    index('idx_usage_org').on(table.organizationId),
    index('idx_usage_org_metric').on(table.organizationId, table.metric),
    index('idx_usage_period').on(table.periodStart, table.periodEnd),
  ],
);
