import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization') || new URL(request.url).searchParams.get('auth');
    const expectedToken = process.env.SYNC_TOKEN || 'antenor_sync_secret_token_123';
    
    // Suportar Bearer Token ou parâmetro manual
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Chamar a API do Solidcon (Endereço e parâmetros oficiais da loja)
    const solidconRes = await fetch('http://45.239.193.56:5001/api/Produto/GetProdutos', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
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
      .select('id, sku');

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

    solidconProducts.forEach(sp => {
      const ean = sp.codigo_ean ? sp.codigo_ean.toString().trim() : null;
      if (ean && localSkuMap[ean]) {
        const localProd = localSkuMap[ean];
        
        let precoNormal = parseFloat(sp.vl_produto_normal || 0);
        let precoAtual = parseFloat(sp.vl_produto || 0);
        const estoque = parseFloat(sp.qtd_produto || 0);
        
        let peso = null;
        let unidadePeso = null;

        // Regra de Produtos Fracionados (Ex: Carnes)
        if (sp.fracionado && sp.emb === 'KG' && sp.fracionamento) {
          const fator = parseFloat(sp.fracionamento);
          if (fator > 0) {
            precoNormal = precoNormal * fator;
            precoAtual = precoAtual * fator;
            
            if (fator < 1) {
              peso = fator * 1000;
              unidadePeso = 'g';
            } else {
              peso = fator;
              unidadePeso = 'kg';
            }
          }
        }

        let precoFinal = precoNormal;
        let precoPromocional = null;

        if (precoAtual > 0 && precoAtual < precoNormal) {
          precoPromocional = precoAtual;
        } else {
          precoFinal = precoAtual > 0 ? precoAtual : precoNormal;
        }

        let updateObj = {
          id: localProd.id,
          preco: precoFinal,
          estoque: estoque,
          preco_promocional: precoPromocional
        };

        if (peso !== null && unidadePeso !== null) {
          updateObj.peso = peso.toString();
          updateObj.unidade_peso = unidadePeso;
        }

        updates.push(updateObj);
      }
    });

    // 4. Salvar no Supabase (Atualização em lote)
    let updatedCount = 0;
    if (updates.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(up => {
            let updatePayload = {
              preco: up.preco,
              estoque: up.estoque,
              preco_promocional: up.preco_promocional
            };
            if (up.peso && up.unidade_peso) {
              updatePayload.peso = up.peso;
              updatePayload.unidade_peso = up.unidade_peso;
            }
            return supabase.from('products').update(updatePayload).eq('id', up.id);
          })
        );
      }
      updatedCount = updates.length;
    }

    return NextResponse.json({ 
      success: true, 
      totalProducts: solidconProducts.length,
      updated: updatedCount,
      message: 'Sincronização agendada concluída com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro na sincronização de preços agendada:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar sincronização.' }, { status: 500 });
  }
}
