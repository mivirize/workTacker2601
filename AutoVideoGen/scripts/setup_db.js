const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    summary TEXT,
    script TEXT,
    status TEXT DEFAULT 'planned', -- planned, created, uploaded
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    console.log('Database initialized at ' + dbPath);
});

db.close();
