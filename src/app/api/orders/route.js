import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import nodemailer from 'nodemailer';
import { generateEmailHtml } from './emailTemplate';

export const dynamic = 'force-dynamic';

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    console.warn('SMTP credentials not configured. Email notifications will be skipped.');
    return null;
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_whatsapp,
      customer_email,
      customer_address,
      notes,
      seller_id,
      fingerprint,
      delivery_date,
      delivery_period,
      items
    } = body;

    if (!customer_name || !customer_whatsapp) {
      return NextResponse.json({ error: 'Nome e WhatsApp são obrigatórios' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Pedido deve ter ao menos um item' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_whatsapp,
        customer_email: customer_email || null,
        customer_address: customer_address || null,
        notes: notes || null,
        seller_id: seller_id || null,
        fingerprint: fingerprint || null,
        delivery_date: delivery_date || null,
        delivery_period: delivery_period || null
      })
      .select('id')
      .single();

    if (orderError) throw orderError;
    const orderId = order.id;

    // 2. Insert items
    const itemsPayload = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      product_title: item.title,
      sku: item.sku || null,
      quantity: item.quantity,
      price: item.price || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsPayload);

    if (itemsError) throw itemsError;

    // 3. Fetch seller details if any
    let seller = null;
    if (seller_id) {
      const { data } = await supabase
        .from('sellers')
        .select('id, name, phone')
        .eq('id', seller_id)
        .single();
      seller = data;
    }

    // 4. Send Email Notification in the background
    const transporter = createTransporter();
    if (transporter) {
      sendEmailNotification(transporter, {
        orderId,
        customer_name,
        customer_whatsapp,
        customer_email,
        customer_address,
        notes,
        seller,
        delivery_date,
        delivery_period,
        items
      }).catch(err => console.error('Error sending order email:', err));
    }

    return NextResponse.json({ success: true, orderId, seller });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendEmailNotification(transporter, order) {
  const adminEmail = process.env.SMTP_USER;
  const notifyEmail = process.env.NOTIFICATION_EMAIL || adminEmail;
  if (!notifyEmail) return;

  const sellerText = order.seller
    ? `<tr><td><b>Vendedor:</b></td><td>${order.seller.name} (${order.seller.phone})</td></tr>`
    : `<tr><td><b>Vendedor:</b></td><td>Nenhum (Site Direto)</td></tr>`;

  const htmlContent = generateEmailHtml(order, sellerText);

  await transporter.sendMail({
    from: `"Orçamentos Antenor e Filhos" <${adminEmail}>`,
    to: notifyEmail,
    subject: `Novo Orçamento #${order.orderId} - ${order.customer_name}`,
    html: htmlContent
  });
}
