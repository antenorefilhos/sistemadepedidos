const fs = require('fs');
const filePath = 'src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /printWindow\.document\.write\(\`[\s\S]*?\`\);/;
const replacement = `printWindow.document.write(\`
      <html>
        <head>
          <title>Recibo - Pedido #\${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; background-color: #fff; }
            h2 { text-align: center; margin: 5px 0; font-size: 18px; }
            p { font-size: 12px; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>ANTENOR & FILHOS</h2>
          <p style="text-align: center;">Estrada União Indústria, 12273 - Itaipava</p>
          <div class="divider"></div>
          <p><b>Pedido:</b> #\${order.id}</p>
          <p><b>Data:</b> \${formatDate(order.created_at)}</p>
          <p><b>Cliente:</b> \${order.customer_name}</p>
          <p><b>WhatsApp:</b> \${order.customer_whatsapp}</p>
          \${order.customer_address ? \\\`<p><b>Entrega:</b> \${order.customer_address}</p>\\\` : ''}
          <p><b>Atendente:</b> \${order.seller_name || 'Site Direto'}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; font-size: 11px;">Item</th>
                <th style="text-align: right; font-size: 11px;">Total</th>
              </tr>
            </thead>
            <tbody>
              \${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <p class="total">Total Estimado: <span style="font-size: 11px; font-weight: normal;">R$</span> \${totalStr}</p>
          \${order.notes ? \\\`<p style="font-size: 11px; margin-top: 10px;"><b>Obs:</b> \${order.notes}</p>\\\` : ''}
          <div class="divider"></div>
          <p style="text-align: center; font-size: 10px;">Obrigado pela preferência!</p>
        </body>
      </html>
    \`);`;
content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Restored printWindow.document.write');
