import { NextResponse } from 'next/server';
import { getSql } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

// Simple password verification from header or search param
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
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getSql();

    // Fetch all orders with seller info
    const orders = await sql`
      SELECT 
        o.*,
        s.name as seller_name,
        s.phone as seller_phone
      FROM orders o
      LEFT JOIN sellers s ON o.seller_id = s.id
      ORDER BY o.created_at DESC
    `;

    // Fetch all items
    const items = await sql`SELECT * FROM order_items`;

    // Map items to orders
    const ordersWithItems = orders.map(order => {
      const orderItems = items.filter(item => item.order_id === order.id);
      return {
        ...order,
        items: orderItems
      };
    });

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const role = getRole(request);
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const sql = getSql();
    await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;

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

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const sql = getSql();
    // CASCADE delete handles order_items automatically (FK constraint)
    await sql`DELETE FROM orders WHERE id = ${orderId}`;

    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
