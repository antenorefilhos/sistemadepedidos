import { NextResponse } from 'next/server';
import { getSql } from '@/lib/pgDb';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Setup email transporter using environment variables or a fallback
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

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
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
      items
    } = body;

    // Validation
    if (!customer_name || !customer_whatsapp) {
      return NextResponse.json({ error: 'Name and WhatsApp are required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    const sql = getSql();

    // 1. Insert order
    const orderRows = await sql`
      INSERT INTO orders (customer_name, customer_whatsapp, customer_email, customer_address, notes, seller_id)
      VALUES (
        ${customer_name},
        ${customer_whatsapp},
        ${customer_email || null},
        ${customer_address || null},
        ${notes || null},
        ${seller_id || null}
      )
      RETURNING id
    `;
    const orderId = orderRows[0].id;

    // 2. Insert items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_title, sku, quantity, price)
        VALUES (
          ${orderId},
          ${item.product_id},
          ${item.title},
          ${item.sku || null},
          ${item.quantity},
          ${item.price || null}
        )
      `;
    }

    // 3. Fetch seller details if any
    let seller = null;
    if (seller_id) {
      const sellerRows = await sql`
        SELECT id, name, phone FROM sellers WHERE id = ${seller_id}
      `;
      seller = sellerRows[0] || null;
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
        items
      }).catch(err => console.error('Error sending order email:', err));
    }

    return NextResponse.json({
      success: true,
      orderId,
      seller
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Function to compile HTML and send the email
async function sendEmailNotification(transporter, order) {
  const adminEmail = process.env.SMTP_USER;
  const notifyEmail = process.env.NOTIFICATION_EMAIL || adminEmail;

  if (!notifyEmail) return;

  const sellerText = order.seller
    ? `<tr><td><b>Vendedor:</b></td><td>${order.seller.name} (${order.seller.phone})</td></tr>`
    : `<tr><td><b>Vendedor:</b></td><td>Nenhum (Site Direto)</td></tr>`;

  const itemsRows = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.sku || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #bc9c5f; text-align: center; border-bottom: 2px solid #bc9c5f; padding-bottom: 10px;">
        Novo Orçamento Recebido - #${order.orderId}
      </h2>
      
      <h3 style="color: #333;">Dados do Cliente</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="width: 120px; font-weight: bold;">Nome:</td><td>${order.customer_name}</td></tr>
        <tr><td style="font-weight: bold;">WhatsApp:</td><td>${order.customer_whatsapp}</td></tr>
        <tr><td style="font-weight: bold;">Email:</td><td>${order.customer_email || 'Não informado'}</td></tr>
        <tr><td style="font-weight: bold;">Endereço:</td><td>${order.customer_address || 'Não informado'}</td></tr>
        <tr><td style="font-weight: bold;">Observações:</td><td>${order.notes || 'Nenhuma'}</td></tr>
        ${sellerText}
      </table>
      
      <h3 style="color: #333;">Itens do Pedido</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Produto</th>
            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">EAN/SKU</th>
            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center; width: 80px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        Este é um e-mail automático gerado pelo sistema de Orçamentos de Antenor e Filhos.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Orçamentos Antenor e Filhos" <${adminEmail}>`,
    to: notifyEmail,
    subject: `Novo Orçamento #${order.orderId} - ${order.customer_name}`,
    html: htmlContent
  });
}
