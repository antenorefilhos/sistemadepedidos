'use client';

import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { sanitizeHtml } from '@/components/admin/lib/sanitizeHtml';

const WELCOME_MESSAGE = { role: 'ai', content: 'Olá! Sou Hermes, seu agente de IA especialista em negócios. O que você gostaria de analisar hoje?' };

// Extraído de HermesDashboard.js: painel de chat (sessões + conversa) com o agente Hermes.
export default function HermesChatPanel({ password, buildDataContext, onOpenConfig }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const confirm = useConfirm();

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const data = await adminFetch('/api/admin/hermes/sessions', { password });
      if (data?.sessions) setSessions(data.sessions);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (sessionId) => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/hermes/messages?session_id=${sessionId}`, { password });
      if (data?.messages?.length > 0) {
        setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{ role: 'ai', content: 'Olá! Como posso ajudar nesta nova conversa?' }]);
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
    setMessages([WELCOME_MESSAGE]);
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm({ title: 'Excluir chat', message: 'O histórico desta conversa será apagado.', tone: 'danger', confirmLabel: 'Excluir' });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/hermes/sessions?session_id=${id}`, { password, method: 'DELETE' });
      if (activeSessionId === id) startNewChat();
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptText = customPrompt || input;
    if (!promptText.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: promptText }]);
    setInput('');
    setLoading(true);

    const payload = { prompt: promptText, dataContext: buildDataContext() };
    if (activeSessionId) payload.session_id = activeSessionId;

    try {
      const data = await adminFetch('/api/admin/hermes', { password, method: 'POST', body: payload });
      setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
      if (data.session_id && !activeSessionId) {
        setActiveSessionId(data.session_id);
        loadSessions();
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', content: err.message || 'Erro de conexão com o Hermes Agent.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-[600px]">
      <div className="w-[280px] shrink-0 bg-base-200/50 rounded-2xl border border-base-300 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-base-300 bg-base-300/30">
          <button onClick={startNewChat} className="btn btn-primary w-full gap-2 shadow-sm">
            <i className="fa-solid fa-plus" aria-hidden="true"></i> Novo Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          <span className="text-xs text-base-content/50 uppercase tracking-wider font-bold px-2 mb-1">Histórico de Sessões</span>

          {sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => selectSession(sess.id)}
              className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 border
                ${activeSessionId === sess.id ? 'bg-primary/10 border-primary/30' : 'bg-transparent border-transparent hover:bg-base-300/50'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <i className={`fa-regular fa-message text-sm ${activeSessionId === sess.id ? 'text-primary' : 'text-base-content/50'}`} aria-hidden="true"></i>
                <span className={`text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] ${activeSessionId === sess.id ? 'text-primary font-bold' : 'text-base-content/70'}`}>
                  {sess.title}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, sess.id)}
                className={`btn btn-ghost btn-xs btn-circle ${activeSessionId === sess.id ? 'opacity-100 text-error' : 'opacity-40 hover:opacity-100 hover:text-error'}`}
                aria-label={`Excluir chat ${sess.title}`}
                title="Excluir chat"
              >
                <i className="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>
              </button>
            </div>
          ))}

          {sessions.length === 0 && <div className="p-5 text-center text-base-content/50 text-xs italic">Nenhum chat salvo ainda.</div>}
        </div>

        <div className="p-4 border-t border-base-300 bg-base-300/30">
          <button onClick={onOpenConfig} className="btn btn-outline btn-primary btn-sm w-full gap-2">
            <i className="fa-solid fa-gear" aria-hidden="true"></i> Configurações do Agente
          </button>
        </div>
      </div>

      <div className="flex-1 bg-base-200/50 rounded-2xl border border-base-300 flex flex-col overflow-hidden">
        <div className="p-5 md:px-6 bg-base-300/30 border-b border-base-300 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-primary-content rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-primary/20">
              <i className="fa-solid fa-robot" aria-hidden="true"></i>
            </div>
            <div>
              <h4 className="m-0 text-primary text-base font-bold">Hermes AI Agent</h4>
              <span className="text-xs text-base-content/60">Módulo de Inteligência de Negócios e Insights</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSendMessage(null, 'Gere um relatório rápido de fechamento do dia destacando os vendedores e o faturamento total.')}
              className="btn btn-sm btn-ghost border border-base-content/10 text-xs font-normal"
            >
              Relatório Rápido
            </button>
            <button
              onClick={() => handleSendMessage(null, 'Me dê uma ideia de promoção para tentar aumentar o ticket médio hoje.')}
              className="btn btn-sm btn-ghost border border-base-content/10 text-xs font-normal"
            >
              Sugestão de Marketing
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-base-100">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
              <div className="chat-header text-xs opacity-50 mb-1 uppercase tracking-widest font-bold">
                {msg.role === 'user' ? 'Você' : msg.role === 'error' ? 'Sistema' : 'Hermes'}
              </div>
              <div
                className={`chat-bubble text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' ? 'chat-bubble-neutral' : msg.role === 'error' ? 'chat-bubble-error' : 'bg-primary/10 text-base-content border border-primary/20'}`}
              >
                <div
                  className="hermes-markdown"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(msg.role === 'user' ? msg.content.replace(/\n/g, '<br />') : marked.parse(msg.content, { breaks: true })),
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
              className="input input-bordered w-full bg-base-100 h-12"
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary h-12 px-6">
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
