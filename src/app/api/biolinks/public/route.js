import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // 1. Fetch biolink by slug
    const { data: biolink, error: bioError } = await supabase
      .from('biolinks')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (bioError) throw bioError;
    if (!biolink) {
      return NextResponse.json({ error: 'Biolink não encontrado' }, { status: 404 });
    }

    // 2. Fetch associated enabled blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('biolink_blocks')
      .select('*')
      .eq('biolink_id', biolink.id)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    if (blocksError) throw blocksError;

    return NextResponse.json({ biolink, blocks: blocks || [] });
  } catch (err) {
    console.error('Public Biolink GET error:', err);
    return NextResponse.json({ error: 'Erro ao carregar o biolink' }, { status: 500 });
  }
}
