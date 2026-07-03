import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabase } from '@/lib/pgDb';
import fs from 'fs';
import path from 'path';

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

    const supabase = getSupabase();
    let dbConfig = null;
    try {
      const { data } = await supabase.from('hermes_config').select('api_key, system_prompt').eq('id', 1).single();
      dbConfig = data;
    } catch (e) {
      console.warn("hermes_config não encontrada");
    }

    const apiKey = (dbConfig && dbConfig.api_key) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada.' }, { status: 500 });
    }

    let knowledgeBase = '';
    try {
      const kbPath = path.join(process.cwd(), 'src', 'lib', 'hermes_knowledge.md');
      knowledgeBase = fs.readFileSync(kbPath, 'utf8');
    } catch (e) {
      // Ignora se não existir
    }

    const { prompt, dataContext, session_id } = await request.json();

    // Contexto Diário em Tempo Real
    const contextStr = `
[CONTEXTO EM TEMPO REAL DA LOJA (ANTENOR E FILHOS)]
- Total de Pedidos: ${dataContext.ordersCount}
- Faturamento Total (Aproximado): R$ ${dataContext.revenue.toFixed(2)}
- Ticket Médio: R$ ${dataContext.avgTicket.toFixed(2)}
- Vendedores: ${JSON.stringify(dataContext.sellersData)}
- Produtos Ativos: ${dataContext.productsCount}
- Categorias de Destaque: ${dataContext.topCategories.join(', ')}
    `;

    const customSystemPrompt = (dbConfig && dbConfig.system_prompt) ? `[INSTRUÇÕES TEMPORÁRIAS DO GESTOR HOJE]\n${dbConfig.system_prompt}\n` : '';
    const finalSystemInstruction = `${knowledgeBase}\n\n${customSystemPrompt}\n${contextStr}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: finalSystemInstruction,
      tools: [{
        functionDeclarations: [
          {
            name: "atualizar_preco_produto",
            description: "Atualiza o preço de um produto existente no banco de dados.",
            parameters: {
              type: "OBJECT",
              properties: {
                nome_produto: { type: "STRING", description: "Nome parcial ou completo do produto" },
                novo_preco: { type: "NUMBER", description: "Novo preço a ser aplicado no banco (ex: 150.50)" }
              },
              required: ["nome_produto", "novo_preco"]
            }
          },
          {
            name: "ativar_desativar_produto",
            description: "Ativa (coloca à venda) ou Desativa (esconde) um produto na loja.",
            parameters: {
              type: "OBJECT",
              properties: {
                nome_produto: { type: "STRING", description: "Nome parcial ou completo do produto" },
                status: { type: "STRING", description: "'on' para ativar, 'off' para desativar" }
              },
              required: ["nome_produto", "status"]
            }
          },
          {
            name: "alterar_status_pedido",
            description: "Muda a etapa (status) de um pedido na logística.",
            parameters: {
              type: "OBJECT",
              properties: {
                nome_cliente_ou_id: { type: "STRING", description: "Nome do cliente ou número ID do pedido" },
                novo_status: { type: "STRING", description: "Um dos valores: 'pending', 'viewed', 'completed', 'cancelled'" }
              },
              required: ["nome_cliente_ou_id", "novo_status"]
            }
          },
          {
            name: "consultar_historico_vendas",
            description: "Consulta faturamento e quantidade de pedidos num período de tempo, se o usuário perguntar sobre o passado. Retorna dados brutos para a IA montar o relatório.",
            parameters: {
              type: "OBJECT",
              properties: {
                dias_atras: { type: "NUMBER", description: "Quantos dias olhar para o passado a partir de hoje (ex: 30 para último mês)" }
              },
              required: ["dias_atras"]
            }
          },
          {
            name: "gerenciar_vendedor",
            description: "Ativa ou Desativa um vendedor no sistema.",
            parameters: {
              type: "OBJECT",
              properties: {
                nome_vendedor: { type: "STRING", description: "Nome do vendedor" },
                status: { type: "STRING", description: "'on' para ativar, 'off' para desativar" }
              },
              required: ["nome_vendedor", "status"]
            }
          }
        ]
      }]
    });

    let currentSessionId = session_id;
    let history = [];

    // Se a sessão não existir, cria uma nova
    if (!currentSessionId) {
      const title = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
      const { data: newSession, error: sessErr } = await supabase
        .from('hermes_sessions')
        .insert([{ title }])
        .select()
        .single();
        
      if (sessErr) {
        console.error("Erro ao criar sessão:", sessErr);
        throw sessErr;
      }
      currentSessionId = newSession.id;
    } else {
      await supabase.from('hermes_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSessionId);
      
      const { data: oldMsgs } = await supabase
        .from('hermes_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });
        
      if (oldMsgs && oldMsgs.length > 0) {
        history = oldMsgs.map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      }
    }

    await supabase.from('hermes_messages').insert([{ session_id: currentSessionId, role: 'user', content: prompt }]);

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(prompt);
    let response = result.response;

    // Função para processar os Tools
    const calls = response.functionCalls();
    if (calls && calls.length > 0) {
      let functionResponses = [];

      for (const fnCall of calls) {
        let apiResponse = {};
        
        try {
          if (fnCall.name === 'atualizar_preco_produto') {
            const { nome_produto, novo_preco } = fnCall.args;
            const { data: prods } = await supabase.from('products').select('id, title').ilike('title', `%${nome_produto}%`).limit(1);
            if (prods && prods.length > 0) {
              const { error } = await supabase.from('products').update({ preco: novo_preco }).eq('id', prods[0].id);
              if (error) throw error;
              apiResponse = { status: "sucesso", detalhe: `Preço do '${prods[0].title}' atualizado para R$ ${novo_preco}.` };
            } else apiResponse = { status: "erro", detalhe: `Produto não encontrado.` };
          }
          
          else if (fnCall.name === 'ativar_desativar_produto') {
            const { nome_produto, status } = fnCall.args;
            const { data: prods } = await supabase.from('products').select('id, title').ilike('title', `%${nome_produto}%`).limit(1);
            if (prods && prods.length > 0) {
              const { error } = await supabase.from('products').update({ status }).eq('id', prods[0].id);
              if (error) throw error;
              apiResponse = { status: "sucesso", detalhe: `Status do '${prods[0].title}' alterado para '${status}'.` };
            } else apiResponse = { status: "erro", detalhe: `Produto não encontrado.` };
          }

          else if (fnCall.name === 'alterar_status_pedido') {
            const { nome_cliente_ou_id, novo_status } = fnCall.args;
            // Tenta buscar por ID se for número, senão por nome
            let query = supabase.from('orders').select('id, customer_name');
            if (!isNaN(nome_cliente_ou_id)) query = query.eq('id', Number(nome_cliente_ou_id));
            else query = query.ilike('customer_name', `%${nome_cliente_ou_id}%`);
            
            const { data: ords } = await query.limit(1);
            if (ords && ords.length > 0) {
              const { error } = await supabase.from('orders').update({ status: novo_status }).eq('id', ords[0].id);
              if (error) throw error;
              apiResponse = { status: "sucesso", detalhe: `Pedido #${ords[0].id} de ${ords[0].customer_name} alterado para '${novo_status}'.` };
            } else apiResponse = { status: "erro", detalhe: `Pedido não encontrado.` };
          }

          else if (fnCall.name === 'consultar_historico_vendas') {
            const { dias_atras } = fnCall.args;
            const d = new Date();
            d.setDate(d.getDate() - (dias_atras || 30));
            const pastDate = d.toISOString();

            // Busca pedidos desde 'pastDate'
            const { data: ords } = await supabase.from('orders').select('id, status, created_at').gte('created_at', pastDate);
            if (ords && ords.length > 0) {
              const orderIds = ords.map(o => o.id);
              // Busca os itens desses pedidos para somar faturamento
              const { data: items } = await supabase.from('order_items').select('order_id, price, quantity').in('order_id', orderIds);
              
              let totalReceita = 0;
              let receitaConcluida = 0;
              
              if (items) {
                items.forEach(it => {
                  const o = ords.find(x => x.id === it.order_id);
                  const valor = (it.price || 0) * (it.quantity || 1);
                  totalReceita += valor;
                  if (o && o.status === 'completed') receitaConcluida += valor;
                });
              }
              
              apiResponse = { 
                status: "sucesso", 
                total_pedidos: ords.length, 
                faturamento_bruto: totalReceita, 
                faturamento_concluido: receitaConcluida,
                periodo_analisado_dias: dias_atras 
              };
            } else {
              apiResponse = { status: "sucesso", detalhe: "Nenhum pedido encontrado neste período." };
            }
          }

          else if (fnCall.name === 'gerenciar_vendedor') {
            const { nome_vendedor, status } = fnCall.args;
            const { data: vends } = await supabase.from('sellers').select('id, name').ilike('name', `%${nome_vendedor}%`).limit(1);
            if (vends && vends.length > 0) {
              const { error } = await supabase.from('sellers').update({ status }).eq('id', vends[0].id);
              if (error) throw error;
              apiResponse = { status: "sucesso", detalhe: `Status do vendedor '${vends[0].name}' alterado para '${status}'.` };
            } else apiResponse = { status: "erro", detalhe: `Vendedor não encontrado.` };
          }
        } catch (e) {
          apiResponse = { status: "erro", detalhe: e.message };
        }

        functionResponses.push({
          functionResponse: { name: fnCall.name, response: apiResponse }
        });
      }

      // Envia as respostas das funções de volta para o Gemini
      const finalResult = await chat.sendMessage(functionResponses);
      response = finalResult.response;
    }

    const aiText = response.text();

    await supabase.from('hermes_messages').insert([{ session_id: currentSessionId, role: 'ai', content: aiText }]);

    return NextResponse.json({ 
      success: true, 
      response: aiText,
      session_id: currentSessionId
    });
    
  } catch (error) {
    console.error('Erro na API Hermes:', error);
    return NextResponse.json({ error: 'Erro ao processar a inteligência artificial.' }, { status: 500 });
  }
}
