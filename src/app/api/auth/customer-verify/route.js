import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { verifyAccessToken, normalizePhone, phonesMatch } from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { token } = await req.json();
    const phone = verifyAccessToken(token);
    if (!phone) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Solicite um novo acesso.' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, customer_name, customer_whatsapp, created_at, status')
      .order('created_at', { ascending: false })
      .limit(2000);

    // Filtra apenas os pedidos do próprio telefone verificado.
    const mine = (allOrders || []).filter((o) => phonesMatch(o.customer_whatsapp, phone));
    const orderIds = mine.map((o) => o.id);

    let itemsByOrder = {};
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_id, product_title, quantity, price')
        .in('order_id', orderIds);
      (items || []).forEach((it) => {
        (itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || []).push(it);
      });
    }

    const orders = mine.map((o) => {
      const items = itemsByOrder[o.id] || [];
      const total = items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
        0
      );
      return {
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total,
        items: items.map((it) => ({
          product_id: it.product_id,
          title: it.product_title,
          quantity: it.quantity,
          price: it.price,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      name: mine[0]?.customer_name || null,
      phone,
      orders,
    });
  } catch (err) {
    console.error('customer-verify error:', err);
    return NextResponse.json({ error: 'Falha ao validar acesso.' }, { status: 500 });
  }
}
