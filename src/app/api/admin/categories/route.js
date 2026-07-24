import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: list all categories with product count
export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        product_categories ( product_id )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    const result = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      parent_id: c.parent_id ?? null,
      position: c.position ?? 0,
      products_count: c.product_categories ? c.product_categories.length : 0
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create a new category
export async function POST(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, slug, type, parent_id, position } = await request.json();
    if (!name || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const catData = { name, slug, type, parent_id: parent_id || null, position: position ?? 0 };
    let { error } = await supabase.from('categories').insert(catData);
    // Tolerante: se as colunas de hierarquia ainda não existem (migração não rodada), salva sem elas
    if (error && error.code === '42703') {
      delete catData.parent_id;
      delete catData.position;
      ({ error } = await supabase.from('categories').insert(catData));
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: update category
export async function PUT(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, slug, parent_id, position } = await request.json();
    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const catData = { name, slug };
    if (parent_id !== undefined) catData.parent_id = parent_id || null;
    if (position !== undefined) catData.position = position;
    let { error } = await supabase.from('categories').update(catData).eq('id', id);
    // Tolerante: se as colunas de hierarquia ainda não existem, atualiza só nome/slug
    if (error && error.code === '42703') {
      ({ error } = await supabase.from('categories').update({ name, slug }).eq('id', id));
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: delete category (CASCADE handles product_categories mappings)
export async function DELETE(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    if (!categoryId) return NextResponse.json({ error: 'Missing category ID' }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
