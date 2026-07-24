'use client';

import { useState, useEffect } from 'react';
import { StatCard, LoadingSpinner, EmptyState } from '@/components/admin';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';

export default function AnalyticsManager() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '7d', '30d'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, prodsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/products')
      ]);

      if (ordersRes.ok && prodsRes.ok) {
        const ordersData = await ordersRes.json();
        const prodsData = await prodsRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.orders || []));
        setProducts(Array.isArray(prodsData) ? prodsData : (prodsData.products || []));
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by time range
  const now = new Date();
  const filteredOrders = orders.filter(o => {
    if (timeRange === 'all') return true;
    const orderDate = new Date(o.created_at);
    const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
    if (timeRange === '7d') return diffDays <= 7;
    if (timeRange === '30d') return diffDays <= 30;
    return true;
  });

  // Calculate Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'aprovado');
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Breakdown by Seller
  const sellerStats = {};
  filteredOrders.forEach(o => {
    const seller = o.seller_name || 'Venda Direta / Site';
    const amount = Number(o.total_amount || o.total || 0);
    if (!sellerStats[seller]) {
      sellerStats[seller] = { count: 0, revenue: 0 };
    }
    sellerStats[seller].count += 1;
    sellerStats[seller].revenue += amount;
  });

  const sellerList = Object.keys(sellerStats).map(name => ({
    name,
    count: sellerStats[name].count,
    revenue: sellerStats[name].revenue
  })).sort((a, b) => b.revenue - a.revenue);

  if (loading) {
    return <LoadingSpinner text="Carregando Relatórios Gerenciais..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', fontFamily: 'var(--font-serif)' }}>
            Relatórios & Analytics Gerenciais
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Métricas de desempenho comercial, faturamento por canal e ticket médio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTimeRange('7d')}
            className={`btn btn-sm ${timeRange === '7d' ? 'btn-primary' : 'btn-outline'}`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`btn btn-sm ${timeRange === '30d' ? 'btn-primary' : 'btn-outline'}`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`btn btn-sm ${timeRange === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            Todo o Histórico
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Faturamento Acumulado"
          value={formatCurrencyBRL(totalRevenue)}
          icon="fa-sack-dollar"
          badge={{ text: 'Orçamentos', variant: 'success' }}
        />
        <StatCard
          title="Total de Orçamentos"
          value={totalOrdersCount}
          icon="fa-receipt"
          badge={{ text: 'Pedidos', variant: 'info' }}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrencyBRL(avgTicket)}
          icon="fa-chart-pie"
          badge={{ text: 'Por Orçamento', variant: 'warning' }}
        />
        <StatCard
          title="Pedidos Concluídos"
          value={completedOrders.length}
          icon="fa-check-double"
          badge={{ text: `${totalOrdersCount > 0 ? Math.round((completedOrders.length / totalOrdersCount) * 100) : 0}% Conversão`, variant: 'success' }}
        />
      </div>

      {/* Performance por Vendedor */}
      <div 
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}
      >
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '16px', fontWeight: '600' }}>
          Desempenho de Vendas por Atendente
        </h3>

        {sellerList.length === 0 ? (
          <EmptyState title="Nenhum dado de vendas no período" description="Altere o filtro de data acima para visualizar estatísticas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sellerList.map((s, idx) => {
              const percentage = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'white' }}>
                    <span>
                      <strong style={{ color: 'var(--primary)', marginRight: '6px' }}>#{idx + 1}</strong>
                      {s.name} ({s.count} {s.count === 1 ? 'orçamento' : 'orçamentos'})
                    </span>
                    <strong style={{ color: 'var(--primary)' }}>{formatCurrencyBRL(s.revenue)} ({percentage}%)</strong>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary) 0%, #E6C894 100%)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
