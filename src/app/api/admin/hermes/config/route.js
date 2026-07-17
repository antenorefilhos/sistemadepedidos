import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('auth') || request.headers.get('Authorization');
    const adminPass = process.env.ADMIN_PASSWORD;
    
    // Apenas admin tem acesso às configs
    if (password !== adminPass) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const supabase = getSupabase();
    
    // Tenta buscar a configuração (id = 1)
    const { data, error } = await supabase
      .from('hermes_config')
      .select('api_key, system_prompt')
      .eq('id', 1)
      .single();
      
    if (error) {
      // Se a tabela não existir ou estiver vazia, retorna vazio
      return NextResponse.json({ api_key: '', system_prompt: '' });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar configuração do Hermes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('auth') || request.headers.get('Authorization');
    const adminPass = process.env.ADMIN_PASSWORD;
    
    if (password !== adminPass) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { api_key, system_prompt } = await request.json();
    const supabase = getSupabase();
    
    // Upsert na configuração
    const { error } = await supabase
      .from('hermes_config')
      .upsert({ id: 1, api_key, system_prompt, updated_at: new Date().toISOString() });
      
    if (error) {
      console.error('Erro ao salvar no supabase:', error);
      return NextResponse.json({ error: 'Erro ao salvar configuração.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar configuração do Hermes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
