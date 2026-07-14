import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const auth = searchParams.get('auth') || request.headers.get('Authorization');
  
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';

  if (auth !== adminPass && auth !== managerPass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Nós pegamos uma amostra simples contando os page_views distintos, add_to_cart e checkout
    const { data: events, error } = await supabase
      .from('telemetry_events')
      .select('fingerprint, event_type');

    if (error) {
      throw error;
    }

    const uniqueVisitors = new Set();
    let addToCartCount = 0;
    let checkoutCount = 0;

    events.forEach(ev => {
      uniqueVisitors.add(ev.fingerprint);
      if (ev.event_type === 'add_to_cart') addToCartCount++;
      if (ev.event_type === 'checkout') checkoutCount++;
    });

    const totalUniqueVisitors = uniqueVisitors.size;
    const cartAbandonmentRate = addToCartCount > 0 
      ? Math.round(((addToCartCount - checkoutCount) / addToCartCount) * 100) 
      : 0;

    return NextResponse.json({
      totalUniqueVisitors,
      addToCartCount,
      checkoutCount,
      cartAbandonmentRate: cartAbandonmentRate > 0 ? cartAbandonmentRate : 0
    });
  } catch (err) {
    console.error('Telemetry Fetch Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
