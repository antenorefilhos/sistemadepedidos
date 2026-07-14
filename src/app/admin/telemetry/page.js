'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TelemetryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pegar o password via search params (da URL ?pass=xxx) ou sessionStorage
    const params = new URLSearchParams(window.location.search);
    const pass = params.get('pass') || sessionStorage.getItem('admin_auth_pass');
    
    if (!pass) {
      setError('Acesso negado. Senha de administrador não encontrada.');
      setLoading(false);
      return;
    }

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/admin/telemetry?auth=${encodeURIComponent(pass)}`);
        if (!res.ok) throw new Error('Falha ao carregar dados de telemetria.');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);
  return (
    <div className="min-h-screen bg-base-200 p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 border-b border-base-300 pb-5">
          <div>
            <h1 className="text-3xl font-serif text-primary mb-1">
              Telemetria & Inteligência
            </h1>
            <p className="text-sm text-base-content/60 m-0">
              Visão em tempo real da jornada de compra do usuário (Top Tier Analytics)
            </p>
          </div>
          <Link href="/admin">
            <button className="btn btn-outline btn-sm shadow-sm">
              <i className="fa-solid fa-arrow-left mr-2"></i> Voltar ao Admin
            </button>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center p-16 text-base-content/60 flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p>Carregando relatórios de telemetria E2E...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error bg-error/20 text-error border-error/30 rounded-xl">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            
            {/* KPI 1 */}
            <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col items-center text-center p-6">
              <i className="fa-solid fa-users text-3xl text-primary mb-4"></i>
              <h3 className="text-xs text-base-content/60 uppercase tracking-widest mb-2">
                Visitantes Únicos
              </h3>
              <p className="text-4xl font-bold text-base-content m-0 leading-none">
                {data.totalUniqueVisitors}
              </p>
            </div>

            {/* KPI 2 */}
            <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col items-center text-center p-6">
              <i className="fa-solid fa-cart-shopping text-3xl text-primary mb-4"></i>
              <h3 className="text-xs text-base-content/60 uppercase tracking-widest mb-2">
                Eventos Add ao Carrinho
              </h3>
              <p className="text-4xl font-bold text-base-content m-0 leading-none">
                {data.addToCartCount}
              </p>
            </div>

            {/* KPI 3 */}
            <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col items-center text-center p-6">
              <i className="fa-brands fa-whatsapp text-3xl text-success mb-4"></i>
              <h3 className="text-xs text-base-content/60 uppercase tracking-widest mb-2">
                Checkouts Convertidos
              </h3>
              <p className="text-4xl font-bold text-base-content m-0 leading-none">
                {data.checkoutCount}
              </p>
            </div>

            {/* KPI 4 */}
            <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col items-center text-center p-6">
              <i className={`fa-solid fa-chart-line text-3xl mb-4 ${data.cartAbandonmentRate > 50 ? 'text-error' : 'text-primary'}`}></i>
              <h3 className="text-xs text-base-content/60 uppercase tracking-widest mb-2">
                Taxa de Abandono
              </h3>
              <p className="text-4xl font-bold text-base-content m-0 leading-none">
                {data.cartAbandonmentRate}%
              </p>
            </div>

          </div>
        ) : null}

        {/* Detalhamento Visual do Funil (Native CSS Chart Example) */}
        {data && (
          <div className="card bg-base-100 border border-base-300 shadow-sm p-8">
            <h3 className="text-xl text-base-content mb-8 flex items-center gap-3">
              <i className="fa-solid fa-filter text-primary"></i> Funil de Conversão
            </h3>
            
            <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
              {/* Top of Funnel */}
              <div>
                <div className="flex justify-between text-xs text-base-content/60 mb-2 font-bold">
                  <span>Páginas Visitadas (Top Funnel)</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-4 bg-base-300 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Middle of Funnel */}
              <div>
                <div className="flex justify-between text-xs text-base-content/60 mb-2 font-bold">
                  <span>Adições ao Carrinho (Mid Funnel)</span>
                  <span>{data.totalUniqueVisitors > 0 ? Math.round((data.addToCartCount / data.totalUniqueVisitors) * 100) : 0}%</span>
                </div>
                <div className="w-full h-4 bg-base-300 rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ 
                    width: `${data.totalUniqueVisitors > 0 ? Math.round((data.addToCartCount / data.totalUniqueVisitors) * 100) : 0}%` 
                  }}></div>
                </div>
              </div>

              {/* Bottom of Funnel */}
              <div>
                <div className="flex justify-between text-xs text-base-content/60 mb-2 font-bold">
                  <span>Checkouts Fechados no WhatsApp (Bottom Funnel)</span>
                  <span>{data.addToCartCount > 0 ? Math.round((data.checkoutCount / data.addToCartCount) * 100) : 0}% (da etapa anterior)</span>
                </div>
                <div className="w-full h-4 bg-base-300 rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ 
                    width: `${data.addToCartCount > 0 ? Math.round((data.checkoutCount / data.addToCartCount) * 100) : 0}%` 
                  }}></div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
