'use client';

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

export default function HermesDashboard({ orders, sellers, products, password }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Olá! Sou Hermes, seu agente de IA especialista em negócios. O que você gostaria de analisar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Super Powers Tabs
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'analytics' | 'logistics' | 'inventory' | 'rh'

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ api_key: '', system_prompt: '' });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/admin/hermes/sessions?auth=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data && data.sessions) setSessions(data.sessions);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (sessionId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hermes/messages?session_id=${sessionId}&auth=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data && data.messages) {
        if (data.messages.length > 0) {
          setMessages(data.messages.map(m => ({ role: m.role, content: m.content })));
        } else {
          setMessages([{ role: 'ai', content: 'Olá! Como posso ajudar nesta nova conversa?' }]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = (id) => {
    if (activeSessionId === id) return;
    setActiveSessionId(id);
    loadMessages(id);
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([{ role: 'ai', content: 'Olá! Sou Hermes, seu agente de IA especialista em negócios. O que você gostaria de analisar hoje?' }]);
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este chat? O histórico será apagado.')) return;
    try {
      await fetch(`/api/admin/hermes/sessions?session_id=${id}&auth=${encodeURIComponent(password)}`, { method: 'DELETE' });
      if (activeSessionId === id) startNewChat();
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const openConfig = async () => {
    setShowConfig(true);
    try {
      const res = await fetch(`/api/admin/hermes/config?auth=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data && !data.error) {
        setConfigForm({ api_key: data.api_key || '', system_prompt: data.system_prompt || '' });
      }
    } catch (e) {
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
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Helper to get order total (resiliente com preços estimados do catálogo)
  const getOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => {
      const itemPrice = Number(item.price) || products.find(p => p.title === item.product_title)?.preco || 0;
      return sum + (itemPrice * (Number(item.quantity) || 1));
    }, 0);
  };

  // Derived stats
  const calculateTotalRevenue = (completedOnly = false) => {
    return orders.reduce((sum, order) => {
      if (completedOnly && order.status !== 'completed') return sum;
      return sum + getOrderTotal(order);
    }, 0);
  };

  const getSellersPerformance = () => {
    const perf = {};
    orders.forEach(o => {
      const sName = o.seller_name || 'Site Direto';
      if (!perf[sName]) perf[sName] = { name: sName, count: 0, revenue: 0, pending: 0, completed: 0 };
      perf[sName].count += 1;
      perf[sName].revenue += getOrderTotal(o);
      if (o.status === 'completed') perf[sName].completed += 1;
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
          const itemPrice = Number(item.price) || products.find(p => p.title === item.product_title)?.preco || 0;
          // Assume "adega" is a category, else classify as meats
          if (item.product_category === 'adega' || (item.product_title && item.product_title.toLowerCase().includes('vinho'))) {
            adega += (itemPrice * (Number(item.quantity) || 1));
          } else {
            carnes += (itemPrice * (Number(item.quantity) || 1));
          }
        });
      }
    });
    return [
      ['Boutique de Carnes', carnes],
      ['Adega de Vinhos', adega]
    ].sort((a, b) => b[1] - a[1]);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    const payload = { prompt: promptText, dataContext };
    if (activeSessionId) payload.session_id = activeSessionId;

    try {
      const res = await fetch(`/api/admin/hermes?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        if (data.session_id && !activeSessionId) {
          setActiveSessionId(data.session_id);
          loadSessions();
        }
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

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease]">
      <style>{`
        .hermes-markdown { color: inherit; font-size: 14px; line-height: 1.6; }
        .hermes-markdown p { margin-top: 0; margin-bottom: 12px; color: inherit; }
        .hermes-markdown p:last-child { margin-bottom: 0; }
        .hermes-markdown ul, .hermes-markdown ol { margin-top: 0; margin-bottom: 12px; padding-left: 24px; color: inherit; list-style: disc; }
        .hermes-markdown li { margin-bottom: 6px; }
        .hermes-markdown h1, .hermes-markdown h2, .hermes-markdown h3 { margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
        .hermes-markdown h3 { font-size: 16px; }
        .hermes-markdown h2 { font-size: 18px; border-bottom: 1px solid currentColor; padding-bottom: 4px; opacity: 0.8; }
        .hermes-markdown strong { font-weight: 700; }
        .hermes-markdown code { background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        .hermes-markdown pre { background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; overflow-x: auto; margin-bottom: 12px; }
      `}</style>
      
      {/* SUPER POWERS TABS */}
      <div className="tabs tabs-boxed bg-base-200/50 p-2 gap-2 overflow-x-auto flex-nowrap justify-start">
        {[
          { id: 'chat', icon: 'fa-robot', label: 'Hermes AI (Chat)' },
          { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics (CMO/CFO)' },
          { id: 'logistics', icon: 'fa-truck-fast', label: 'Logística (COO)' },
          { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventário (CTO)' },
          { id: 'rh', icon: 'fa-users', label: 'RH & Vendas (CEO)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab h-12 gap-2 font-bold px-6 whitespace-nowrap transition-all duration-300 ${activeTab === tab.id ? 'tab-active bg-primary text-primary-content shadow-lg' : 'text-base-content/60 hover:text-base-content'}`}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* Container Principal Estilo ChatGPT */}
      <div className={activeTab === 'chat' ? 'flex gap-6 h-[600px]' : 'hidden'}>
        
        {/* BARRA LATERAL (Histórico) */}
        <div className="w-[280px] shrink-0 bg-base-200/50 rounded-2xl border border-base-300 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-base-300 bg-base-300/30">
            <button 
              onClick={startNewChat}
              className="btn btn-primary w-full gap-2 shadow-sm"
            >
              <i className="fa-solid fa-plus"></i> Novo Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <span className="text-[11px] text-base-content/50 uppercase tracking-wider font-bold px-2 mb-1">Histórico de Sessões</span>
            
            {sessions.map(sess => (
              <div 
                key={sess.id} 
                onClick={() => selectSession(sess.id)}
                className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 border
                  ${activeSessionId === sess.id 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-transparent border-transparent hover:bg-base-300/50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <i className={`fa-regular fa-message text-sm ${activeSessionId === sess.id ? 'text-primary' : 'text-base-content/50'}`}></i>
                  <span className={`text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]
                    ${activeSessionId === sess.id ? 'text-primary font-bold' : 'text-base-content/70'}`}>
                    {sess.title}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, sess.id)}
                  className={`btn btn-ghost btn-xs btn-circle ${activeSessionId === sess.id ? 'opacity-100 text-error' : 'opacity-40 hover:opacity-100 hover:text-error'}`}
                  title="Excluir chat"
                >
                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="p-5 text-center text-base-content/50 text-xs italic">
                Nenhum chat salvo ainda.
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-base-300 bg-base-300/30">
            <button onClick={openConfig} className="btn btn-outline btn-primary btn-sm w-full gap-2">
              <i className="fa-solid fa-gear"></i> Configurações do Agente
            </button>
          </div>
        </div>

        {/* ÁREA PRINCIPAL DO CHAT */}
        <div className="flex-1 bg-base-200/50 rounded-2xl border border-base-300 flex flex-col overflow-hidden">
          <div className="p-5 md:px-6 bg-base-300/30 border-b border-base-300 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary text-primary-content rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-primary/20">
                🤖
              </div>
              <div>
                <h3 className="m-0 text-primary font-serif text-xl font-bold">Hermes AI Agent</h3>
                <span className="text-xs text-base-content/60">Módulo de Inteligência de Negócios e Insights</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSendMessage(null, 'Gere um relatório rápido de fechamento do dia destacando os vendedores e o faturamento total.')} className="btn btn-sm btn-ghost border border-base-content/10 text-xs font-normal">
                📊 Relatório Rápido
              </button>
              <button onClick={() => handleSendMessage(null, 'Me dê uma ideia de promoção para tentar aumentar o ticket médio hoje.')} className="btn btn-sm btn-ghost border border-base-content/10 text-xs font-normal">
                💡 Sugestão de Marketing
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-base-100">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className="chat-header text-xs opacity-50 mb-1 uppercase tracking-widest font-bold">
                  {msg.role === 'user' ? 'Você' : (msg.role === 'error' ? 'Sistema' : 'Hermes')}
                </div>
                <div className={`chat-bubble text-[15px] leading-relaxed shadow-sm
                  ${msg.role === 'user' ? 'chat-bubble-neutral' : (msg.role === 'error' ? 'chat-bubble-error' : 'bg-primary/10 text-base-content border border-primary/20')}`}>
                  <div 
                    className="hermes-markdown"
                    dangerouslySetInnerHTML={{ 
                      __html: msg.role === 'user' 
                        ? msg.content.replace(/\n/g, '<br />') 
                        : marked.parse(msg.content, { breaks: true }) 
                    }} 
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 text-primary text-sm p-4 animate-pulse">
                <span className="loading loading-spinner loading-sm"></span> Hermes está analisando os dados da loja...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-4 md:px-6 bg-base-300/30 border-t border-base-300">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Pergunte ao Hermes sobre as vendas, produtos ou peça uma sugestão..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="input input-bordered w-full bg-base-100 h-14 text-[15px]"
              />
              <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary h-14 px-8 text-lg shadow-md">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRÁFICOS (MIGRADO DO ANTIGO STATS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales By Category */}
        <div className="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <h4 className="text-base-content/80 text-sm font-bold uppercase tracking-widest mb-6"><i className="fa-solid fa-chart-pie mr-2"></i>Mapeamento de Demanda por Setor</h4>
          <div className="flex flex-col gap-6">
            {getSalesByCategory().map(([sector, amount]) => {
              const totalAmt = calculateTotalRevenue(false) || 1;
              const percentage = Math.round((amount / totalAmt) * 100);
              return (
                <div key={sector}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-base-content/70">{sector === 'adega' ? 'Adega de Vinhos' : 'Boutique de Carnes'}</span>
                    <span className="font-bold text-base-content">
                      <span className="text-[0.7em] mr-1 font-normal text-base-content/50">R$</span>
                      {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage}%)
                    </span>
                  </div>
                  <progress className={`progress w-full h-3 ${sector === 'adega' ? 'progress-error' : 'progress-primary'}`} value={percentage} max="100"></progress>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Revenue Share by Seller */}
        <div className="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <h4 className="text-base-content/80 text-sm font-bold uppercase tracking-widest mb-6"><i className="fa-solid fa-users mr-2"></i>Faturamento por Vendedor</h4>
          <div className="flex flex-col gap-6 max-h-[300px] overflow-y-auto pr-2">
            {getSellersPerformance().map((seller) => {
              const maxRevenue = Math.max(...getSellersPerformance().map(x => x.revenue)) || 1;
              const percentage = Math.round((seller.revenue / maxRevenue) * 100);
              return (
                <div key={seller.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-base-content/70">{seller.name}</span>
                    <span className="font-bold text-base-content">
                      <span className="text-[0.75em] font-normal text-base-content/50 mr-1">R$ </span>
                      {seller.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <progress className={`progress w-full h-3 ${seller.name === 'Site Direto' ? 'progress-neutral' : 'progress-primary'}`} value={percentage} max="100"></progress>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUPER POWER: ANALYTICS (CMO/CFO) */}
      <div className={activeTab === 'analytics' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h2 className="text-primary text-lg font-bold mb-2"><i className="fa-solid fa-chart-pie mr-3"></i>Analytics & Telemetria</h2>
          <p className="text-base-content/60 text-sm">Módulo em construção. Integrando com a nova tabela <code>telemetry_events</code> para calcular CAC, LTV e Taxa de Conversão em tempo real.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
             <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
               <h4 className="text-base-content/60 text-xs tracking-widest uppercase font-bold mb-2">Receita Total</h4>
               <div className="text-xl font-bold text-primary">R$ {calculateTotalRevenue(false).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
             </div>
             <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
               <h4 className="text-base-content/60 text-xs tracking-widest uppercase font-bold mb-2">Ticket Médio</h4>
               <div className="text-xl font-bold text-primary">R$ {orders.length > 0 ? (calculateTotalRevenue(false)/orders.length).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</div>
             </div>
             <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm">
               <h4 className="text-base-content/60 text-xs tracking-widest uppercase font-bold mb-2">Total de Pedidos</h4>
               <div className="text-xl font-bold text-primary">{orders.length}</div>
             </div>
          </div>
        </div>
      </div>

      {/* SUPER POWER: LOGÍSTICA (COO) */}
      <div className={activeTab === 'logistics' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h2 className="text-primary text-lg font-bold mb-2"><i className="fa-solid fa-truck-fast mr-3"></i>Kanban de Logística</h2>
          <p className="text-base-content/60 text-sm">Gerenciamento visual de entrega de orçamentos e despachos. (Em breve: Drag and Drop interativo)</p>
        </div>
      </div>

      {/* SUPER POWER: INVENTÁRIO (CTO) */}
      <div className={activeTab === 'inventory' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h2 className="text-primary text-lg font-bold mb-2"><i className="fa-solid fa-boxes-stacked mr-3"></i>Alertas de Inventário</h2>
          <p className="text-base-content/60 text-sm">Conectado ao módulo Solidcon. Monitoramento de Ruptura de Estoque Ativo.</p>
        </div>
      </div>

      {/* SUPER POWER: RH & VENDAS (CEO) */}
      <div className={activeTab === 'rh' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h2 className="text-primary text-lg font-bold mb-6"><i className="fa-solid fa-users mr-3"></i>Ranking de Vendedores (Leaderboard)</h2>
          <div className="flex flex-col gap-2">
            {getSellersPerformance().map((s, idx) => (
              <div key={idx} className={`flex justify-between items-center p-5 rounded-xl border transition-all ${idx === 0 ? 'bg-primary/10 border-primary/30' : 'bg-base-100 border-base-300 hover:border-base-content/20'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${idx === 0 ? 'text-primary' : 'text-base-content/40'}`}>#{idx + 1}</span>
                  <span className={`text-lg ${idx === 0 ? 'font-bold text-base-content' : 'font-medium text-base-content/80'}`}>{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-lg">R$ {s.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                  <div className="text-xs text-base-content/60 mt-1">{s.count} pedidos <span className="opacity-50 mx-1">•</span> T.M: R$ {s.avgTicket.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONFIG MODAL */}
      {showConfig && (
        <dialog className="modal modal-open bg-black/60 backdrop-blur-sm">
          <div className="modal-box max-w-2xl bg-base-200 border border-base-300 p-0 overflow-hidden shadow-2xl">
            
            <div className="p-5 md:px-8 border-b border-base-300 bg-base-300/30 flex justify-between items-center">
              <h3 className="text-xl font-bold font-serif text-primary flex items-center gap-3">
                <i className="fa-solid fa-gear"></i> Configurações do Agente Hermes
              </h3>
              <button onClick={() => setShowConfig(false)} className="btn btn-sm btn-circle btn-ghost">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="p-5 md:p-8 flex flex-col gap-6">
              
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold tracking-widest uppercase text-xs">Gemini API Key</span></label>
                <input 
                  type="password" 
                  placeholder="Cole sua API Key do Google AI Studio"
                  className="input input-bordered w-full h-14 bg-base-100"
                  value={configForm.api_key}
                  onChange={e => setConfigForm({...configForm, api_key: e.target.value})}
                />
                <label className="label"><span className="label-text-alt text-base-content/60">Se deixado em branco, o sistema tentará usar a variável de ambiente `.env`.</span></label>
              </div>

              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold tracking-widest uppercase text-xs">System Prompt (Regras de Comportamento)</span></label>
                <textarea 
                  placeholder="Ex: Você é o Hermes, especialista em vendas..."
                  className="textarea textarea-bordered w-full min-h-[180px] bg-base-100 text-[14px]"
                  value={configForm.system_prompt}
                  onChange={e => setConfigForm({...configForm, system_prompt: e.target.value})}
                />
                <label className="label"><span className="label-text-alt text-base-content/60">Instruções base de como a IA deve agir, qual tom usar e quais restrições ela tem.</span></label>
              </div>

            </div>
            
            <div className="p-5 md:px-8 border-t border-base-300 bg-base-300/30 flex justify-end gap-3">
              <button onClick={() => setShowConfig(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button onClick={saveConfig} disabled={savingConfig} className="btn btn-primary">
                {savingConfig ? <span className="loading loading-spinner"></span> : 'Salvar Configurações'}
              </button>
            </div>

          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowConfig(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

    </div>
  );
}
