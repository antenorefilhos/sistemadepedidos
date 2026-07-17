import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('auth') || request.headers.get('Authorization');
    const adminPass = process.env.ADMIN_PASSWORD;
    
    if (password !== adminPass) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const supabase = getSupabase();
    
    // Busca todas as sessões ordenadas pela última atualização (mais recentes primeiro)
    const { data, error } = await supabase
      .from('hermes_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar sessões:', error);
      return NextResponse.json({ error: 'Erro ao buscar sessões no banco.' }, { status: 500 });
    }
    
    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error('Erro na API Hermes Sessions (GET):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request) {
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
    
    // Deleta a sessão (o CASCADE no banco de dados deve deletar as mensagens atreladas, se configurado, ou deletamos manual)
    // Para garantir limpeza sem CASCADE (se o usuário não usou CASCADE no SQL):
    await supabase.from('hermes_messages').delete().eq('session_id', sessionId);
    
    const { error } = await supabase
      .from('hermes_sessions')
      .delete()
      .eq('id', sessionId);
      
    if (error) {
      console.error('Erro ao deletar sessão:', error);
      return NextResponse.json({ error: 'Erro ao deletar sessão no banco.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API Hermes Sessions (DELETE):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
