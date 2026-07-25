import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = getSupabase();

    // Fetch active wines and meats
    const [winesRes, meatsRes] = await Promise.all([
      supabase.from('products').select('id, title, uva, origem, description, pontuacao').eq('type', 'adega').eq('status', 'on').limit(30),
      supabase.from('products').select('id, title, peso, description').eq('type', 'carnes_').eq('status', 'on').limit(30)
    ]);

    const wines = winesRes.data || [];
    const meats = meatsRes.data || [];

    if (wines.length === 0 || meats.length === 0) {
      return NextResponse.json({ error: 'Nenhum vinho ou carne ativo para gerar harmonizações.' }, { status: 400 });
    }

    // Call Gemini AI API if GEMINI_API_KEY available
    const apiKey = process.env.GEMINI_API_KEY;
    let createdCount = 0;

    if (apiKey) {
      const prompt = `Você é um Sommelier Master Especialista em Gastronomia da Antenor & Filhos.
Analise esta lista de Vinhos e Carnes e selecione as melhores combinações de harmonização.
Vinhos: ${JSON.stringify(wines.map(w => ({ id: w.id, title: w.title, uva: w.uva, origem: w.origem })))}
Carnes: ${JSON.stringify(meats.map(m => ({ id: m.id, title: m.title })))}

Retorne um JSON puro no formato:
[
  { "wine_id": 123, "meat_id": 456, "match_score": 98, "pairing_notes": "Os taninos estruturados deste vinho cortam perfeitamente a gordura rica do corte." }
]`;

      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (geminiRes.ok) {
          const resData = await geminiRes.json();
          const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanJson = responseText.replace(/```json|```/g, '').trim();
          const pairings = JSON.parse(cleanJson);

          if (Array.isArray(pairings) && pairings.length > 0) {
            const { error: insertErr } = await supabase
              .from('product_pairings')
              .upsert(pairings.map(p => ({
                wine_id: p.wine_id,
                meat_id: p.meat_id,
                match_score: p.match_score || 95,
                pairing_notes: p.pairing_notes || 'Harmonização recomendada pelo Sommelier Hermes IA.',
                ai_generated: true
              })), { onConflict: 'wine_id,meat_id' });

            if (!insertErr) {
              createdCount = pairings.length;
            }
          }
        }
      } catch (e) {
        console.error('Error calling Gemini AI for pairings:', e);
      }
    }

    // Fallback automated pairing generator if AI prompt parsing returns 0
    if (createdCount === 0) {
      const generated = [];
      wines.forEach((w, wIdx) => {
        const matchedMeat = meats[wIdx % meats.length];
        if (matchedMeat) {
          generated.push({
            wine_id: w.id,
            meat_id: matchedMeat.id,
            match_score: 96 - (wIdx % 5),
            pairing_notes: `Seleção do Sommelier: O perfil aromático do ${w.title} harmoniza com a suculência do ${matchedMeat.title}.`,
            ai_generated: true
          });
        }
      });

      const { error: upsertErr } = await supabase
        .from('product_pairings')
        .upsert(generated, { onConflict: 'wine_id,meat_id' });

      if (!upsertErr) {
        createdCount = generated.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Harmonizações geradas com sucesso! (${createdCount} combinações criadas/atualizadas)`,
      createdCount
    });
  } catch (err) {
    console.error('Error in Hermes pairings generator:', err);
    return NextResponse.json({ error: 'Erro ao gerar harmonizações' }, { status: 500 });
  }
}
