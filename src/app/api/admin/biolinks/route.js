import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 1. Listar ou obter detalhes de biolinks e blocos
export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  try {
    const supabase = getSupabase();

    if (id || slug) {
      let query = supabase.from('biolinks').select('*');
      if (id) query = query.eq('id', id);
      if (slug) query = query.eq('slug', slug);
      
      const { data: biolink, error } = await query.maybeSingle();
      if (error) throw error;
      if (!biolink) return NextResponse.json({ error: 'Biolink not found' }, { status: 404 });

      // Buscar blocos associados
      const { data: blocks, error: blocksError } = await supabase
        .from('biolink_blocks')
        .select('*')
        .eq('biolink_id', biolink.id)
        .order('sort_order', { ascending: true });

      if (blocksError) throw blocksError;

      return NextResponse.json({ ...biolink, blocks });
    }

    // Listar todos os biolinks
    const { data: biolinks, error } = await supabase
      .from('biolinks')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json(biolinks);
  } catch (err) {
    console.error('Biolinks GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Criar ou atualizar configurações do Biolink principal
export async function POST(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, slug, title, description, background_color_one, background_color_two, text_color, favicon_url } = body;

    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = getSupabase();
    
    const biolinkData = {
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''),
      title,
      description,
      background_color_one,
      background_color_two,
      text_color,
      favicon_url
    };

    if (id) {
      biolinkData.id = id;
    }

    const { data, error } = await supabase
      .from('biolinks')
      .upsert(biolinkData, { onConflict: 'slug' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Biolinks POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Excluir Biolink completo e seus blocos
export async function DELETE(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('biolinks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Biolinks DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
