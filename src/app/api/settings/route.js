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
          { key: 'company_data', value: { phone: '2422221482', address: 'Estrada União Indústria, 12273 - Itaipava', hours: 'Seg a Sab: 09h às 19h', instagram: '@antenorefilhos' } },
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
