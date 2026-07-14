import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export async function POST(request) {
  try {
    const { visitorId, ip, userAgent } = await request.json();

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Tentar encontrar a sessão existente
    const { data: existingSession, error: searchError } = await supabase
      .from('telemetry_sessions')
      .select('id')
      .eq('visitor_id', visitorId)
      .single();

    if (existingSession) {
      // Atualizar last_seen
      await supabase
        .from('telemetry_sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingSession.id);
      
      return NextResponse.json({ sessionId: existingSession.id });
    } else {
      // Criar nova sessão
      const { data: newSession, error: createError } = await supabase
        .from('telemetry_sessions')
        .insert([{
          visitor_id: visitorId,
          ip_address: ip,
          user_agent: userAgent,
          last_seen: new Date().toISOString()
        }])
        .select('id')
        .single();
        
      if (createError) throw createError;
      return NextResponse.json({ sessionId: newSession.id });
    }
  } catch (error) {
    console.error('Telemetry Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
