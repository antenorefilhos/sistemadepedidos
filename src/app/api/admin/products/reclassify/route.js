import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: adiciona ou remove categorias de vários produtos de uma vez.
// body: { productIds: number[], categoryIds: number[], action: 'add' | 'remove' }
export async function POST(request) {
  if (getRole(request) !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productIds, categoryIds, action } = await request.json();

    if (
      !Array.isArray(productIds) || productIds.length === 0 ||
      !Array.isArray(categoryIds) || categoryIds.length === 0 ||
      !['add', 'remove'].includes(action)
    ) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const supabase = getSupabase();

    if (action === 'remove') {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .in('product_id', productIds)
        .in('category_id', categoryIds);
      if (error) throw error;
    } else {
      // add: insere apenas os vínculos que ainda não existem (evita duplicados sem depender de constraint)
      const { data: existing } = await supabase
        .from('product_categories')
        .select('product_id, category_id')
        .in('product_id', productIds)
        .in('category_id', categoryIds);

      const existingSet = new Set((existing || []).map((e) => `${e.product_id}:${e.category_id}`));
      const toInsert = [];
      productIds.forEach((pid) => {
        categoryIds.forEach((cid) => {
          if (!existingSet.has(`${pid}:${cid}`)) toInsert.push({ product_id: pid, category_id: cid });
        });
      });

      if (toInsert.length > 0) {
        const { error } = await supabase.from('product_categories').insert(toInsert);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reclassifying products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
