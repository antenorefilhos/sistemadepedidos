const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const filePath = 'D:/Biblioteca/Downloads/catalogo_adega_59_vinhos.md';
  const content = fs.readFileSync(filePath, 'utf8');

  const items = content.split('## Item ').slice(1);
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const item of items) {
    // Regex extractors
    const extract = (regex) => {
      const match = item.match(regex);
      return match ? match[1].trim() : null;
    };

    const eanMatch = item.match(/\*\*EAN \/ Código de Barras:\*\*\s*([0-9]+)/i);
    const ean = eanMatch ? eanMatch[1].trim() : null;
    
    if (!ean) {
      console.log(`Pulo: Sem EAN encontrado no bloco.`);
      continue;
    }

    const produtor = extract(/\*\*Produtor:\*\*\s*(.+)/i);
    const safra = extract(/\*\*Safra \(Ano\):\*\*\s*(.+)/i);
    const uva = extract(/\*\*Uva\(s\):\*\*\s*(.+)/i);
    const origem = extract(/\*\*Região \/ País:\*\*\s*(.+)/i);
    const teor_alcoolico = extract(/\*\*Teor Alcoólico:\*\*\s*(.+)/i);
    const volume = extract(/\*\*Volume:\*\*\s*(.+)/i);
    
    // For amadurecimento, we look for Maturação inside Observações
    const maturacaoMatch = item.match(/\*\*Maturação:\*\*\s*(.+)/i);
    const amadurecimento = maturacaoMatch ? maturacaoMatch[1].trim() : null;

    // Check if the product exists in DB
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, sku')
      .eq('sku', ean);

    if (error) {
      console.error(`Erro ao buscar EAN ${ean}:`, error);
      continue;
    }

    if (!products || products.length === 0) {
      console.log(`❌ Não encontrado no DB: EAN ${ean}`);
      notFoundCount++;
      continue;
    }

    // Update product
    const prodId = products[0].id;
    const updateData = {};
    if (produtor) updateData.produtor = produtor;
    if (safra) updateData.safra = safra;
    if (uva) updateData.uva = uva;
    if (origem) updateData.origem = origem;
    if (teor_alcoolico) updateData.teor_alcoolico = teor_alcoolico;
    if (volume) updateData.volume = volume;
    if (amadurecimento) updateData.amadurecimento = amadurecimento;

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', prodId);

    if (updateError) {
      console.error(`Erro ao atualizar EAN ${ean}:`, updateError);
    } else {
      console.log(`✅ Atualizado: EAN ${ean} - ${products[0].title}`);
      updatedCount++;
    }
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Total Lidos: ${items.length}`);
  console.log(`Atualizados: ${updatedCount}`);
  console.log(`Não Encontrados: ${notFoundCount}`);
}

main().catch(console.error);
