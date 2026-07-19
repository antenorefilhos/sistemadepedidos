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

// Função para disparar a notificação nativa no navegador do Celular ou PC
const showNativeNotification = (order) => {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      const notification = new Notification(`Novo Pedido de Orçamento!`, {
        body: `Cliente: ${order.customer_name}\nID: #${order.id}`,
        icon: '/icon.png',
        tag: `order-${order.id}`,
        requireInteraction: true
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  } catch (err) {
    console.error('Error showing native notification:', err);
  }
};

export default function LiveOrdersMonitor({ password }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true); // Default true

  useEffect(() => {
    const saved = localStorage.getItem('admin_sound_enabled');
    if (saved === 'false') {
      setIsSoundEnabled(false);
    }
  }, []);
  
  const pollingInterval = useRef(null);

  const fetchOrders = async (isInitial = false) => {
    try {
      const res = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError(null);
        
        const latestPending = data.filter(o => o.status === 'pending');
        const maxId = latestPending.length > 0 ? Math.max(...latestPending.map(o => o.id)) : 0;

        if (!isInitial) {
          if (maxId > lastOrderId) {
            setLastOrderId(maxId);
            if (isSoundEnabled) {
              playNotificationSound();
              // Achar o novo pedido para a notificação
              const newOrder = latestPending.find(o => o.id === maxId);
              if (newOrder) {
                showNativeNotification(newOrder);
              }
            }
          }
        } else {
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

  const toggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    localStorage.setItem('admin_sound_enabled', String(nextState));
    
    if (nextState) {
      playNotificationSound();
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-base-content/60 flex flex-col items-center gap-4"><span className="loading loading-spinner loading-lg text-primary"></span>Carregando monitor...</div>;

  return (
    <div className="bg-base-200 min-h-[calc(100vh-100px)] p-6 w-full animate-[fadeIn_0.3s_ease]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-primary mb-1">Monitor de Pedidos (Ao Vivo)</h2>
          <p className="text-base-content/60 text-sm m-0">Atualização automática a cada 10 segundos.</p>
        </div>
        
        <button 
          onClick={toggleSound}
          className={`btn shadow-sm gap-2 ${isSoundEnabled ? 'btn-success bg-success/20 text-success hover:bg-success/30 border-success/30' : 'btn-error bg-error/20 text-error hover:bg-error/30 border-error/30'}`}
        >
          {isSoundEnabled ? '🔊 Alertas & Notificações Ativadas' : '🔇 Alertas & Notificações Desativadas'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error bg-error/20 text-error border-error/30 mb-4 rounded-xl">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Coluna 1: Novos Pedidos */}
        <div className="bg-base-100/50 rounded-2xl border border-base-300 flex flex-col h-full overflow-hidden shadow-sm">
          <div className="bg-error/10 p-4 border-b border-error/20 flex justify-between items-center">
            <h3 className="m-0 font-bold text-error flex items-center gap-2">
              Novos (Pendentes)
            </h3>
            <div className="badge badge-error badge-sm">{pendingOrders.length}</div>
          </div>
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
            {pendingOrders.length === 0 && <p className="text-base-content/50 text-center py-8 italic text-sm">Nenhum pedido novo.</p>}
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'processing')} actionText="Preparar Pedido" actionClass="btn-info" />
            ))}
          </div>
        </div>

        {/* Coluna 2: Em Preparo */}
        <div className="bg-base-100/50 rounded-2xl border border-base-300 flex flex-col h-full overflow-hidden shadow-sm">
          <div className="bg-info/10 p-4 border-b border-info/20 flex justify-between items-center">
            <h3 className="m-0 font-bold text-info flex items-center gap-2">
              Em Preparação
            </h3>
            <div className="badge badge-info badge-sm">{preparingOrders.length}</div>
          </div>
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
            {preparingOrders.length === 0 && <p className="text-base-content/50 text-center py-8 italic text-sm">Nenhum pedido em preparo.</p>}
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'completed')} actionText="Concluir / Entregar" actionClass="btn-success" />
            ))}
          </div>
        </div>

        {/* Coluna 3: Concluídos */}
        <div className="bg-base-100/50 rounded-2xl border border-base-300 flex flex-col h-full overflow-hidden shadow-sm opacity-80">
          <div className="bg-success/10 p-4 border-b border-success/20 flex justify-between items-center">
            <h3 className="m-0 font-bold text-success flex items-center gap-2">
              Concluídos (Recentes)
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
            {completedOrders.length === 0 && <p className="text-base-content/50 text-center py-8 italic text-sm">Nenhum pedido recente.</p>}
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
function OrderCard({ order, onMove, actionText, actionClass, readOnly }) {
  const isPending = order.status === 'pending';
  
  return (
    <div className={`border rounded-xl p-4 bg-base-200/50 transition-all hover:bg-base-200 shadow-sm
      ${isPending ? 'border-error/30 border-l-4 border-l-error' : 'border-base-300 border-l border-l-base-300'}`}>
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs text-base-content/50 font-mono tracking-wider">#{order.id}</span>
          <h4 className="mt-1 font-bold text-base-content text-[15px]">{order.customer_name}</h4>
        </div>
        <span className="text-[11px] text-base-content/50 font-mono bg-base-300 px-2 py-1 rounded-md">
          {new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
      
      <div className="text-[13px] text-base-content/80 mb-4 flex flex-col gap-1">
        <p className="m-0 flex items-center gap-2"><i className="fa-solid fa-mobile-screen-button text-base-content/40 w-4"></i> {order.customer_phone}</p>
        <p className="m-0 flex items-center gap-2"><i className="fa-solid fa-user-tag text-base-content/40 w-4"></i> {order.seller_name || 'Venda Direta (Site)'}</p>
        
        <div className="mt-3 bg-base-300/30 p-3 rounded-lg border border-base-300 max-h-[120px] overflow-y-auto">
          <p className="m-0 mb-2 font-bold text-[11px] text-base-content/50 uppercase tracking-widest">Itens ({order.items?.length || 0}):</p>
          <div className="flex flex-col gap-2">
            {order.items && order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between items-center text-[12px] border-b border-base-content/5 pb-1 last:border-0 last:pb-0">
                <span className="whitespace-nowrap overflow-hidden text-ellipsis mr-2"><span className="font-bold mr-1">{i.quantity}x</span> {i.product_title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <button 
          onClick={onMove}
          className={`btn btn-sm w-full font-bold shadow-sm ${actionClass}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
