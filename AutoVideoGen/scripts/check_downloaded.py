"""
Check downloaded videos in the database.
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent.parent / "database.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# First, check the schema
cursor.execute("PRAGMA table_info(videos)")
columns = cursor.fetchall()
print("Database schema:")
print("=" * 60)
for col in columns:
    print(f"  {col[1]} ({col[2]})")
print()

# Check downloaded videos
cursor.execute("""
    SELECT * FROM videos WHERE status = 'downloaded' ORDER BY id
""")
rows = cursor.fetchall()

print(f"Downloaded videos: {len(rows)}")
print("=" * 60)
for row in rows:
    print(f"ID {row[0]}: {row[1][:50] if len(row) > 1 else 'N/A'}...")
    print(f"  Full row: {row}")
    print()

conn.close()
