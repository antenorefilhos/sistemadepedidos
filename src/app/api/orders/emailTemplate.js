export function generateEmailHtml(order, sellerText) {
  const itemsRows = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.sku || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #ab9070; text-align: center; border-bottom: 2px solid #ab9070; padding-bottom: 10px;">
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
        <tbody>${itemsRows}</tbody>
      </table>
      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        Este é um e-mail automático gerado pelo sistema de Orçamentos de Antenor e Filhos.
      </p>
    </div>
  `;
}
