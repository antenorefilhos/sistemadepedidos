import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();

    // 1. Fetch all orders, order items and customer notes
    const [ordersResult, itemsResult, notesResult] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('customer_notes').select('*')
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (itemsResult.error) throw itemsResult.error;
    if (notesResult.error) throw notesResult.error;

    const orders = ordersResult.data;
    const items = itemsResult.data;
    const notes = notesResult.data;

    // 2. Aggregate in-memory
    const customersMap = {};

    orders.forEach(order => {
      const wa = order.customer_whatsapp;
      if (!wa) return;

      const orderItems = items.filter(it => it.order_id === order.id);
      const orderTotal = orderItems.reduce((sum, item) => item.price ? sum + (item.price * item.quantity) : sum, 0);

      if (!customersMap[wa]) {
        customersMap[wa] = {
          whatsapp: wa,
          name: order.customer_name,
          email: order.customer_email || '',
          address: order.customer_address || '',
          total_orders: 0,
          total_spent: 0,
          last_order_at: order.created_at,
          notes: ''
        };
      }

      customersMap[wa].total_orders += 1;
      customersMap[wa].total_spent += orderTotal;

      if (new Date(order.created_at) > new Date(customersMap[wa].last_order_at)) {
        customersMap[wa].last_order_at = order.created_at;
        customersMap[wa].name = order.customer_name;
        if (order.customer_email) customersMap[wa].email = order.customer_email;
        if (order.customer_address) customersMap[wa].address = order.customer_address;
      }
    });

    // Merge notes
    notes.forEach(n => {
      if (customersMap[n.whatsapp]) {
        customersMap[n.whatsapp].notes = n.notes || '';
      } else {
        // Fallback case: note exists but no orders (e.g. legacy/manually created)
        customersMap[n.whatsapp] = {
          whatsapp: n.whatsapp,
          name: 'Cliente S/ Pedido',
          email: '',
          address: '',
          total_orders: 0,
          total_spent: 0,
          last_order_at: n.created_at,
          notes: n.notes || ''
        };
      }
    });

    const customersList = Object.values(customersMap).sort((a, b) => b.total_spent - a.total_spent); // Order by spent

    return NextResponse.json(customersList);
  } catch (error) {
    console.error('Error fetching admin customers aggregation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { whatsapp, notes } = await request.json();

    if (!whatsapp) {
      return NextResponse.json({ error: 'Missing whatsapp identifier' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('customer_notes')
      .upsert({
        whatsapp,
        notes: notes || '',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Customer notes saved successfully' });
  } catch (error) {
    console.error('Error saving customer notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
