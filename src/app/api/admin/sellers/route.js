import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD;
  const managerPass = process.env.MANAGER_PASSWORD;
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();

    // Fetch sellers with order count via Supabase join
    const { data: sellers, error } = await supabase
      .from('sellers')
      .select(`
        *,
        orders ( id )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Map to flat structure with orders_count
    const result = sellers.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      phone: s.phone,
      status: s.status,
      orders_count: s.orders ? s.orders.length : 0
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin sellers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const role = getRole(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { name, phone, slug } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e Telefone são obrigatórios' }, { status: 400 });
    }

    const sellerSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

    const supabase = getSupabase();
    const { error } = await supabase
      .from('sellers')
      .upsert({ name, slug: sellerSlug, phone }, { onConflict: 'slug', ignoreDuplicates: false });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Seller created or updated', slug: sellerSlug });
  } catch (error) {
    console.error('Error creating/updating seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const role = getRole(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (Admin Access Required)' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('id');
    if (!sellerId) return NextResponse.json({ error: 'Missing seller ID' }, { status: 400 });

    const supabase = getSupabase();
    
    // Set seller_id to null in referencing orders to avoid foreign key violations
    await supabase
      .from('orders')
      .update({ seller_id: null })
      .eq('seller_id', sellerId);

    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', sellerId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Seller deleted' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
