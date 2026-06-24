import { NextResponse } from 'next/server';
import { getSql } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  if (password === adminPass) return 'admin';
  return null;
};

export async function POST(request) {
  const role = getRole(request);
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getSql();

    // Create sellers table
    await sql`
      CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        status TEXT DEFAULT 'on'
      )
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_whatsapp TEXT NOT NULL,
        customer_email TEXT,
        customer_address TEXT,
        notes TEXT,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create order_items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_title TEXT NOT NULL,
        sku TEXT,
        quantity INTEGER NOT NULL,
        price NUMERIC
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`;

    return NextResponse.json({
      success: true,
      message: 'Tabelas criadas/verificadas com sucesso no Postgres!'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
