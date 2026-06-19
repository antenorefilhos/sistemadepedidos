-- SQLite Schema for Antenor e Filhos Product Catalog and Order Registry

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    peso TEXT,
    unidade_peso TEXT,
    preco REAL,
    status TEXT DEFAULT 'on',
    image_url TEXT,
    type TEXT NOT NULL, -- 'carnes_' or 'adega'
    pontuacao TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL, -- 'sessoes_carnes_', 'sessoes_vinho_', 'embalagem_carnes', 'racas_carnes'
    UNIQUE(slug, type)
);

CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL, -- WhatsApp phone number (e.g., 5524988650462)
    status TEXT DEFAULT 'on' -- 'on' or 'off'
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT,
    notes TEXT,
    seller_id INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    product_title TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug);
