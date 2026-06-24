import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    const { data: seller, error } = await supabase
      .from('sellers')
      .select('id, name, slug, phone, status')
      .eq('slug', slug.toLowerCase())
      .eq('status', 'on')
      .single();

    if (error || !seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 404 });
    }

    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
