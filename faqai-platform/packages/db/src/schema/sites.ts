import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  smallint,
  bigint,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './auth.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const crawlStatusEnum = pgEnum('crawl_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrawlConfig = {
  max_pages: number;
  max_depth: number;
  respect_robots_txt: boolean;
  rate_limit_ms: number;
  include_patterns: string[];
  exclude_patterns: string[];
  auth_config: Record<string, unknown> | null;
  screenshot_enabled: boolean;
  js_rendering: boolean;
  auto_factcheck?: boolean;
};

// ---------------------------------------------------------------------------
// sites
// ---------------------------------------------------------------------------

export const sites = pgTable(
  'sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    url: text('url').notNull(),
    domain: varchar('domain', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }),
    description: text('description'),
    notes: text('notes'),
    aiContext: text('ai_context'),
    logoUrl: varchar('logo_url', { length: 1024 }),
    themeColor: varchar('theme_color', { length: 7 }),
    crawlConfig: jsonb('crawl_config')
      .$type<CrawlConfig>()
      .notNull()
      .default({
        max_pages: 100,
        max_depth: 5,
        respect_robots_txt: true,
        rate_limit_ms: 1000,
        include_patterns: [],
        exclude_patterns: [],
        auth_config: null,
        screenshot_enabled: true,
        js_rendering: true,
      }),
    scheduleCron: varchar('schedule_cron', { length: 100 }),
    isVerified: boolean('is_verified').notNull().default(false),
    verificationToken: varchar('verification_token', { length: 64 }),
    lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_sites_org').on(table.organizationId),
    index('idx_sites_domain').on(table.domain),
    uniqueIndex('idx_sites_slug').on(table.slug),
    index('idx_sites_schedule').on(table.scheduleCron),
  ],
);

// ---------------------------------------------------------------------------
// crawl_jobs
// ---------------------------------------------------------------------------

export const crawlJobs = pgTable(
  'crawl_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    status: crawlStatusEnum('status').notNull().default('pending'),
    configSnapshot: jsonb('config_snapshot')
      .$type<CrawlConfig>()
      .notNull(),
    totalPages: integer('total_pages').notNull().default(0),
    crawledPages: integer('crawled_pages').notNull().default(0),
    failedPages: integer('failed_pages').notNull().default(0),
    faqGenerated: integer('faq_generated').notNull().default(0),
    errorLog: jsonb('error_log').$type<Record<string, unknown>[]>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_crawl_jobs_site').on(table.siteId),
    index('idx_crawl_jobs_org').on(table.organizationId),
    index('idx_crawl_jobs_status').on(table.status),
    index('idx_crawl_jobs_site_status').on(table.siteId, table.status),
    index('idx_crawl_jobs_created').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// crawl_pages
// ---------------------------------------------------------------------------

export type PageMetaData = {
  description?: string;
  keywords?: string[];
  og?: Record<string, string>;
  [key: string]: unknown;
};

export const crawlPages = pgTable(
  'crawl_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    crawlJobId: uuid('crawl_job_id')
      .notNull()
      .references(() => crawlJobs.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    title: text('title'),
    contentText: text('content_text'),
    contentHtml: text('content_html'),
    metaData: jsonb('meta_data').$type<PageMetaData>().notNull().default({}),
    httpStatus: smallint('http_status'),
    contentHash: varchar('content_hash', { length: 64 }),
    depth: smallint('depth').notNull().default(0),
    crawledAt: timestamp('crawled_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_crawl_pages_job').on(table.crawlJobId),
    index('idx_crawl_pages_site').on(table.siteId),
    index('idx_crawl_pages_org').on(table.organizationId),
    index('idx_crawl_pages_url').on(table.url),
    index('idx_crawl_pages_hash').on(table.contentHash),
  ],
);

// ---------------------------------------------------------------------------
// page_screenshots
// ---------------------------------------------------------------------------

export const pageScreenshots = pgTable(
  'page_screenshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    crawlPageId: uuid('crawl_page_id')
      .notNull()
      .references(() => crawlPages.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    thumbnailPath: text('thumbnail_path'),
    width: integer('width'),
    height: integer('height'),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
    sectionSelector: text('section_selector'),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_screenshots_page').on(table.crawlPageId),
    index('idx_screenshots_org').on(table.organizationId),
  ],
);
