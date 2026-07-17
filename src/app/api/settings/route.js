import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabase();
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
