import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './auth.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModelConfig = {
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// llm_provider_configs
// ---------------------------------------------------------------------------

export const llmProviderConfigs = pgTable(
  'llm_provider_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    apiKeyEncrypted: text('api_key_encrypted').notNull(),
    modelConfig: jsonb('model_config')
      .$type<ModelConfig>()
      .notNull()
      .default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_llm_configs_org_provider').on(
      table.organizationId,
      table.provider,
    ),
    index('idx_llm_configs_org').on(table.organizationId),
  ],
);
