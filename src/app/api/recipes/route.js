import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    // Se passarmos um productId, queremos buscar as receitas que contêm esse ID no JSON array 'related_products'
    if (productId) {
      query = query.contains('related_products', [String(productId)]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
