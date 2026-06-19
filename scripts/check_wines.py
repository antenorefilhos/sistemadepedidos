import sqlite3, os, glob

# Find the db file
for pattern in ['db/catalog.db', 'catalog.db', '**/*.db']:
    matches = glob.glob(pattern, recursive=True)
    if matches:
        print(f"Found: {matches}")

db_path = 'db/catalog.db'
if not os.path.exists(db_path):
    db_path = 'catalog.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("\n--- All adega products ---")
cur.execute("SELECT id, title, status, type FROM products WHERE type='adega'")
rows = cur.fetchall()
for r in rows:
    print(f"  ID:{r[0]} | {r[1]} | status:{r[2]} | type:{r[3]}")

print(f"\nTotal adega: {len(rows)}")

print("\n--- Status distribution ---")
cur.execute("SELECT status, COUNT(*) FROM products WHERE type='adega' GROUP BY status")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]}")

conn.close()
