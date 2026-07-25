import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Fetch current product to check if it's wine or meat
    const { data: targetProduct } = await supabase
      .from('products')
      .select('id, type, title, description, uva, origem')
      .eq('id', productId)
      .single();

    if (!targetProduct) {
      return NextResponse.json({ pairings: [] });
    }

    const isWine = targetProduct.type === 'adega';
    
    // 2. Query product_pairings table from Supabase
    let query = supabase.from('product_pairings').select(`
      id,
      match_score,
      pairing_notes,
      wine:products!wine_id (id, title, slug, preco, image_url, type, uva, pontuacao),
      meat:products!meat_id (id, title, slug, preco, image_url, type, peso, unidade_peso)
    `);

    if (isWine) {
      query = query.eq('wine_id', productId);
    } else {
      query = query.eq('meat_id', productId);
    }

    const { data: pairingsData, error } = await query.limit(6);

    if (!error && pairingsData && pairingsData.length > 0) {
      const formatted = pairingsData.map(p => ({
        id: p.id,
        score: p.match_score || 95,
        notes: p.pairing_notes || 'Harmonização recomendada pelo sommelier.',
        product: isWine ? p.meat : p.wine
      })).filter(item => item.product !== null);

      if (formatted.length > 0) {
        return NextResponse.json({ pairings: formatted });
      }
    }

    // 3. Smart Fallback Pairing Algorithm if database pairings not yet populated
    const oppositeType = isWine ? 'carnes_' : 'adega';
    const { data: fallbackProducts } = await supabase
      .from('products')
      .select('id, title, slug, preco, image_url, type, peso, unidade_peso, uva, pontuacao')
      .eq('type', oppositeType)
      .eq('status', 'on')
      .limit(4);

    const fallbackPairings = (fallbackProducts || []).map((prod, idx) => ({
      id: `fallback-${prod.id}`,
      score: 95 - (idx * 2),
      notes: isWine 
        ? `Excelente harmonização com o perfil e taninos do ${targetProduct.title}.`
        : `Vinho com estrutura perfeita para acompanhar ${targetProduct.title}.`,
      product: prod
    }));

    return NextResponse.json({ pairings: fallbackPairings });
  } catch (err) {
    console.error('Error fetching pairings:', err);
    return NextResponse.json({ pairings: [] }, { status: 500 });
  }
}
