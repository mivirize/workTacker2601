import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# テーブル名を確認
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print('Tables:')
for t in tables:
    print(f'  - {t[0]}')

# videosテーブルの構造を確認
print('\nVideos table schema:')
cursor.execute('PRAGMA table_info(videos)')
columns = cursor.fetchall()
for col in columns:
    print(f'  - {col[1]} ({col[2]})')

# 最新の動画を確認
print('\nRecent videos:')
cursor.execute('SELECT id, status, title, file_path FROM videos ORDER BY id DESC LIMIT 10')
rows = cursor.fetchall()
print('ID | Status | Title | File Path')
print('-' * 100)
for r in rows:
    print(f'{r[0]} | {r[1]} | {r[2][:50] if r[2] else "N/A"} | {r[3][:80] if r[3] else "N/A"}')

# downloadedステータスの動画を確認
print('\nDownloaded videos:')
cursor.execute('SELECT id, status, title, file_path FROM videos WHERE status="downloaded" ORDER BY id')
rows = cursor.fetchall()
print('ID | Status | Title | File Path')
print('-' * 100)
for r in rows:
    print(f'{r[0]} | {r[1]} | {r[2][:50] if r[2] else "N/A"} | {r[3][:80] if r[3] else "N/A"}')

# task_logsテーブルの構造を確認
print('\nTask logs table schema:')
cursor.execute('PRAGMA table_info(task_logs)')
columns = cursor.fetchall()
for col in columns:
    print(f'  - {col[1]} ({col[2]})')

# 最新のタスクログを確認
print('\nRecent task logs:')
cursor.execute('SELECT * FROM task_logs ORDER BY id DESC LIMIT 20')
rows = cursor.fetchall()
for r in rows:
    print(f'{r}')

conn.close()
