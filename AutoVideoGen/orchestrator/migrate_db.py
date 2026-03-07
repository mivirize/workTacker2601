"""
Database Migration Script

Extends the existing videos table and creates the workers table.
Enables WAL mode for better concurrent access.
"""
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).parent.parent / "database.db"


def migrate():
    """Run database migrations"""
    print(f"Migrating database: {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Enable WAL mode
    cursor.execute("PRAGMA journal_mode=WAL")
    print("Enabled WAL mode")

    # Check existing columns in videos table
    cursor.execute("PRAGMA table_info(videos)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    print(f"Existing columns: {existing_columns}")

    # Add new columns to videos table if they don't exist
    new_columns = [
        ("assigned_worker_id", "TEXT"),
        ("assigned_at", "DATETIME"),
        ("completed_at", "DATETIME"),
        ("retry_count", "INTEGER DEFAULT 0"),
        ("max_retries", "INTEGER DEFAULT 3"),
        ("error_message", "TEXT"),
        ("lock_version", "INTEGER DEFAULT 0"),
    ]

    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE videos ADD COLUMN {col_name} {col_type}")
                print(f"Added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"Column {col_name} already exists or error: {e}")

    # Create workers table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            hostname TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            current_task_id INTEGER,
            last_heartbeat_at DATETIME,
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_tasks_completed INTEGER DEFAULT 0,
            total_tasks_failed INTEGER DEFAULT 0,
            FOREIGN KEY (current_task_id) REFERENCES videos(id)
        )
    """)
    print("Created workers table")

    # Create task_logs table for auditing
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER NOT NULL,
            worker_id TEXT,
            event_type TEXT NOT NULL,
            event_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id),
            FOREIGN KEY (worker_id) REFERENCES workers(id)
        )
    """)
    print("Created task_logs table")

    # Create indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_videos_assigned_worker ON videos(assigned_worker_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_task_logs_video ON task_logs(video_id)
    """)
    print("Created indexes")

    conn.commit()
    conn.close()

    print("Migration completed successfully!")


if __name__ == "__main__":
    migrate()
