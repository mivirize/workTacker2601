import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';
import { faqItems } from './faq.js';

// ---------------------------------------------------------------------------
// faq_embeddings
// ---------------------------------------------------------------------------

export const faqEmbeddings = pgTable(
  'faq_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    faqItemId: uuid('faq_item_id')
      .notNull()
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    chunkText: text('chunk_text').notNull(),
    model: text('model').notNull().default('text-embedding-3-small'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_faq_embeddings_faq_item').on(table.faqItemId),
    // Vector index (IVFFlat/HNSW) should be created via migration SQL
    // as drizzle-orm doesn't yet support vector index syntax directly
  ],
);
