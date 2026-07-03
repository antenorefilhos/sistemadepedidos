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
      const { data } = await supabase
        .from('hermes_config')
        .select('api_key, system_prompt')
        .eq('id', 1)
        .single();
      dbConfig = data;
    } catch (e) {
      console.warn("hermes_config não encontrada ou erro ao acessar, usando fallback do .env");
    }

    const apiKey = (dbConfig && dbConfig.api_key) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Chave da API do Gemini não configurada.',
        details: 'Adicione GEMINI_API_KEY no arquivo .env ou configure no painel do administrador.'
      }, { status: 500 });
    }

    // 1. Ler a Knowledge Base
    let knowledgeBase = '';
    try {
      const kbPath = path.join(process.cwd(), 'src', 'lib', 'hermes_knowledge.md');
      knowledgeBase = fs.readFileSync(kbPath, 'utf8');
    } catch (e) {
      console.error("Knowledge base não encontrada no disco. Ignorando.");
    }

    const { prompt, dataContext } = await request.json();

    // 2. Contexto Diário / Tempo Real
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

    const finalSystemInstruction = `
${knowledgeBase}

${customSystemPrompt}
${contextStr}
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configura o modelo com Tools (Function Calling)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: finalSystemInstruction,
      tools: [{
        functionDeclarations: [
          {
            name: "atualizar_preco_produto",
            description: "Atualiza o preço de um produto existente no banco de dados. Use apenas quando o Gestor pedir explicitamente para alterar o preço de algo.",
            parameters: {
              type: "OBJECT",
              properties: {
                nome_produto: { type: "STRING", description: "Nome parcial ou completo do produto (ex: Bife Ancho, Vinho Tinto Reserva)" },
                novo_preco: { type: "NUMBER", description: "Novo preço a ser aplicado no banco de dados (apenas números)" }
              },
              required: ["nome_produto", "novo_preco"]
            }
          }
        ]
      }]
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(prompt);
    let response = result.response;

    // Verifica se o Gemini chamou alguma função
    const call = response.functionCalls();
    
    if (call && call.length > 0) {
      const fnCall = call[0];
      let apiResponse = {};
      
      if (fnCall.name === 'atualizar_preco_produto') {
        const { nome_produto, novo_preco } = fnCall.args;
        
        // Busca o produto pelo nome
        const { data: prods } = await supabase.from('products').select('id, nome').ilike('nome', `%${nome_produto}%`).limit(1);
        
        if (prods && prods.length > 0) {
          const { error } = await supabase.from('products').update({ preco: novo_preco }).eq('id', prods[0].id);
          if (error) {
            apiResponse = { status: "erro", detalhe: error.message };
          } else {
            apiResponse = { status: "sucesso", detalhe: `Preço do produto '${prods[0].nome}' atualizado com sucesso no banco de dados para R$ ${novo_preco}.` };
          }
        } else {
          apiResponse = { status: "erro", detalhe: `Nenhum produto encontrado contendo o nome '${nome_produto}'.` };
        }
      }

      // Devolve o resultado da função para o Gemini gerar a mensagem final de texto
      const finalResult = await chat.sendMessage([{
        functionResponse: {
          name: fnCall.name,
          response: apiResponse
        }
      }]);
      
      response = finalResult.response;
    }

    return NextResponse.json({ 
      success: true, 
      response: response.text() 
    });
    
  } catch (error) {
    console.error('Erro na API Hermes:', error);
    return NextResponse.json({ error: 'Erro ao processar a inteligência artificial.' }, { status: 500 });
  }
}
