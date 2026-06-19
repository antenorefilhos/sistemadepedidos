import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    const seller = await queryOne(
      "SELECT id, name, slug, phone, status FROM sellers WHERE slug = ? AND status = 'on'",
      [slug.toLowerCase()]
    );

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 404 });
    }

    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
