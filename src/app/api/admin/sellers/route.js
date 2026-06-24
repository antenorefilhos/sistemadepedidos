import { NextResponse } from 'next/server';
import { getSql } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
  
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

export async function GET(request) {
  const role = getRole(request);
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getSql();
    const sellers = await sql`
      SELECT 
        s.*,
        COUNT(o.id)::int as orders_count
      FROM sellers s
      LEFT JOIN orders o ON s.id = o.seller_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `;

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Error fetching admin sellers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const role = getRole(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { name, phone, slug } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
    }

    const sellerSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
          .replace(/[^a-z0-9]+/g, '-');

    const sql = getSql();
    await sql`
      INSERT INTO sellers (name, slug, phone)
      VALUES (${name}, ${sellerSlug}, ${phone})
      ON CONFLICT (slug) DO NOTHING
    `;

    return NextResponse.json({ success: true, message: 'Seller created', slug: sellerSlug });
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const role = getRole(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('id');

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing seller ID' }, { status: 400 });
    }

    const sql = getSql();
    await sql`DELETE FROM sellers WHERE id = ${sellerId}`;

    return NextResponse.json({ success: true, message: 'Seller deleted' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
