'use client';

import { useState, useEffect, useRef } from 'react';

// Função para tocar um som agradável de notificação (Web Audio API)
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (err) {
    console.error('Audio API not supported or blocked', err);
  }
};

export default function LiveOrdersMonitor({ password }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  
  const pollingInterval = useRef(null);

  const fetchOrders = async (isInitial = false) => {
    try {
      const res = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError(null);
        
        if (!isInitial) {
          const latestPending = data.filter(o => o.status === 'pending');
          const maxId = latestPending.length > 0 ? Math.max(...latestPending.map(o => o.id)) : 0;
          
          if (maxId > lastOrderId) {
            setLastOrderId(maxId);
            if (isSoundEnabled) {
              playNotificationSound();
            }
          }
        } else {
          const latestPending = data.filter(o => o.status === 'pending');
          const maxId = latestPending.length > 0 ? Math.max(...latestPending.map(o => o.id)) : 0;
          setLastOrderId(maxId);
        }
      } else {
        setError('Erro ao carregar pedidos.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Erro de conexão.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    
    pollingInterval.current = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [password, lastOrderId, isSoundEnabled]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Erro ao atualizar status do pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar.');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'completed').slice(0, 10);

  const enableSound = () => {
    setIsSoundEnabled(true);
    playNotificationSound();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando monitor...</div>;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: 'calc(100vh - 100px)', padding: '20px', fontFamily: 'var(--font-sans)', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>Monitor de Pedidos (Ao Vivo)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Atualização automática a cada 10 segundos.</p>
        </div>
        
        <button 
          onClick={enableSound}
          style={{
            padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold',
            backgroundColor: isSoundEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isSoundEnabled ? '#4ade80' : '#f87171'
          }}
        >
          {isSoundEnabled ? '🔊 Alertas Ativados' : '🔇 Ativar Alerta Sonoro'}
        </button>
      </div>

      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', height: 'calc(100vh - 200px)' }}>
        {/* Coluna 1: Novos Pedidos */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', color: '#fca5a5', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Novos (Pendentes)
              <span style={{ backgroundColor: 'rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>{pendingOrders.length}</span>
            </h3>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingOrders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nenhum pedido novo.</p>}
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'processing')} actionText="Preparar Pedido" actionColor="#3b82f6" />
            ))}
          </div>
        </div>

        {/* Coluna 2: Em Preparo */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', color: '#93c5fd', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Em Preparação
              <span style={{ backgroundColor: 'rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>{preparingOrders.length}</span>
            </h3>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {preparingOrders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nenhum pedido em preparo.</p>}
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'completed')} actionText="Concluir / Entregar" actionColor="#22c55e" />
            ))}
          </div>
        </div>

        {/* Coluna 3: Concluídos */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '16px', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', color: '#86efac', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Concluídos (Recentes)
            </h3>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', opacity: 0.8 }}>
            {completedOrders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nenhum pedido recente.</p>}
            {completedOrders.map(order => (
              <OrderCard key={order.id} order={order} readOnly />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Card
function OrderCard({ order, onMove, actionText, actionColor, readOnly }) {
  const isPending = order.status === 'pending';
  
  return (
    <div style={{ 
      border: '1px solid',
      borderColor: isPending ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
      borderLeft: isPending ? '4px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', 
      padding: '16px', 
      backgroundColor: 'rgba(255,255,255,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{order.id}</span>
          <h4 style={{ margin: '2px 0 0 0', fontWeight: 'bold', color: 'white', fontSize: '15px' }}>{order.customer_name}</h4>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      
      <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 4px 0' }}>📱 {order.customer_phone}</p>
        <p style={{ margin: '0 0 8px 0' }}>👤 {order.seller_name || 'Venda Direta (Site)'}</p>
        
        <div style={{ marginTop: '8px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '100px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Itens ({order.items?.length || 0}):</p>
          {order.items && order.items.map((i, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '4px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.quantity}x {i.product_title}</span>
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <button 
          onClick={onMove}
          style={{
            width: '100%', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
            backgroundColor: actionColor, color: 'white', border: 'none'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
