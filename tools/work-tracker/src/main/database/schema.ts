import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { DEFAULT_CATEGORIES } from '../../shared/types'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()

  const userDataPath = app.getPath('userData')
  dbPath = path.join(userDataPath, 'work-tracker.db')

  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  return db
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase()

  // Create tables
  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      rules TEXT DEFAULT '[]',
      is_default INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executable_path TEXT,
      icon TEXT,
      category_id INTEGER,
      total_duration INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT NOT NULL,
      window_title TEXT,
      url TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER DEFAULT 0,
      category_id INTEGER,
      is_idle INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `)

  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_app_name ON activities(app_name)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_category_id ON activities(category_id)`)

  // Goals table
  database.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target_minutes INTEGER NOT NULL,
      category_id INTEGER,
      is_enabled INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  // Tags table
  database.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // Activity-Tag junction table (many-to-many)
  database.run(`
    CREATE TABLE IF NOT EXISTS activity_tags (
      activity_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (activity_id, tag_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)

  database.run(`CREATE INDEX IF NOT EXISTS idx_activity_tags_activity_id ON activity_tags(activity_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_activity_tags_tag_id ON activity_tags(tag_id)`)

  // Category-Tag junction table (many-to-many) - default tags for categories
  database.run(`
    CREATE TABLE IF NOT EXISTS category_tags (
      category_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (category_id, tag_id),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)

  database.run(`CREATE INDEX IF NOT EXISTS idx_category_tags_category_id ON category_tags(category_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_category_tags_tag_id ON category_tags(tag_id)`)

  // Projects table
  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // Add project_id to activities table (migration)
  // Check if column exists first
  const activityColumns = database.exec("PRAGMA table_info(activities)")
  const hasProjectId = activityColumns[0]?.values.some(col => col[1] === 'project_id')
  if (!hasProjectId) {
    database.run(`ALTER TABLE activities ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL`)
  }

  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id)`)

  // Seed default categories if empty
  const result = database.exec('SELECT COUNT(*) as count FROM categories')
  const categoryCount = result[0]?.values[0]?.[0] as number ?? 0

  if (categoryCount === 0) {
    for (const category of DEFAULT_CATEGORIES) {
      database.run(
        `INSERT INTO categories (name, color, rules, is_default) VALUES (?, ?, ?, ?)`,
        [category.name, category.color, JSON.stringify(category.rules), category.isDefault ? 1 : 0]
      )
    }
  }

  // Save database
  saveDatabase()
}

export function saveDatabase(): void {
  if (db && dbPath) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

// Helper to get typed results
export function queryAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
  if (!db) return []
  const stmt = db.prepare(sql)
  stmt.bind(params)

  const results: T[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as T)
  }
  stmt.free()
  return results
}

export function queryOne<T>(sql: string, params: (string | number | null)[] = []): T | null {
  const results = queryAll<T>(sql, params)
  return results[0] ?? null
}

export function run(sql: string, params: (string | number | null)[] = []): void {
  if (!db) return
  db.run(sql, params)
  saveDatabase()
}

/**
 * Execute an INSERT statement and return the last inserted row ID.
 * This gets the ID before saving, which is more reliable with sql.js.
 */
export function runInsert(sql: string, params: (string | number | null)[] = []): number {
  if (!db) return 0
  db.run(sql, params)
  // Get the ID immediately after insert, before saving
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = (result[0]?.values[0]?.[0] as number) ?? 0
  saveDatabase()
  return id
}

export function getLastInsertRowId(): number {
  if (!db) return 0
  const result = db.exec('SELECT last_insert_rowid() as id')
  return (result[0]?.values[0]?.[0] as number) ?? 0
}
