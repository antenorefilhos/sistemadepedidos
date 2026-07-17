import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('auth') || request.headers.get('Authorization');
    const sessionId = searchParams.get('session_id');
    const adminPass = process.env.ADMIN_PASSWORD;
    
    if (password !== adminPass) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id é obrigatório.' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    // Busca todas as mensagens da sessão em ordem cronológica
    const { data, error } = await supabase
      .from('hermes_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return NextResponse.json({ error: 'Erro ao buscar mensagens no banco.' }, { status: 500 });
    }
    
    return NextResponse.json({ messages: data });
  } catch (error) {
    console.error('Erro na API Hermes Messages (GET):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
