import sqlite3
import json
import os

def init_db(conn):
    print("Initializing database schema...")
    with open('db/schema.sql', 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()

def import_data(conn):
    print("Reading catalog data from wp_catalog.json...")
    with open('wp_catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    cursor = conn.cursor()
    
    # 1. Clear existing data
    cursor.execute("DELETE FROM product_categories")
    cursor.execute("DELETE FROM products")
    cursor.execute("DELETE FROM categories")
    conn.commit()
    
    category_map = {} # Key: (slug, type) -> db_id
    
    def get_or_create_category(name, slug, tax_type):
        key = (slug, tax_type)
        if key in category_map:
            return category_map[key]
            
        cursor.execute(
            "SELECT id FROM categories WHERE slug = ? AND type = ?",
            (slug, tax_type)
        )
        row = cursor.fetchone()
        if row:
            category_map[key] = row[0]
            return row[0]
            
        cursor.execute(
            "INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)",
            (name, slug, tax_type)
        )
        cat_id = cursor.lastrowid
        category_map[key] = cat_id
        return cat_id

    # 2. Process all products
    products_to_import = []
    
    # Meats
    for item in catalog.get('carnes', []):
        products_to_import.append((item, 'carnes_'))
    # Wines
    for item in catalog.get('adega', []):
        products_to_import.append((item, 'adega'))
        
    print(f"Importing {len(products_to_import)} products...")
    
    product_count = 0
    for item, p_type in products_to_import:
        # Convert status to text
        status = item.get('status', 'on')
        if status is True or status == 1 or status == 'on':
            status = 'on'
        else:
            status = 'off'
            
        # Parse price
        price = None
        price_str = item.get('preco')
        if price_str:
            try:
                # Strip currency symbols and replace comma with dot
                price_str = price_str.replace('R$', '').replace('.', '').replace(',', '.').strip()
                price = float(price_str)
            except ValueError:
                pass
                
        # Insert product
        cursor.execute(
            """
            INSERT INTO products (id, title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item.get('id'),
                item.get('title'),
                item.get('slug'),
                item.get('description'),
                item.get('sku'),
                item.get('peso'),
                item.get('unidade_peso'),
                price,
                status,
                item.get('image_url'),
                p_type,
                item.get('pontuacao')
            )
        )
        
        prod_id = item.get('id')
        product_count += 1
        
        # Insert categories and link them
        taxonomies = item.get('taxonomies', {})
        for tax_type, terms in taxonomies.items():
            # Standardize taxonomy type (e.g. sessoes_carnes_, sessoes_vinho_, embalagem_carnes, racas_carnes)
            for term in terms:
                cat_id = get_or_create_category(
                    term.get('name'),
                    term.get('slug'),
                    tax_type
                )
                # Link product to category
                cursor.execute(
                    "INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)",
                    (prod_id, cat_id)
                )
                
    # 3. Seed test sellers
    print("Seeding test sellers...")
    test_sellers = [
        ("Carlos Santos", "carlos", "5524988650462"),
        ("Ana Souza", "ana", "5524988650462"),
        ("Pedro Rocha", "pedro", "5524988650462")
    ]
    for name, slug, phone in test_sellers:
        cursor.execute(
            "INSERT OR IGNORE INTO sellers (name, slug, phone) VALUES (?, ?, ?)",
            (name, slug, phone)
        )
        
    conn.commit()
    print(f"Successfully imported {product_count} products, {len(category_map)} categories and {len(test_sellers)} test sellers.")

def main():
    db_path = 'db/catalog.db'
    
    # Ensure db directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    try:
        init_db(conn)
        import_data(conn)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
