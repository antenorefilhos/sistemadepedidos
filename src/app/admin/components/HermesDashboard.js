'use client';

import { useState, useRef, useEffect } from 'react';

export default function HermesDashboard({ orders, sellers, products, password }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Olá! Sou Hermes, seu agente de IA especialista em negócios. Analisei os dados da loja em tempo real. O que você gostaria de saber ou analisar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ api_key: '', system_prompt: '' });
  const [savingConfig, setSavingConfig] = useState(false);

  const openConfig = async () => {
    setShowConfig(true);
    try {
      const res = await fetch(`/api/admin/hermes/config?auth=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data && !data.error) {
        setConfigForm({ api_key: data.api_key || '', system_prompt: data.system_prompt || '' });
      }
    } catch(e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/admin/hermes/config?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      if (res.ok) {
        setShowConfig(false);
        alert('Configurações salvas com sucesso no banco de dados!');
      } else {
        alert('Erro ao salvar configurações.');
      }
    } catch(e) {
      console.error(e);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Derived stats
  const calculateTotalRevenue = (completedOnly = false) => {
    return orders.reduce((sum, order) => {
      if (completedOnly && order.status !== 'concluido') return sum;
      return sum + Number(order.total || 0);
    }, 0);
  };

  const getSellersPerformance = () => {
    const perf = {};
    orders.forEach(o => {
      const sName = o.seller_name || 'Site Direto';
      if (!perf[sName]) perf[sName] = { name: sName, count: 0, revenue: 0, pending: 0, completed: 0 };
      perf[sName].count += 1;
      perf[sName].revenue += Number(o.total || 0);
      if (o.status === 'concluido') perf[sName].completed += 1;
      else perf[sName].pending += 1;
    });
    return Object.values(perf).map(p => ({
      ...p,
      avgTicket: p.count > 0 ? p.revenue / p.count : 0
    })).sort((a, b) => b.revenue - a.revenue);
  };

  const getSalesByCategory = () => {
    let adega = 0;
    let carnes = 0;
    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (item.type === 'adega') adega += (item.preco * item.quantidade);
          else carnes += (item.preco * item.quantidade);
        });
      }
    });
    return [
      ['carnes_', carnes],
      ['adega', adega]
    ].sort((a, b) => b[1] - a[1]);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptText = customPrompt || input;
    if (!promptText.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: promptText }]);
    setInput('');
    setLoading(true);

    // Prepare context data
    const revenue = calculateTotalRevenue(false);
    const avgTicket = orders.length > 0 ? revenue / orders.length : 0;
    const sellersData = getSellersPerformance().map(s => ({ name: s.name, rev: s.revenue }));
    const topCategories = getSalesByCategory().map(c => c[0]);

    const dataContext = {
      ordersCount: orders.length,
      revenue,
      avgTicket,
      sellersData,
      productsCount: products.length,
      topCategories
    };

    try {
      const res = await fetch(`/api/admin/hermes?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, dataContext })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'error', content: data.error || 'Erro na IA.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'error', content: 'Erro de conexão com o Hermes Agent.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format Markdown safely (basic bold and lists)
  const formatMarkdown = (text) => {
    let formatted = text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\\n/g, '<br />');
    return formatted;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* CÉREBRO: Hermes Agent Chat */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--primary-light)' }}>
        <div style={{ padding: '20px 24px', backgroundColor: 'rgba(171, 144, 112, 0.15)', borderBottom: '1px solid var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 0 20px rgba(171, 144, 112, 0.4)' }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '22px' }}>Hermes AI Agent</h3>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Módulo de Inteligência de Negócios e Insights</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleSendMessage(null, 'Gere um relatório rápido de fechamento do dia destacando os vendedores e o faturamento total.')} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
              📊 Relatório Rápido
            </button>
            <button onClick={() => handleSendMessage(null, 'Me dê uma ideia de promoção para tentar aumentar o ticket médio hoje.')} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
              💡 Sugestão de Marketing
            </button>
            <button onClick={openConfig} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(171, 144, 112, 0.2)', border: '1px solid rgba(171, 144, 112, 0.4)', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }} title="Configurar Hermes">
              <i className="fa-solid fa-gear"></i> Configurar
            </button>
          </div>
        </div>
        
        <div style={{ height: '350px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px', marginRight: '4px', textTransform: 'uppercase' }}>
                {msg.role === 'user' ? 'Você' : (msg.role === 'error' ? 'Sistema' : 'Hermes Agent')}
              </span>
              <div style={{
                maxWidth: '85%',
                padding: '16px 20px',
                borderRadius: '16px',
                borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                backgroundColor: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : (msg.role === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(171,144,112,0.1)'),
                border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : (msg.role === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--primary-light)'),
                color: msg.role === 'error' ? '#fca5a5' : 'white',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontSize: '14px', padding: '16px' }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Hermes está analisando os dados da loja...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Pergunte ao Hermes sobre as vendas, produtos ou peça uma sugestão..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '15px' }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ padding: '0 32px', borderRadius: '12px', backgroundColor: 'var(--primary)', border: 'none', color: '#121418', fontWeight: 'bold', fontSize: '16px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'all 0.2s' }}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>

      {/* DASHBOARD GRÁFICOS (MIGRADO DO ANTIGO STATS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        {/* Chart 1: Sales By Category */}
        <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
          <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mapeamento de Demanda por Setor</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {getSalesByCategory().map(([sector, amount]) => {
              const totalAmt = calculateTotalRevenue(false) || 1;
              const percentage = Math.round((amount / totalAmt) * 100);
              return (
                <div key={sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{sector === 'adega' ? 'Adega de Vinhos' : 'Boutique de Carnes'}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                      {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#1c1f26', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: sector === 'adega' ? '#800020' : 'var(--primary)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Revenue Share by Seller */}
        <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
          <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento por Vendedor</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
            {getSellersPerformance().map((seller) => {
              const maxRevenue = Math.max(...getSellersPerformance().map(x => x.revenue)) || 1;
              const percentage = Math.round((seller.revenue / maxRevenue) * 100);
              return (
                <div key={seller.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{seller.name}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: 'var(--text-muted)' }}>R$ </span>
                      {seller.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#1c1f26', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: seller.name === 'Site Direto' ? 'var(--text-muted)' : 'var(--primary)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONFIG MODAL */}
      {showConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div className="glass" style={{ width: '600px', maxWidth: '90%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}><i className="fa-solid fa-gear"></i> Configurações do Agente Hermes</h3>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Gemini API Key</label>
                <input 
                  type="password" 
                  placeholder="Cole sua API Key do Google AI Studio"
                  className="form-control"
                  style={{ padding: '12px', fontSize: '14px' }}
                  value={configForm.api_key}
                  onChange={e => setConfigForm({...configForm, api_key: e.target.value})}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Se deixado em branco, o sistema tentará usar a variável de ambiente `.env`.</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>System Prompt (Regras de Comportamento)</label>
                <textarea 
                  placeholder="Ex: Você é o Hermes, especialista em vendas..."
                  className="form-control"
                  style={{ padding: '12px', fontSize: '14px', minHeight: '180px', resize: 'vertical' }}
                  value={configForm.system_prompt}
                  onChange={e => setConfigForm({...configForm, system_prompt: e.target.value})}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Instruções base de como a IA deve agir, qual tom usar e quais restrições ela tem.</span>
              </div>

            </div>
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <button onClick={() => setShowConfig(false)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={saveConfig} disabled={savingConfig} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
