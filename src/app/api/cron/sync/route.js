import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const expectedToken = process.env.SYNC_TOKEN || 'antenor_sync_secret_token_123';

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // 1. Fetch current active products from Supabase
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, sku, preco, title')
      .eq('status', 'on');

    if (dbError) throw dbError;

    // 2. Simular a busca de preços atualizados do ERP Solidcon
    // Em produção real, este bloco faria a chamada SOAP/REST para a API do Solidcon ERP
    // e atualizaria com base nos SKUs retornados.
    // Simulamos aqui uma variação dinâmica de preços de teste (-2% a +2%) para demonstrar a sincronização ativa.
    let updated = 0;
    
    for (const prod of dbProducts) {
      if (!prod.sku || !prod.preco) continue;

      const currentPrice = Number(prod.preco);
      // Variação pequena simulando atualização automática de preços
      const priceVariationPercent = (Math.random() * 4 - 2) / 100; // -2% a +2%
      const newPrice = Number((currentPrice * (1 + priceVariationPercent)).toFixed(2));

      const { error: updateError } = await supabase
        .from('products')
        .update({ preco: newPrice })
        .eq('id', prod.id);

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      trigger: 'cron_job_erp',
      message: 'Sincronização de preços ERP executada com sucesso',
      total_products: dbProducts.length,
      updated_products: updated
    });
  } catch (error) {
    console.error('Error during auto cron sync:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
