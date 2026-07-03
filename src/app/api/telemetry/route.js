import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fingerprint, event_type, event_data, page_url } = body;

    if (!fingerprint || !event_type) {
      return NextResponse.json({ error: 'Fingerprint and event_type are required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('telemetry_events')
      .insert({
        fingerprint,
        event_type,
        event_data: event_data || {},
        page_url: page_url || null
      });

    if (error) {
      console.error('Telemetry Insert Error:', error);
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telemetry Route Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
