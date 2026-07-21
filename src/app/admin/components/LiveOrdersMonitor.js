'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { playNotificationSound } from '@/lib/notifications';

// Antes buscava pedidos por conta própria a cada 10s, em paralelo ao polling de 30s do
// shell (dois pollers batendo no mesmo endpoint). Agora só renderiza os `orders` que o
// shell já mantém atualizado — o toggle de som aqui controla o mesmo localStorage que o
// polling do shell já lê, então o comportamento de alerta continua unificado.
export default function LiveOrdersMonitor({ orders, password, onRefresh }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setIsSoundEnabled(localStorage.getItem('admin_sound_enabled') !== 'false');
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminFetch('/api/admin/orders', { password, method: 'PUT', body: { orderId, status: newStatus } });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao atualizar pedido: ${err.message}`);
    }
  };

  const toggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    localStorage.setItem('admin_sound_enabled', String(nextState));
    if (nextState) {
      playNotificationSound();
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const inProgressOrders = orders.filter((o) => o.status === 'viewed');
  const completedOrders = orders.filter((o) => o.status === 'completed').slice(0, 10);

  return (
    <div className="bg-base-200 min-h-[calc(100vh-100px)] p-6 w-full animate-[fadeIn_0.3s_ease]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-base-content mb-1">Monitor Ao Vivo</h3>
          <p className="text-base-content/60 text-sm m-0">Reflete o mesmo polling de pedidos do painel (até 30s de atraso).</p>
        </div>

        <button
          onClick={toggleSound}
          className={`btn shadow-sm gap-2 ${isSoundEnabled ? 'btn-success bg-success/20 text-success hover:bg-success/30 border-success/30' : 'btn-error bg-error/20 text-error hover:bg-error/30 border-error/30'}`}
        >
          <i className={`fa-solid ${isSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`} aria-hidden="true"></i>
          {isSoundEnabled ? 'Alertas Ativados' : 'Alertas Desativados'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <MonitorColumn title="Novos (Pendentes)" tone="error" count={pendingOrders.length}>
          {pendingOrders.length === 0 && <EmptyColumnMessage text="Nenhum pedido novo." />}
          {pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'viewed')} actionText="Iniciar Atendimento" actionClass="btn-info" />
          ))}
        </MonitorColumn>

        <MonitorColumn title="Em Atendimento" tone="info" count={inProgressOrders.length}>
          {inProgressOrders.length === 0 && <EmptyColumnMessage text="Nenhum pedido em atendimento." />}
          {inProgressOrders.map((order) => (
            <OrderCard key={order.id} order={order} onMove={() => updateOrderStatus(order.id, 'completed')} actionText="Concluir / Entregar" actionClass="btn-success" />
          ))}
        </MonitorColumn>

        <MonitorColumn title="Concluídos (Recentes)" tone="success">
          {completedOrders.length === 0 && <EmptyColumnMessage text="Nenhum pedido recente." />}
          {completedOrders.map((order) => (
            <OrderCard key={order.id} order={order} readOnly />
          ))}
        </MonitorColumn>
      </div>
    </div>
  );
}

// Tailwind precisa das classes completas e literais no código-fonte para gerá-las —
// por isso um mapa estático em vez de montar `bg-${tone}/10` dinamicamente.
const TONE_CLASSES = {
  error: { header: 'bg-error/10 border-b border-error/20', title: 'text-error', badge: 'badge-error' },
  info: { header: 'bg-info/10 border-b border-info/20', title: 'text-info', badge: 'badge-info' },
  success: { header: 'bg-success/10 border-b border-success/20', title: 'text-success', badge: 'badge-success' },
};

function MonitorColumn({ title, tone, count, children }) {
  const classes = TONE_CLASSES[tone];
  return (
    <div className="bg-base-100/50 rounded-2xl border border-base-300 flex flex-col h-full overflow-hidden shadow-sm">
      <div className={`p-4 flex justify-between items-center ${classes.header}`}>
        <h4 className={`m-0 font-bold text-sm ${classes.title}`}>{title}</h4>
        {count !== undefined && <div className={`badge badge-sm ${classes.badge}`}>{count}</div>}
      </div>
      <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function EmptyColumnMessage({ text }) {
  return <p className="text-base-content/50 text-center py-8 italic text-sm">{text}</p>;
}

function OrderCard({ order, onMove, actionText, actionClass, readOnly }) {
  const isPending = order.status === 'pending';

  return (
    <div
      className={`border rounded-xl p-4 bg-base-200/50 transition-all hover:bg-base-200 shadow-sm
      ${isPending ? 'border-error/30 border-l-4 border-l-error' : 'border-base-300 border-l border-l-base-300'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs text-base-content/50 font-mono tracking-wider">#{order.id}</span>
          <h5 className="mt-1 font-bold text-base-content text-sm">{order.customer_name}</h5>
        </div>
        <span className="text-xs text-base-content/50 font-mono bg-base-300 px-2 py-1 rounded-md">
          {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="text-xs text-base-content/80 mb-4 flex flex-col gap-1">
        <p className="m-0 flex items-center gap-2">
          <i className="fa-solid fa-mobile-screen-button text-base-content/40 w-4" aria-hidden="true"></i> {order.customer_whatsapp}
        </p>
        <p className="m-0 flex items-center gap-2">
          <i className="fa-solid fa-user-tag text-base-content/40 w-4" aria-hidden="true"></i> {order.seller_name || 'Venda Direta (Site)'}
        </p>

        <div className="mt-3 bg-base-300/30 p-3 rounded-lg border border-base-300 max-h-[120px] overflow-y-auto">
          <p className="m-0 mb-2 font-bold text-xs text-base-content/50 uppercase tracking-widest">Itens ({order.items?.length || 0}):</p>
          <div className="flex flex-col gap-2">
            {order.items?.map((i, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-base-content/5 pb-1 last:border-0 last:pb-0">
                <span className="whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                  <span className="font-bold mr-1">{i.quantity}x</span> {i.product_title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <button onClick={onMove} className={`btn btn-sm w-full font-bold shadow-sm ${actionClass}`}>
          {actionText}
        </button>
      )}
    </div>
  );
}
