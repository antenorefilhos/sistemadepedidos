import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        sellers ( name, phone )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) throw itemsError;

    const ordersWithItems = orders.map(order => ({
      ...order,
      seller_name: order.sellers?.name || null,
      seller_phone: order.sellers?.phone || null,
      sellers: undefined,
      items: items.filter(item => item.order_id === order.id)
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, status } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
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
    const orderId = searchParams.get('id');
    if (!orderId) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });

    const supabase = getSupabase();
    // CASCADE on order_items is handled by Supabase FK constraint
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
