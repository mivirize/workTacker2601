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
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './auth.js';
import { sites, crawlPages, pageScreenshots } from './sites.js';
import type { users } from './auth.js';

// ---------------------------------------------------------------------------
// Custom types
// ---------------------------------------------------------------------------

// tsvector is not built-in to drizzle-orm/pg-core, define it as custom type
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const faqStatusEnum = pgEnum('faq_status', [
  'draft',
  'published',
  'archived',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FaqItemMetadata = {
  aiGenerated?: boolean;
  generationModel?: string;
  sourceSection?: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// faq_categories
// ---------------------------------------------------------------------------

export const faqCategories = pgTable(
  'faq_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_faq_categories_site_slug').on(table.siteId, table.slug),
    index('idx_faq_categories_org').on(table.organizationId),
    index('idx_faq_categories_site').on(table.siteId),
    index('idx_faq_categories_parent').on(table.parentId),
    index('idx_faq_categories_sort').on(table.siteId, table.sortOrder),
  ],
);

// Self-referencing FK for parent_id is added after table definition via SQL
// Drizzle handles self-ref by referencing the table after creation

// ---------------------------------------------------------------------------
// faq_items
// ---------------------------------------------------------------------------

export const faqItems = pgTable(
  'faq_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => faqCategories.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    sourcePageId: uuid('source_page_id').references(() => crawlPages.id, {
      onDelete: 'set null',
    }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    answerHtml: text('answer_html'),
    status: faqStatusEnum('status').notNull().default('draft'),
    qualityScore: real('quality_score'),
    priorityScore: real('priority_score'),
    viewCount: integer('view_count').notNull().default(0),
    helpfulCount: integer('helpful_count').notNull().default(0),
    unhelpfulCount: integer('unhelpful_count').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    metadata: jsonb('metadata')
      .$type<FaqItemMetadata>()
      .notNull()
      .default({}),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`setweight(to_tsvector('simple', coalesce(question, '')), 'A') || setweight(to_tsvector('simple', coalesce(answer, '')), 'B')`,
    ),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_faq_items_org').on(table.organizationId),
    index('idx_faq_items_category').on(table.categoryId),
    index('idx_faq_items_site').on(table.siteId),
    index('idx_faq_items_status').on(table.status),
    index('idx_faq_items_site_status').on(table.siteId, table.status),
    index('idx_faq_items_sort').on(table.categoryId, table.sortOrder),
    index('idx_faq_items_source_page').on(table.sourcePageId),
  ],
);

// ---------------------------------------------------------------------------
// faq_item_screenshots (junction: faq_items N:N page_screenshots)
// ---------------------------------------------------------------------------

export const faqItemScreenshots = pgTable(
  'faq_item_screenshots',
  {
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    screenshotId: uuid('screenshot_id')
      .notNull()
      .references(() => pageScreenshots.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.faqItemId, table.screenshotId] }),
  ],
);

// ---------------------------------------------------------------------------
// faq_tags
// ---------------------------------------------------------------------------

export const faqTags = pgTable(
  'faq_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_faq_tags_org_name').on(table.organizationId, table.name),
  ],
);

// ---------------------------------------------------------------------------
// faq_item_tags (junction)
// ---------------------------------------------------------------------------

export const faqItemTags = pgTable(
  'faq_item_tags',
  {
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => faqTags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.faqItemId, table.tagId] }),
    index('idx_faq_item_tags_tag').on(table.tagId),
  ],
);

// ---------------------------------------------------------------------------
// faq_versions
// ---------------------------------------------------------------------------

export const faqVersions = pgTable(
  'faq_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    answerHtml: text('answer_html'),
    changeSummary: text('change_summary'),
    // changedBy references users - declared as uuid to avoid circular import
    changedBy: uuid('changed_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_faq_versions_item_version').on(
      table.faqItemId,
      table.versionNumber,
    ),
    index('idx_faq_versions_item').on(table.faqItemId),
  ],
);

// ---------------------------------------------------------------------------
// faq_feedbacks
// ---------------------------------------------------------------------------

export const faqFeedbacks = pgTable(
  'faq_feedbacks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    isHelpful: boolean('is_helpful').notNull(),
    comment: text('comment'),
    sessionId: varchar('session_id', { length: 128 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_faq_feedbacks_item').on(table.faqItemId),
    index('idx_faq_feedbacks_org').on(table.organizationId),
    index('idx_faq_feedbacks_created').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// faq_related_items (self-referencing junction)
// ---------------------------------------------------------------------------

export const faqRelatedItems = pgTable(
  'faq_related_items',
  {
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    relatedItemId: uuid('related_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    relevanceScore: real('relevance_score').notNull().default(0.5),
    isAuto: boolean('is_auto').notNull().default(true),
  },
  (table) => [
    primaryKey({ columns: [table.faqItemId, table.relatedItemId] }),
    index('idx_faq_related_item').on(table.relatedItemId),
  ],
);

// Re-export users type for faq_versions relation (avoids circular import)
export type { users };
