import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export async function POST(request) {
  try {
    const { sessionId, eventType, eventData } = await request.json();

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('telemetry_events')
      .insert([{
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData || {}
      }]);

    if (error) throw error;
    
    // Atualizar last_seen
    await supabase
      .from('telemetry_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry Event Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
