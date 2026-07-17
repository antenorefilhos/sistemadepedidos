import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  if (password === adminPass) return 'admin';
  return null;
};

export async function GET(request) {
  try {
    const supabase = getSupabase();
    
    // Check if table exists (this might fail if table is not created yet, so we return defaults)
    const { data, error } = await supabase.from('app_settings').select('*');
    
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json([
          { key: 'company_data', value: { phone: '24988650462', address: 'Estrada União Indústria, 12273 - Itaipava', hours: 'Seg a Sab: 09h às 19h', instagram: '@antenorefilhos', delivery_areas: 'Petrópolis, Itaipava, Nogueira, Corrêas', restaurant_phone: '2422221482', restaurant_address: 'Estrada União Indústria, 12273 - Itaipava', restaurant_hours: 'Qui a Sáb: 12h às 23h' } },
          { key: 'cardapio_images', value: { food: '/images/alacarte.jpg', drinks: '/images/bebidas.jpg' } },
          { key: 'admin_theme', value: { theme: 'light' } }
        ]);
      }
      throw error;
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    const payload = await request.json(); // { key: '...', value: { ... } }

    if (!payload.key || !payload.value) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key: payload.key, value: payload.value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
