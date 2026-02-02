const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('database.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, title, status FROM videos", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.table(rows);
    }
    db.close();
});
