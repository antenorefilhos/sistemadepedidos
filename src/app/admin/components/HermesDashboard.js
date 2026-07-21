'use client';

import { useMemo, useState } from 'react';
import HermesChatPanel from './HermesChatPanel';
import HermesConfigModal from './HermesConfigModal';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';
import { calculateTotalRevenue, getSalesByCategory, getSellersPerformance } from '@/components/admin/lib/analytics';
import StatCard from '@/components/admin/ui/StatCard';

const TABS = [
  { id: 'chat', icon: 'fa-robot', label: 'Hermes AI (Chat)' },
  { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics (CMO/CFO)' },
  { id: 'logistics', icon: 'fa-truck-fast', label: 'Logística (COO)' },
  { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventário (CTO)' },
  { id: 'rh', icon: 'fa-users', label: 'RH & Vendas (CEO)' },
];

export default function HermesDashboard({ orders, sellers, products, password }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [showConfig, setShowConfig] = useState(false);

  const revenue = useMemo(() => calculateTotalRevenue(orders, products, false), [orders, products]);
  const salesByCategory = useMemo(() => getSalesByCategory(orders, products), [orders, products]);
  const sellersPerformance = useMemo(() => getSellersPerformance(orders, products), [orders, products]);
  const maxSellerRevenue = Math.max(...sellersPerformance.map((s) => s.revenue), 1);
  const avgTicket = orders.length > 0 ? revenue / orders.length : 0;

  const buildDataContext = () => ({
    ordersCount: orders.length,
    revenue,
    avgTicket,
    sellersData: sellersPerformance.map((s) => ({ name: s.name, rev: s.revenue })),
    productsCount: products.length,
    topCategories: salesByCategory.map((c) => c[0]),
  });

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease]">
      <div className="tabs tabs-boxed bg-base-200/50 p-2 gap-2 overflow-x-auto flex-nowrap justify-start">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab h-11 gap-2 font-bold px-6 whitespace-nowrap transition-all duration-300 ${activeTab === tab.id ? 'tab-active bg-primary text-primary-content shadow-lg' : 'text-base-content/60 hover:text-base-content'}`}
          >
            <i className={`fa-solid ${tab.icon}`} aria-hidden="true"></i> {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
        <HermesChatPanel password={password} buildDataContext={buildDataContext} onOpenConfig={() => setShowConfig(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <h4 className="text-base-content/80 text-sm font-bold uppercase tracking-widest mb-6">
            <i className="fa-solid fa-chart-pie mr-2" aria-hidden="true"></i>Mapeamento de Demanda por Setor
          </h4>
          <div className="flex flex-col gap-6">
            {salesByCategory.map(([sector, amount]) => {
              const percentage = Math.round((amount / (revenue || 1)) * 100);
              return (
                <div key={sector}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-base-content/70">{sector}</span>
                    <span className="font-bold text-base-content tabular-nums">
                      {formatCurrencyBRL(amount)} ({percentage}%)
                    </span>
                  </div>
                  <progress
                    className={`progress w-full h-3 ${sector === 'Adega de Vinhos' ? 'progress-error' : 'progress-primary'}`}
                    value={percentage}
                    max="100"
                  ></progress>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <h4 className="text-base-content/80 text-sm font-bold uppercase tracking-widest mb-6">
            <i className="fa-solid fa-users mr-2" aria-hidden="true"></i>Faturamento por Vendedor
          </h4>
          <div className="flex flex-col gap-6 max-h-[300px] overflow-y-auto pr-2">
            {sellersPerformance.map((seller) => {
              const percentage = Math.round((seller.revenue / maxSellerRevenue) * 100);
              return (
                <div key={seller.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-base-content/70">{seller.name}</span>
                    <span className="font-bold text-base-content tabular-nums">{formatCurrencyBRL(seller.revenue)}</span>
                  </div>
                  <progress
                    className={`progress w-full h-3 ${seller.name === 'Site Direto' ? 'progress-neutral' : 'progress-primary'}`}
                    value={percentage}
                    max="100"
                  ></progress>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={activeTab === 'analytics' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h3 className="text-primary text-base font-bold mb-2">
            <i className="fa-solid fa-chart-pie mr-3" aria-hidden="true"></i>Analytics &amp; Telemetria
          </h3>
          <p className="text-base-content/60 text-sm">
            Módulo em construção. Integrando com a tabela <code>telemetry_events</code> para calcular CAC, LTV e taxa de conversão em tempo real.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <StatCard icon="fa-circle-dollar-to-slot" tone="success" label="Receita Total" value={formatCurrencyBRL(revenue)} />
            <StatCard icon="fa-calculator" tone="info" label="Ticket Médio" value={formatCurrencyBRL(avgTicket)} />
            <StatCard icon="fa-file-invoice" tone="primary" label="Total de Pedidos" value={orders.length} />
          </div>
        </div>
      </div>

      <div className={activeTab === 'logistics' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h3 className="text-primary text-base font-bold mb-2">
            <i className="fa-solid fa-truck-fast mr-3" aria-hidden="true"></i>Kanban de Logística
          </h3>
          <p className="text-base-content/60 text-sm">Gerenciamento visual de entrega de orçamentos e despachos. Em breve.</p>
        </div>
      </div>

      <div className={activeTab === 'inventory' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h3 className="text-primary text-base font-bold mb-2">
            <i className="fa-solid fa-boxes-stacked mr-3" aria-hidden="true"></i>Alertas de Inventário
          </h3>
          <p className="text-base-content/60 text-sm">Conectado ao módulo Solidcon. Monitoramento de ruptura de estoque.</p>
        </div>
      </div>

      <div className={activeTab === 'rh' ? 'block animate-[fadeIn_0.3s_ease]' : 'hidden'}>
        <div className="bg-base-200/50 p-8 rounded-2xl border border-base-300">
          <h3 className="text-primary text-base font-bold mb-6">
            <i className="fa-solid fa-users mr-3" aria-hidden="true"></i>Ranking de Vendedores
          </h3>
          <div className="flex flex-col gap-2">
            {sellersPerformance.map((s, idx) => (
              <div
                key={s.name}
                className={`flex justify-between items-center p-5 rounded-xl border transition-all ${idx === 0 ? 'bg-primary/10 border-primary/30' : 'bg-base-100 border-base-300 hover:border-base-content/20'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${idx === 0 ? 'text-primary' : 'text-base-content/40'}`}>#{idx + 1}</span>
                  <span className={`${idx === 0 ? 'font-bold text-base-content' : 'font-medium text-base-content/80'}`}>{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold tabular-nums">{formatCurrencyBRL(s.revenue)}</div>
                  <div className="text-xs text-base-content/60 mt-1">
                    {s.count} pedidos <span className="opacity-50 mx-1">•</span> T.M: {formatCurrencyBRL(s.avgTicket)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <HermesConfigModal open={showConfig} onClose={() => setShowConfig(false)} password={password} />
    </div>
  );
}
