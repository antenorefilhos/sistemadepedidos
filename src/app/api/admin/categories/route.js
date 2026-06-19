import { NextResponse } from 'next/server';
import { queryAll, execute, getDb } from '@/lib/db';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
  
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

const verifyAdmin = (request) => {
  const role = getRole(request);
  return role === 'admin';
};

// GET: list all categories with their products count
export async function GET(request) {
  const role = getRole(request);
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await queryAll(`
      SELECT c.*, COUNT(pc.product_id) as products_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create a new category (Admin only)
export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { name, slug, type } = await request.json();
    if (!name || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await execute(
      "INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)",
      [name, slug, type]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: update category (Admin only)
export async function PUT(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { id, name, slug } = await request.json();
    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await execute(
      "UPDATE categories SET name = ?, slug = ? WHERE id = ?",
      [name, slug, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: delete category and its mappings (Admin only)
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    if (!categoryId) {
      return NextResponse.json({ error: 'Missing category ID' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    try {
      await db.run("DELETE FROM product_categories WHERE category_id = ?", [categoryId]);
      await db.run("DELETE FROM categories WHERE id = ?", [categoryId]);
      await db.run('COMMIT');
      return NextResponse.json({ success: true });
    } catch (dbErr) {
      await db.run('ROLLBACK');
      throw dbErr;
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
