const fs = require('fs');
const { getSupabase } = require('./src/lib/pgDb');

async function main() {
  const supabase = getSupabase();
  const txt = fs.readFileSync('D:/Biblioteca/Downloads/catalogo_adega_59_vinhos.md', 'utf8');
  
  const items = txt.split('## Item ').slice(1);
  let updatedCount = 0;

  for (const item of items) {
    const eanMatch = item.match(/EAN \/ C[\wó]+digo de Barras:\*\*\s*(\d+)/i);
    const destMatch = item.match(/\*\*Observa[\wçõ]+es de Destaque:\*\*\s*([\s\S]*)/i);
    
    if (!eanMatch || !destMatch) continue;
    
    // Fix item 31 EAN typo fallback just in case
    let ean = eanMatch[1];
    if (ean === '7894450090492') ean = '7794450090492';

    // Parse description until the end of the item (marked by --- or next ##)
    let destaquesRaw = destMatch[1].split('---')[0].trim();
    
    let htmlLines = destaquesRaw.split('\n').map(line => line.trim()).filter(Boolean);
    
    // We can filter out 'Maturação' and 'Pontuação' if we want, but keeping them is fine too as it reads like a nice narrative.
    let formattedHtml = htmlLines.map(line => {
      line = line.replace(/^-\s*/, ''); // remove leading dash
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // bold to HTML
      return '<p style="margin-bottom: 8px;">' + line + '</p>';
    }).join('');
    
    if (formattedHtml) {
      const { data, error } = await supabase
        .from('products')
        .update({ description: formattedHtml })
        .eq('sku', ean)
        .select('id');
        
      if (data && data.length > 0) {
        updatedCount++;
      }
    }
  }

  console.log(`Finalizado! ${updatedCount} produtos tiveram suas informações de destaque recuperadas e inseridas no Sobre o Vinho.`);
}

main();
