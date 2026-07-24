'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

const SESSION_KEY = 'customer_access_token';

export default function CustomerPortal() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [repeatSuccess, setRepeatSuccess] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    let token = null;
    try {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
      if (token) {
        // Remove o token da URL para não ficar no histórico/compartilhável.
        window.history.replaceState({}, '', '/conta');
      } else {
        token = sessionStorage.getItem(SESSION_KEY);
      }
    } catch {
      /* noop */
    }
    if (token) verifyToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async (token) => {
    setVerifying(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/customer-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setName(data.name || '');
        setIsLoggedIn(true);
        try {
          sessionStorage.setItem(SESSION_KEY, token);
        } catch {
          /* noop */
        }
      } else {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* noop */
        }
        if (data.error) setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg('Erro de conexão ao validar seu acesso.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestLink = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setLinkSent(true);
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
    setIsLoggedIn(false);
    setOrders([]);
    setName('');
    setPhone('');
    setLinkSent(false);
  };

  const handleRepeatOrder = (order) => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) return;
    order.items.forEach((item) => {
      const id = item.product_id;
      const qty = Number(item.quantity) || 1;
      if (id) addToCart(id, qty);
    });
    setRepeatSuccess(order.id);
    setTimeout(() => setRepeatSuccess(null), 3000);
  };

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', paddingBottom: '60px', paddingTop: '110px' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'white', marginBottom: '8px' }}>
            Minha Conta &amp; Histórico de Pedidos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Acompanhe seus orçamentos e repita pedidos anteriores com 1 clique.
          </p>
        </div>

        {verifying ? (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '28px', color: 'var(--primary)', marginBottom: '12px' }}></i>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Validando seu acesso...</p>
          </div>
        ) : isLoggedIn ? (
          /* Histórico de Pedidos */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {name ? (
                  <>Conectado como <strong style={{ color: 'var(--primary)' }}>{name}</strong></>
                ) : (
                  'Acesso verificado'
                )}
              </span>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
              >
                Sair
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '36px', marginBottom: '12px', color: 'var(--primary)' }}></i>
                <p style={{ marginBottom: '16px' }}>Nenhum pedido anterior encontrado para este número.</p>
                <Link
                  href="/boutique"
                  style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--primary)', color: '#000', fontWeight: '600', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
                >
                  Ir para a Boutique
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>PEDIDO #{order.id}</span>
                        <span style={{ fontSize: '13px', color: 'white' }}>
                          {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', display: 'block' }}>
                          R$ {Number(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {order.status === 'completed' ? 'Concluído' : 'Orçamento'}
                        </span>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items.map((it, idx) => (
                          <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span>{it.quantity}× {it.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link href="/carrinho" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
                        Ver Carrinho &rarr;
                      </Link>
                      <button
                        onClick={() => handleRepeatOrder(order)}
                        style={{ padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: repeatSuccess === order.id ? '#25D366' : 'var(--primary)', color: repeatSuccess === order.id ? '#fff' : '#000', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {repeatSuccess === order.id ? (
                          <><i className="fa-solid fa-check"></i> Itens Adicionados!</>
                        ) : (
                          <><i className="fa-solid fa-rotate-right"></i> Repetir este Pedido</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : linkSent ? (
          /* Confirmação de envio do link */
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '16px' }}></i>
            <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '10px' }}>Verifique seu e-mail</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
              Se houver um cadastro com e-mail vinculado a este número, enviamos um link de acesso.
              O link vale por <strong>15 minutos</strong> — confira também a caixa de spam.
            </p>
            <button
              onClick={() => { setLinkSent(false); setPhone(''); }}
              style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: '10px 18px', borderRadius: 'var(--radius-sm)' }}
            >
              Usar outro número
            </button>
          </div>
        ) : (
          /* Solicitação de acesso por telefone */
          <div style={cardStyle}>
            <form onSubmit={handleRequestLink} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px', fontWeight: '600' }}>
                  Número do WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  placeholder="(24) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '15px' }}
                  required
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Enviaremos um link de acesso seguro para o e-mail vinculado ao seu cadastro.
                </p>
              </div>

              {errorMsg && <div style={{ color: '#ef4444', fontSize: '13px' }}>{errorMsg}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Enviando...' : 'Receber Link de Acesso'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
