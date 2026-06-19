import sqlite3

conn = sqlite3.connect('db/catalog.db')
conn.execute("UPDATE products SET status='on' WHERE type='adega'")
conn.commit()
print(f"Updated {conn.total_changes} wines to status='on'")

# Verify
cur = conn.cursor()
cur.execute("SELECT id, title, status FROM products WHERE type='adega'")
for r in cur.fetchall():
    print(f"  ID:{r[0]} | {r[1]} | status:{r[2]}")

conn.close()
