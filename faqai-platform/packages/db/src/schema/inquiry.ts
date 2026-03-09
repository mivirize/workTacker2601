import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  smallint,
  real,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations, users } from './auth.js';
import { sites } from './sites.js';
import { chatSessions } from './chatbot.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const inquiryStatusEnum = pgEnum('inquiry_status', [
  'new',
  'assigned',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
]);

export const inquiryPriorityEnum = pgEnum('inquiry_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const inquirySourceEnum = pgEnum('inquiry_source', [
  'email',
  'form',
  'chat_escalation',
  'manual',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SenderMetadata = {
  orderId?: string;
  customerId?: string;
  [key: string]: unknown;
};

export type TemplateVariable = {
  key: string;
  label: string;
  default: string;
};

// ---------------------------------------------------------------------------
// inquiries
// ---------------------------------------------------------------------------

export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id').references(() => sites.id, {
      onDelete: 'set null',
    }),
    source: inquirySourceEnum('source').notNull().default('manual'),
    status: inquiryStatusEnum('status').notNull().default('new'),
    priority: inquiryPriorityEnum('priority').notNull().default('medium'),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    bodyHtml: text('body_html'),
    senderName: varchar('sender_name', { length: 255 }),
    senderEmail: varchar('sender_email', { length: 320 }),
    senderMetadata: jsonb('sender_metadata')
      .$type<SenderMetadata>()
      .notNull()
      .default({}),
    assignedTo: uuid('assigned_to').references(() => users.id, {
      onDelete: 'set null',
    }),
    escalatedFromSession: uuid('escalated_from_session').references(
      () => chatSessions.id,
      { onDelete: 'set null' },
    ),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    slaDeadlineAt: timestamp('sla_deadline_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_inquiries_org').on(table.organizationId),
    index('idx_inquiries_status').on(table.status),
    index('idx_inquiries_org_status').on(table.organizationId, table.status),
    index('idx_inquiries_assigned').on(table.assignedTo),
    index('idx_inquiries_priority').on(table.organizationId, table.priority),
    index('idx_inquiries_sla').on(table.slaDeadlineAt),
    index('idx_inquiries_created').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// response_templates
// ---------------------------------------------------------------------------

export const responseTemplates = pgTable(
  'response_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    subjectTemplate: text('subject_template'),
    bodyTemplate: text('body_template').notNull(),
    variables: jsonb('variables')
      .$type<TemplateVariable[]>()
      .notNull()
      .default([]),
    usageCount: integer('usage_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_templates_org').on(table.organizationId),
    index('idx_templates_active').on(table.organizationId),
  ],
);

// ---------------------------------------------------------------------------
// template_tags
// ---------------------------------------------------------------------------

export const templateTags = pgTable(
  'template_tags',
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
    uniqueIndex('idx_template_tags_org_name').on(
      table.organizationId,
      table.name,
    ),
  ],
);

// ---------------------------------------------------------------------------
// template_tag_assignments (junction)
// ---------------------------------------------------------------------------

import { primaryKey } from 'drizzle-orm/pg-core';

export const templateTagAssignments = pgTable(
  'template_tag_assignments',
  {
    templateId: uuid('template_id')
      .notNull()
      .references(() => responseTemplates.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => templateTags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.tagId] }),
    index('idx_template_tag_assign_tag').on(table.tagId),
  ],
);

// ---------------------------------------------------------------------------
// ai_responses
// ---------------------------------------------------------------------------

export const aiResponses = pgTable(
  'ai_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inquiryId: uuid('inquiry_id')
      .notNull()
      .references(() => inquiries.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    generatedText: text('generated_text').notNull(),
    tone: varchar('tone', { length: 50 }),
    confidenceScore: real('confidence_score'),
    sourceFaqIds: uuid('source_faq_ids').array(),
    sourceTemplateIds: uuid('source_template_ids').array(),
    isSelected: boolean('is_selected').notNull().default(false),
    isEdited: boolean('is_edited').notNull().default(false),
    editedText: text('edited_text'),
    feedbackRating: smallint('feedback_rating'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_ai_responses_inquiry').on(table.inquiryId),
    index('idx_ai_responses_org').on(table.organizationId),
    index('idx_ai_responses_selected').on(table.inquiryId),
  ],
);
