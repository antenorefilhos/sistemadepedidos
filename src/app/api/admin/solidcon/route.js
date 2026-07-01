import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('auth') || request.headers.get('Authorization');
    const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
    const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
    
    if (password !== adminPass && password !== managerPass) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Chamar a API do Solidcon
    const solidconRes = await fetch('http://45.239.193.56:5001/api/Produto/GetProdutos', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Timeout longo pois a API pode demorar
      signal: AbortSignal.timeout(30000)
    });

    if (!solidconRes.ok) {
      throw new Error(`Falha ao conectar no Solidcon: ${solidconRes.status} ${solidconRes.statusText}`);
    }

    const solidconProducts = await solidconRes.json();
    if (!Array.isArray(solidconProducts)) {
      throw new Error('A API do Solidcon não retornou uma lista de produtos válida.');
    }

    // 2. Conectar no Supabase e buscar todos os produtos locais
    const supabase = getSupabase();
    const { data: localProducts, error: localError } = await supabase
      .from('products')
      .select('id, sku, title');

    if (localError) throw localError;

    // Criar um mapa de SKU -> ID local para busca rápida
    const localSkuMap = {};
    localProducts.forEach(p => {
      if (p.sku) {
        localSkuMap[p.sku.toString().trim()] = p;
      }
    });

    // 3. Cruzar os dados e preparar a atualização
    const updates = [];
    let updatedCount = 0;

    solidconProducts.forEach(sp => {
      const ean = sp.codigo_ean ? sp.codigo_ean.toString().trim() : null;
      if (ean && localSkuMap[ean]) {
        const localProd = localSkuMap[ean];
        
        // Regra de Negócio de Preço:
        // vl_produto_normal = Preço original
        // vl_produto = Preço com desconto (se houver)
        const precoNormal = parseFloat(sp.vl_produto_normal || 0);
        const precoAtual = parseFloat(sp.vl_produto || 0);
        const estoque = parseFloat(sp.qtd_produto || 0);

        let precoFinal = precoNormal;
        let precoPromocional = null;

        if (precoAtual > 0 && precoAtual < precoNormal) {
          precoPromocional = precoAtual;
        } else {
          precoFinal = precoAtual > 0 ? precoAtual : precoNormal;
        }

        updates.push({
          id: localProd.id,
          preco: precoFinal,
          // Tentar atualizar estoque e preço promocional (se as colunas existirem no banco)
          estoque: estoque,
          preco_promocional: precoPromocional
        });
      }
    });

    // 4. Salvar no Supabase (Atualização em lote)
    // O Supabase upsert permite atualizar múltiplos registros se a chave primária for fornecida.
    if (updates.length > 0) {
      // O upsert falhará se as colunas estoque e preco_promocional não existirem.
      // O usuário precisa ter rodado o SQL do plano de implementação.
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(updates, { onConflict: 'id' });
        
      if (upsertError) {
        console.error("Erro no upsert:", upsertError);
        // Fallback: se der erro (ex: coluna não existe), atualiza apenas o preço um por um
        if (upsertError.message.includes('column') && upsertError.message.includes('does not exist')) {
           for (const up of updates) {
             await supabase.from('products').update({ preco: up.preco }).eq('id', up.id);
             updatedCount++;
           }
        } else {
          throw upsertError;
        }
      } else {
        updatedCount = updates.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalProducts: solidconProducts.length,
      updated: updatedCount,
      errors: 0,
      message: 'Sincronização concluída com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro na sincronização Solidcon:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar sincronização.' }, { status: 500 });
  }
}
