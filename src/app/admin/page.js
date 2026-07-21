'use client';

import { useEffect, useMemo, useState } from 'react';
import { ADMIN_TAB_GROUPS, ADMIN_TABS_FLAT, ADMIN_EXTERNAL_LINKS } from './components/adminTabs';
import AdminLogin from './components/AdminLogin';
import OrdersManager from './components/OrdersManager';
import ProductsManager from './components/ProductsManager';
import CategoriesManager from './components/CategoriesManager';
import SellersManager from './components/SellersManager';
import LiveOrdersMonitor from './components/LiveOrdersMonitor';
import HermesDashboard from './components/HermesDashboard';
import SolidconIntegration from './components/SolidconIntegration';
import StoreSettings from './components/StoreSettings';
import RecipeEditor from './components/RecipeEditor';
import MenuRestaurantEditor from './components/MenuRestaurantEditor';
import BiolinksManager from './components/BiolinksManager';
import ReviewsModerator from './components/ReviewsModerator';
import CustomersManager from './components/CustomersManager';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';
import { useToast } from '@/components/admin/ui/Toast';
import StatCard from '@/components/admin/ui/StatCard';
import { playNotificationSound, showNativeNotification } from '@/lib/notifications';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPasswordInput] = useState('');
  const [role, setRole] = useState(null); // 'admin' ou 'manager'
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeTab, setActiveTab] = useState('orders');
  const [dbLatency, setDbLatency] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  // Latência do banco (medida a cada 15s enquanto autenticado)
  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        const res = await fetch(`/api/admin/settings?auth=${encodeURIComponent(password)}`);
        setDbLatency(res.ok ? Math.round(performance.now() - start) : -1);
      } catch {
        setDbLatency(-1);
      }
    };
    if (isAuthenticated) {
      measureLatency();
      const interval = setInterval(measureLatency, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  const checkAuth = async (pass) => {
    if (!pass) {
      setIsCheckingAuth(false);
      return;
    }
    setLoading(true);
    try {
      const { role: detectedRole } = await adminFetch('/api/admin/auth', { password: pass });
      setRole(detectedRole);
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth_pass', pass);
    } catch (err) {
      setIsAuthenticated(false);
      setRole(null);
      sessionStorage.removeItem('admin_auth_pass');
      toast.error('Senha incorreta. Tente novamente.');
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  // Sessão + aba ativa persistidas, e classe/tema do body (redundante com AdminThemeManager
  // global — mantido aqui só para o cleanup no unmount desta página específica)
  useEffect(() => {
    document.body.classList.add('admin-body');
    document.documentElement.setAttribute('data-theme', 'light');

    const savedTab = sessionStorage.getItem('admin_active_tab');
    if (savedTab) setActiveTab(savedTab);

    const saved = sessionStorage.getItem('admin_auth_pass');
    if (saved) {
      setPasswordInput(saved);
      checkAuth(saved);
    } else {
      setIsCheckingAuth(false);
    }

    return () => {
      document.body.classList.remove('admin-body');
      document.documentElement.removeAttribute('data-theme');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab) sessionStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, sellersData, productsData, categoriesData] = await Promise.all([
        adminFetch('/api/admin/orders', { password }),
        adminFetch('/api/admin/sellers', { password }),
        adminFetch('/api/admin/products', { password }),
        adminFetch('/api/admin/categories', { password }),
      ]);
      setOrders(ordersData);
      setSellers(sellersData);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      if (err.status && err.status !== 0) {
        // Sessão inválida/expirada
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth_pass');
      } else {
        console.error('Error loading admin data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, password]);

  useEffect(() => {
    if (isAuthenticated && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  // Polling silencioso a cada 30s para novos pedidos, com alerta sonoro + push nativo
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const latestOrders = await adminFetch('/api/admin/orders', { password });
        setOrders((prevOrders) => {
          if (prevOrders.length > 0 && latestOrders.length > 0) {
            const prevIds = new Set(prevOrders.map((o) => o.id));
            const newOrders = latestOrders.filter((o) => !prevIds.has(o.id));
            if (newOrders.length > 0) {
              const soundEnabled = localStorage.getItem('admin_sound_enabled') !== 'false';
              if (soundEnabled) {
                playNotificationSound();
                newOrders.forEach((order) => showNativeNotification(order));
              }
            }
          }
          return latestOrders;
        });
      } catch (err) {
        console.warn('Failed to poll latest orders:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, password]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password) checkAuth(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth_pass');
    setPasswordInput('');
    setIsAuthenticated(false);
    setRole(null);
    setOrders([]);
    setSellers([]);
    setProducts([]);
    setCategories([]);
  };

  // Totais do dashboard: sempre refletem TODOS os pedidos, não o filtro local da aba
  // Orçamentos (antes os cards do topo mudavam silenciosamente ao digitar na busca).
  const totalOrders = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;

  const { salesRevenue, totalRevenue } = useMemo(() => {
    const calc = (onlyCompleted) => {
      let total = 0;
      orders.forEach((o) => {
        if (onlyCompleted && o.status !== 'completed') return;
        o.items.forEach((i) => {
          const itemPrice = i.price || products.find((p) => p.title === i.product_title)?.preco || 0;
          if (itemPrice) total += itemPrice * i.quantity;
        });
      });
      return total;
    };
    return { salesRevenue: calc(true), totalRevenue: calc(false) };
  }, [orders, products]);

  const ticketMedio = completedOrdersCount > 0 ? salesRevenue / completedOrdersCount : 0;

  const tabCounts = { orders: totalOrders, products: products.length, categories: categories.length, sellers: sellers.length };

  if (isCheckingAuth) {
    return (
      <div className="w-full flex-1 min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center p-4 bg-base-200 gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-xs text-base-content/50 uppercase tracking-wider font-bold">Verificando credenciais...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin password={password} onPasswordChange={setPasswordInput} onSubmit={handleLogin} />;
  }

  return (
    <div className="flex flex-1 w-full overflow-hidden">
      {/* Sidebar Premium */}
      <aside className="w-[220px] bg-base-300 border-r border-base-200 flex flex-col flex-shrink-0 hide-mobile">
        <div className="px-5 pt-7 pb-3">
          <h3 className="font-serif text-primary text-[15px] tracking-tight font-bold whitespace-nowrap mb-0.5">Antenor &amp; Filhos</h3>
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">Módulo de Expedição v1.2</span>
        </div>

        <ul className="menu w-full px-4 gap-1 flex-1 overflow-y-auto mt-4 text-sm font-medium">
          {ADMIN_TAB_GROUPS.map((group) => (
            <div key={group.id}>
              {group.title && <div className="divider text-xs uppercase opacity-50 my-2">{group.title}</div>}
              {group.tabs.map((tab) => (
                <li key={tab.key}>
                  <button onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? 'active' : ''}>
                    <i className={`fa-solid ${tab.icon} w-5 text-center`} aria-hidden="true"></i> {tab.label}
                    {tab.countKey && (
                      <span className="ml-auto text-xs opacity-60 font-mono">{tabCounts[tab.countKey]}</span>
                    )}
                  </button>
                </li>
              ))}
            </div>
          ))}

          <div className="divider text-xs uppercase opacity-50 my-2">Atalhos Externos</div>
          {ADMIN_EXTERNAL_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <i className={`fa-solid ${link.icon} w-5 text-center`} aria-hidden="true"></i> {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-base-200 mt-auto bg-base-300">
          <div className="text-xs text-base-content/65 uppercase tracking-wider mb-2 font-bold text-center">Status do Sistema</div>
          <div className="p-2.5 bg-base-200 rounded-lg flex items-center justify-between text-xs border border-base-100 mb-3">
            <span className="flex items-center gap-1.5 font-bold text-base-content/75">
              <span className={`w-2 h-2 rounded-full ${dbLatency !== -1 ? 'bg-success' : 'bg-error'} ${dbLatency !== -1 && dbLatency !== null ? 'animate-pulse' : ''}`}></span>
              Supabase DB
            </span>
            <span className="font-mono opacity-80 text-xs">{dbLatency !== null ? (dbLatency !== -1 ? `${dbLatency}ms` : 'offline') : 'lendo...'}</span>
          </div>
          <div className="text-xs text-base-content/70 mb-3 text-center">
            Usuário: <span className="font-bold">{role === 'admin' ? 'Administrador' : 'Gerente'}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm btn-block">
            Sair do Módulo
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-grow p-4 md:p-8 bg-base-200 overflow-y-auto w-full">
        {/* Navegação mobile — mesma fonte de dados do menu desktop (ADMIN_TAB_GROUPS) */}
        <div className="md:hidden mb-6">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="select select-bordered select-primary w-full font-bold"
            aria-label="Navegação do painel"
          >
            {ADMIN_TABS_FLAT.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
                {tab.countKey ? ` (${tabCounts[tab.countKey]})` : ''}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'monitor' && <LiveOrdersMonitor orders={orders} password={password} onRefresh={fetchData} />}

        {(activeTab === 'orders' || activeTab === 'stats') && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon="fa-circle-dollar-to-slot"
              tone="success"
              label="Faturamento Finalizado"
              value={formatCurrencyBRL(salesRevenue)}
              caption={`Base: ${completedOrdersCount} orçamentos concluídos`}
            />
            <StatCard
              icon="fa-file-invoice"
              tone="primary"
              label="Pedidos Totais"
              value={totalOrders}
              caption={`${pendingOrdersCount} pendentes de atendimento`}
              captionTone="warning"
            />
            <StatCard icon="fa-calculator" tone="info" label="Ticket Médio" value={formatCurrencyBRL(ticketMedio)} caption="Média por orçamento finalizado" />
            <StatCard
              icon="fa-arrows-to-eye"
              tone="wine"
              label="Demanda Solicitada"
              value={formatCurrencyBRL(totalRevenue)}
              caption="Volume bruto de todos os orçamentos"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-base-content/60">Carregando dados do servidor...</div>
        ) : (
          <div>
            {activeTab === 'orders' && (
              <OrdersManager orders={orders} sellers={sellers} products={products} role={role} password={password} onRefresh={fetchData} />
            )}

            {activeTab === 'products' && (
              <ProductsManager products={products} categories={categories} role={role} password={password} onRefresh={fetchData} />
            )}

            {activeTab === 'categories' && (
              <CategoriesManager categories={categories} role={role} password={password} onRefresh={fetchData} />
            )}

            {activeTab === 'sellers' && (
              <SellersManager sellers={sellers} role={role} password={password} onRefresh={fetchData} />
            )}

            {activeTab === 'stats' && <HermesDashboard orders={orders} sellers={sellers} products={products} password={password} />}

            {activeTab === 'solidcon' && <SolidconIntegration password={password} />}

            {activeTab === 'settings' && <StoreSettings password={password} />}

            {activeTab === 'customers' && <CustomersManager password={password} />}

            {activeTab === 'recipes' && <RecipeEditor password={password} products={products} />}

            {activeTab === 'menu_restaurant' && <MenuRestaurantEditor password={password} />}

            {activeTab === 'biolinks' && <BiolinksManager password={password} />}

            {activeTab === 'reviews' && <ReviewsModerator password={password} />}
          </div>
        )}
      </main>
    </div>
  );
}
