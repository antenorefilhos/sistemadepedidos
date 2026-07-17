import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'Aef@1945*';
  if (password === adminPass) return 'admin';
  return null;
};

// The SQL to run in Supabase SQL Editor (for reference)
// This endpoint just validates the connection and seeds initial sellers.
export async function POST(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();

    // Test connection by querying sellers table
    const { data, error } = await supabase.from('sellers').select('count').limit(1);
    if (error) throw error;

    // Seed the 10 sellers if not already present
    const sellers = [
      { name: 'Débora',   slug: 'debora',   phone: '5524992200191' },
      { name: 'Rose',     slug: 'rose',     phone: '5524992915221' },
      { name: 'Maria',    slug: 'maria',    phone: '5524988466860' },
      { name: 'Junior',   slug: 'junior',   phone: '5524992922869' },
      { name: 'Odair',    slug: 'odair',    phone: '5524981149339' },
      { name: 'Levi',     slug: 'levi',     phone: '5524992287221' },
      { name: 'Jonathan', slug: 'jonathan', phone: '5524993044572' },
      { name: 'Márcio',   slug: 'marcio',   phone: '5524988139287' },
      { name: 'Filipe',   slug: 'filipe',   phone: '5524999242588' },
      { name: 'Thais',    slug: 'thais',    phone: '5524992328619' },
    ];

    const { error: seedError } = await supabase
      .from('sellers')
      .upsert(sellers, { onConflict: 'slug', ignoreDuplicates: true });

    if (seedError) throw seedError;

    return NextResponse.json({
      success: true,
      message: 'Conexão OK! Vendedores inseridos/verificados com sucesso.'
    });
  } catch (error) {
    console.error('Migrate/seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
