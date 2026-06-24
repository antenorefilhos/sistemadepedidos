import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('products')
      .select(`
        id, title, slug, description, sku, peso, unidade_peso, preco, image_url, type, pontuacao, status,
        product_categories (
          categories ( id, name, slug, type )
        )
      `)
      .eq('status', 'on')
      .order('id', { ascending: true });

    if (type) query = query.eq('type', type);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    // Flatten categories
    let result = products.map(p => {
      const categories = (p.product_categories || [])
        .map(pc => pc.categories)
        .filter(Boolean);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        sku: p.sku,
        peso: p.peso,
        unidade_peso: p.unidade_peso,
        preco: p.preco,
        image_url: p.image_url,
        type: p.type,
        pontuacao: p.pontuacao,
        categories
      };
    });

    // Filter by category slug if requested
    if (category) {
      result = result.filter(p =>
        p.categories.some(c => c.slug?.toLowerCase() === category.toLowerCase())
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
