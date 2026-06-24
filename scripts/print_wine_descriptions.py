import sqlite3

def main():
    conn = sqlite3.connect('db/catalog.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, description FROM products WHERE type = 'adega'")
    rows = cursor.fetchall()
    for row in rows:
        print("="*60)
        print(f"ID: {row[0]} | Title: {row[1]}")
        print("Description:")
        print(row[2])
    conn.close()

if __name__ == '__main__':
    main()
