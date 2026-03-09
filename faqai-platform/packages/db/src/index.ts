// Re-export the Drizzle client utilities
export { getDb } from './client.js';
export type { Db } from './client.js';

// Re-export all schema tables, enums, relations, and types
export * from './schema/index.js';

// Re-export frequently used Drizzle query helpers
// Apps should import from @faqai/db to avoid duplicate module instances
export { eq, and, or, not, isNull, isNotNull, desc, asc, sql, inArray, notInArray, like, ilike, count } from 'drizzle-orm';
