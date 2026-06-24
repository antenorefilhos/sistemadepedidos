import { NextResponse } from 'next/server';
import { getSql } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, name, slug, phone, status
      FROM sellers
      WHERE slug = ${slug.toLowerCase()} AND status = 'on'
    `;

    const seller = rows[0] || null;

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 404 });
    }

    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
