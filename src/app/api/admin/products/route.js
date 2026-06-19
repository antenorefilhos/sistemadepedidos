import { NextResponse } from 'next/server';
import { queryAll, execute, getDb } from '@/lib/db';

const verifyAdmin = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'antenor123';
  return password === expectedPassword;
};

// GET: List all products with their categories
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const auth = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';

  if (auth !== adminPass && auth !== managerPass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch products
    const products = await queryAll("SELECT * FROM products ORDER BY id DESC");
    
    // 2. Fetch category mappings
    const mappings = await queryAll(`
      SELECT pc.product_id, pc.category_id, c.name, c.slug, c.type
      FROM product_categories pc
      JOIN categories c ON pc.category_id = c.id
    `);

    // Map categories to products
    const productsWithCats = products.map(p => {
      const cats = mappings.filter(m => m.product_id === p.id).map(m => ({
        id: m.category_id,
        name: m.name,
        slug: m.slug,
        type: m.type
      }));
      return { ...p, categories: cats };
    });

    return NextResponse.json(productsWithCats);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a product (Admin only)
export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao, categoryIds } = await request.json();

    if (!title || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    try {
      // Insert product
      const res = await db.run(`
        INSERT INTO products (title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [title, slug, description, sku, peso, unidade_peso, preco, status || 'on', image_url, type, pontuacao]);

      const productId = res.lastID;

      // Link categories
      if (categoryIds && Array.isArray(categoryIds)) {
        for (const catId of categoryIds) {
          await db.run("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, catId]);
        }
      }

      await db.run('COMMIT');
      return NextResponse.json({ success: true, productId });
    } catch (dbErr) {
      await db.run('ROLLBACK');
      throw dbErr;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a product (Admin only)
export async function PUT(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { id, title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao, categoryIds } = await request.json();

    if (!id || !title || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    try {
      // Update product details
      await db.run(`
        UPDATE products 
        SET title = ?, slug = ?, description = ?, sku = ?, peso = ?, unidade_peso = ?, preco = ?, status = ?, image_url = ?, type = ?, pontuacao = ?
        WHERE id = ?
      `, [title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao, id]);

      // Delete old category mappings
      await db.run("DELETE FROM product_categories WHERE product_id = ?", [id]);

      // Link new categories
      if (categoryIds && Array.isArray(categoryIds)) {
        for (const catId of categoryIds) {
          await db.run("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [id, catId]);
        }
      }

      await db.run('COMMIT');
      return NextResponse.json({ success: true });
    } catch (dbErr) {
      await db.run('ROLLBACK');
      throw dbErr;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a product (Admin only)
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    try {
      await db.run("DELETE FROM product_categories WHERE product_id = ?", [productId]);
      await db.run("DELETE FROM products WHERE id = ?", [productId]);
      await db.run('COMMIT');
      return NextResponse.json({ success: true });
    } catch (dbErr) {
      await db.run('ROLLBACK');
      throw dbErr;
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
