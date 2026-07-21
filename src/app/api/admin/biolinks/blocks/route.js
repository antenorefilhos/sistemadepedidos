import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 1. Criar ou Atualizar Bloco de Biolink
export async function POST(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, biolink_id, type, location_url, settings, sort_order, is_enabled } = body;

    if (!biolink_id || !type) {
      return NextResponse.json({ error: 'biolink_id and type are required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const blockData = {
      biolink_id,
      type,
      location_url,
      settings,
      sort_order: sort_order || 0,
      is_enabled: is_enabled !== undefined ? is_enabled : true
    };

    if (id) {
      blockData.id = id;
    }

    const { data, error } = await supabase
      .from('biolink_blocks')
      .upsert(blockData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Biolinks Blocks POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Excluir Bloco de Biolink
export async function DELETE(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('biolink_blocks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Biolinks Blocks DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Atualizar ordenação em lote (Reordenar arrastando)
export async function PUT(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json(); // Array de objetos { id, sort_order }
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected array of blocks orders' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    // Atualiza ordenamento em lote
    const promises = body.map(item =>
      supabase
        .from('biolink_blocks')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Biolinks Blocks PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
