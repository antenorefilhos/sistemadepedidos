import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Chave da API do Gemini não configurada.',
        details: 'Adicione GEMINI_API_KEY no arquivo .env do projeto.'
      }, { status: 500 });
    }

    const { prompt, dataContext } = await request.json();

    // Context formatting
    const contextStr = `
CONTEXTO DO E-COMMERCE (ANTENOR E FILHOS):
- Total de Pedidos: ${dataContext.ordersCount}
- Faturamento Total (Aproximado): R$ ${dataContext.revenue.toFixed(2)}
- Ticket Médio: R$ ${dataContext.avgTicket.toFixed(2)}
- Vendedores: ${JSON.stringify(dataContext.sellersData)}
- Produtos Ativos: ${dataContext.productsCount}
- Categorias de Destaque: ${dataContext.topCategories.join(', ')}
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `Você é o Hermes, o agente de Inteligência Artificial Especialista em Negócios e Varejo da Antenor e Filhos (um e-commerce de Carnes Premium e Vinhos). Seu objetivo é analisar os dados em tempo real da loja e fornecer insights úteis, sugestões de marketing, alertas de estoque/vendas ou responder perguntas do gestor de forma concisa e proativa.

Use um tom profissional, moderno, encorajador e direto. Retorne a resposta formatada em Markdown. Se o gestor fizer uma pergunta, responda usando os dados abaixo. Se não for uma pergunta, faça um relatório de insights (máximo de 3 tópicos importantes).

${contextStr}

Mensagem/Comando do Gestor:
${prompt}
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      response: text 
    });
    
  } catch (error) {
    console.error('Erro na API Hermes:', error);
    return NextResponse.json({ error: 'Erro ao processar a inteligência artificial.' }, { status: 500 });
  }
}
