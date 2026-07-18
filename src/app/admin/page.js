'use client';

import { useState, useEffect } from 'react';
import LiveOrdersMonitor from './components/LiveOrdersMonitor';
import ProductEditor from './components/ProductEditor';
import HermesDashboard from './components/HermesDashboard';
import SolidconIntegration from './components/SolidconIntegration';
import StoreSettings from './components/StoreSettings';
import RecipeEditor from './components/RecipeEditor';
import MenuRestaurantEditor from './components/MenuRestaurantEditor';
import BiolinksManager from './components/BiolinksManager';
import ReviewsModerator from './components/ReviewsModerator';
import Fuse from 'fuse.js';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null); // 'admin' or 'manager'
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Data lists
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'categories', 'sellers', 'stats'
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Pagination/Search/Filters for products and orders
  const [prodSearch, setProdSearch] = useState('');
  const [prodTypeFilter, setProdTypeFilter] = useState('');
  const [prodPage, setProdPage] = useState(1);
  const prodPerPage = 20;

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderSellerFilter, setOrderSellerFilter] = useState('');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  // New/Editing Product Form Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null,
    title: '',
    slug: '',
    description: '',
    sku: '',
    peso: '',
    unidade_peso: 'g',
    preco: '',
    status: 'on',
    image_url: '',
    type: 'carnes_',
    pontuacao: '',
    categoryIds: []
  });

  // Category Modal Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    slug: '',
    type: 'sessoes_carnes_'
  });

  // Seller Form State
  const [newSeller, setNewSeller] = useState({ name: '', phone: '', slug: '' });

  const checkAuth = async (pass) => {
    if (!pass) {
      setIsCheckingAuth(false);
      return;
    }
    setLoading(true);
    try {
      const authRes = await fetch(`/api/admin/auth?auth=${encodeURIComponent(pass)}`);
      if (authRes.ok) {
        const { role: detectedRole } = await authRes.json();
        setRole(detectedRole);
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth_pass', pass);
      } else {
        setIsAuthenticated(false);
        setRole(null);
        sessionStorage.removeItem('admin_auth_pass');
        alert('Senha incorreta. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('admin-body');
    document.documentElement.setAttribute('data-theme', 'light');
    
    const saved = sessionStorage.getItem('admin_auth_pass');
    const savedTab = sessionStorage.getItem('admin_active_tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    if (saved) {
      setPassword(saved);
      checkAuth(saved);
    } else {
      setIsCheckingAuth(false);
    }

    return () => {
      document.body.classList.remove('admin-body');
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('admin_active_tab', activeTab);
    }
  }, [activeTab]);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext blocked or unsupported:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, password]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Polling silencioso a cada 30 segundos para novos pedidos de orçamento com alerta sonoro
    const interval = setInterval(async () => {
      try {
        const ordersRes = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`);
        if (ordersRes.ok) {
          const latestOrders = await ordersRes.json();
          
          setOrders(prevOrders => {
            if (prevOrders.length > 0 && latestOrders.length > 0) {
              const prevIds = new Set(prevOrders.map(o => o.id));
              const hasNew = latestOrders.some(o => !prevIds.has(o.id));
              if (hasNew) {
                playNotificationSound();
              }
            }
            return latestOrders;
          });
        }
      } catch (err) {
        console.warn('Failed to poll latest orders:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, password]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersRes = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`);
      const sellersRes = await fetch(`/api/admin/sellers?auth=${encodeURIComponent(password)}`);
      const productsRes = await fetch(`/api/admin/products?auth=${encodeURIComponent(password)}`);
      const categoriesRes = await fetch(`/api/admin/categories?auth=${encodeURIComponent(password)}`);
      
      if (ordersRes.ok && sellersRes.ok && productsRes.ok && categoriesRes.ok) {
        setOrders(await ordersRes.json());
        setSellers(await sellersRes.json());
        setProducts(await productsRes.json());
        setCategories(await categoriesRes.json());
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth_pass');
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password) {
      checkAuth(password);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth_pass');
    setPassword('');
    setIsAuthenticated(false);
    setRole(null);
    setOrders([]);
    setSellers([]);
    setProducts([]);
    setCategories([]);
  };

  // Orders Actions
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders?auth=${encodeURIComponent(password)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (role !== 'admin') {
      alert('Apenas Administradores podem excluir pedidos.');
      return;
    }
    if (!confirm('Excluir este pedido permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Print Receipt handler
  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 6px 0; font-size: 13px;">${item.quantity}x ${item.product_title}</td>
        <td style="padding: 6px 0; font-size: 13px; text-align: right;">${item.price ? `<span style="font-size: 10px; font-weight: normal;">R$</span> ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sob consulta'}</td>
      </tr>
    `).join('');

    const totalStr = order.items.reduce((acc, item) => acc + (item.price ? (item.price * item.quantity) : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - Pedido #${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; background-color: #fff; }
            h2 { text-align: center; margin: 5px 0; font-size: 18px; }
            p { font-size: 12px; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>ANTENOR & FILHOS</h2>
          <p style="text-align: center;">Estrada União Indústria, 12273 - Itaipava</p>
          <div class="divider"></div>
          <p><b>Pedido:</b> #${order.id}</p>
          <p><b>Data:</b> ${formatDate(order.created_at)}</p>
          <p><b>Cliente:</b> ${order.customer_name}</p>
          <p><b>WhatsApp:</b> ${order.customer_whatsapp}</p>
          ${order.customer_address ? `<p><b>Entrega:</b> ${order.customer_address}</p>` : ''}
          ${order.delivery_date ? `<p><b>Agenda Entrega:</b> ${order.delivery_date.split('-').reverse().join('/')} (${order.delivery_period || 'Qualquer Horário'})</p>` : ''}
          <p><b>Atendente:</b> ${order.seller_name || 'Site Direto'}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; font-size: 12px; padding: 4px 0;">Item</th>
                <th style="text-align: right; font-size: 12px; padding: 4px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <p class="total">Total Estimado: <span style="font-size: 11px; font-weight: normal;">R$</span> ${totalStr}</p>
          ${order.notes ? `<p style="font-size: 11px; margin-top: 10px;"><b>Obs:</b> ${order.notes}</p>` : ''}
          <div class="divider"></div>
          <p style="text-align: center; font-size: 10px;">Obrigado pela preferência!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CSV Export for Orders
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert('Não há orçamentos filtrados para exportar.');
      return;
    }
    const headers = ['Pedido ID', 'Data', 'Cliente', 'WhatsApp', 'Email', 'Endereco de Entrega', 'Vendedor', 'Status', 'Itens Requisitados', 'Observacoes'];
    const rows = filteredOrders.map(o => {
      const itemStrings = o.items.map(i => `${i.quantity}x ${i.product_title} [EAN:${i.sku || ''}]`).join(' | ');
      return [
        o.id,
        formatDate(o.created_at),
        o.customer_name,
        o.customer_whatsapp,
        o.customer_email || '',
        o.customer_address || '',
        o.seller_name || 'Site Direto',
        o.status,
        itemStrings,
        o.notes || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_antenorefilhos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Products CRUD Actions
  const handleOpenProductModal = (prod = null) => {
    if (role !== 'admin') {
      alert('Acesso restrito para Administrador.');
      return;
    }
    if (prod) {
      setProductForm({
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        description: prod.description || '',
        sku: prod.sku || '',
        peso: prod.peso || '',
        unidade_peso: prod.unidade_peso || 'g',
        preco: prod.preco ? String(prod.preco) : '',
        status: prod.status || 'on',
        image_url: prod.image_url || '',
        type: prod.type || 'carnes_',
        pontuacao: prod.pontuacao || '',
        categoryIds: prod.categories ? prod.categories.map(c => c.id) : [],
        uva: prod.uva || '',
        safra: prod.safra || '',
        origem: prod.origem || '',
        produtor: prod.produtor || '',
        teor_alcoolico: prod.teor_alcoolico || '',
        temperatura: prod.temperatura || '',
        enologo: prod.enologo || '',
        volume: prod.volume || '',
        amadurecimento: prod.amadurecimento || '',
        potencial_guarda: prod.potencial_guarda || '',
        visual: prod.visual || '',
        olfativo: prod.olfativo || '',
        gustativo: prod.gustativo || '',
        harmonizacao: prod.harmonizacao || ''
      });
    } else {
      setProductForm({
        id: null,
        title: '',
        slug: '',
        description: '',
        sku: '',
        peso: '',
        unidade_peso: 'g',
        preco: '',
        status: 'on',
        image_url: '',
        type: 'carnes_',
        pontuacao: '',
        categoryIds: [],
        uva: '',
        safra: '',
        origem: '',
        produtor: '',
        teor_alcoolico: '',
        temperatura: '',
        enologo: '',
        volume: '',
        amadurecimento: '',
        potencial_guarda: '',
        visual: '',
        olfativo: '',
        gustativo: '',
        harmonizacao: ''
      });
    }
    setShowProductModal(true);
  };

  const handleProductTitleChange = (val) => {
    const slugVal = val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setProductForm({ ...productForm, title: val, slug: slugVal });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;

    const payload = {
      ...productForm,
      preco: productForm.preco.trim() !== '' ? parseFloat(productForm.preco) : null,
      categoryIds: productForm.categoryIds
    };

    try {
      const method = productForm.id ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/products?auth=${encodeURIComponent(password)}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(productForm.id ? 'Produto atualizado!' : 'Produto criado!');
        setShowProductModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar produto: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar produto.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (role !== 'admin') return;
    if (!confirm('Tem certeza que deseja excluir permanentemente este produto?')) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao excluir produto.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Categories CRUD Actions
  const handleOpenCategoryModal = (cat = null) => {
    if (role !== 'admin') {
      alert('Acesso restrito para Administrador.');
      return;
    }
    if (cat) {
      setCategoryForm({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        type: cat.type
      });
    } else {
      setCategoryForm({
        id: null,
        name: '',
        slug: '',
        type: 'sessoes_carnes_'
      });
    }
    setShowCategoryModal(true);
  };

  const handleCategoryNameChange = (val) => {
    if (!categoryForm.id) {
      const slugVal = val.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCategoryForm({ ...categoryForm, name: val, slug: slugVal });
    } else {
      setCategoryForm({ ...categoryForm, name: val });
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;

    try {
      const method = categoryForm.id ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/categories?auth=${encodeURIComponent(password)}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (res.ok) {
        alert(categoryForm.id ? 'Categoria atualizada!' : 'Categoria criada!');
        setShowCategoryModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar categoria: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (role !== 'admin') return;
    if (!confirm('Deseja realmente excluir esta categoria? Ela será desvinculada de todos os produtos.')) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao excluir categoria.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sellers Add Action
  const handleCreateSeller = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;
    if (!newSeller.name || !newSeller.phone) return;

    // Auto slugify name
    const slugVal = newSeller.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      const res = await fetch(`/api/admin/sellers?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSeller, slug: slugVal })
      });
      if (res.ok) {
        alert('Vendedor cadastrado com sucesso!');
        setNewSeller({ name: '', phone: '', slug: '' });
        fetchData();
      } else {
        alert('Erro ao criar vendedor.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSeller = async (id) => {
    if (role !== 'admin') return;
    if (!confirm('Tem certeza que deseja excluir este vendedor?')) return;
    try {
      const res = await fetch(`/api/admin/sellers?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao excluir vendedor.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR');
  };

  // Filtering Orders (Fuzzy Search & Dates)
  const filteredOrders = (() => {
    let result = orders;
    
    // Filtro de Status
    if (orderStatusFilter !== '') {
      result = result.filter(o => o.status === orderStatusFilter);
    }
    
    // Filtro de Vendedor
    if (orderSellerFilter !== '') {
      if (orderSellerFilter === 'direto') {
        result = result.filter(o => !o.seller_id);
      } else {
        result = result.filter(o => o.seller_id === Number(orderSellerFilter));
      }
    }

    // Filtro de Data Inicial
    if (orderStartDate !== '') {
      const start = new Date(orderStartDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.created_at) >= start);
    }

    // Filtro de Data Final
    if (orderEndDate !== '') {
      const end = new Date(orderEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.created_at) <= end);
    }
    
    // Filtro de Busca Fuzzy
    if (orderSearch.trim() !== '') {
      const FuseClass = typeof Fuse === 'function' ? Fuse : (Fuse.default || Fuse);
      const fuse = new FuseClass(result, {
        keys: ['customer_name', 'id'],
        threshold: 0.4
      });
      result = fuse.search(orderSearch).map(item => item.item);
    }
    
    return result;
  })();

  // Filtering Products for Table (Fuzzy Search)
  const filteredProducts = (() => {
    let result = products;
    
    // Filtro de Tipo/Setor
    if (prodTypeFilter !== '') {
      result = result.filter(p => p.type === prodTypeFilter);
    }
    
    // Filtro de Busca Fuzzy
    if (prodSearch.trim() !== '') {
      const FuseClass = typeof Fuse === 'function' ? Fuse : (Fuse.default || Fuse);
      const fuse = new FuseClass(result, {
        keys: ['title', 'sku'],
        threshold: 0.4
      });
      result = fuse.search(prodSearch).map(item => item.item);
    }
    
    return result;
  })();

  // Pagination helper
  const totalProdPages = Math.ceil(filteredProducts.length / prodPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((prodPage - 1) * prodPerPage, prodPage * prodPerPage);

  // Statistics calculation helpers (dinâmicos com base nos filtros)
  const totalOrders = filteredOrders.length;
  const pendingOrdersCount = filteredOrders.filter(o => o.status === 'processing').length;
  const completedOrdersCount = filteredOrders.filter(o => o.status === 'completed').length;
  
  // Total Budgets Estimate Revenue (resiliente com preços estimados do catálogo)
  const calculateTotalRevenue = (onlyCompleted = false) => {
    let total = 0;
    filteredOrders.forEach(o => {
      if (onlyCompleted && o.status !== 'completed') return;
      o.items.forEach(i => {
        const itemPrice = i.price || products.find(p => p.title === i.product_title)?.preco || 0;
        if (itemPrice) {
          total += (itemPrice * i.quantity);
        }
      });
    });
    return total;
  };

  const salesRevenue = calculateTotalRevenue(true);
  const totalRevenue = calculateTotalRevenue(false);
  const ticketMedio = completedOrdersCount > 0 ? (salesRevenue / completedOrdersCount) : 0;

  // Chart data: Sales by Category (dinâmico e resiliente)
  const getSalesByCategory = () => {
    const categoriesStats = { Boutique: 0, Adega: 0 };
    filteredOrders.forEach(o => {
      o.items.forEach(i => {
        const matchProd = products.find(p => p.title === i.product_title);
        const sector = matchProd?.type === 'adega' ? 'Adega' : 'Boutique';
        const itemPrice = i.price || matchProd?.preco || 0;
        if (itemPrice) {
          categoriesStats[sector] += (itemPrice * i.quantity);
        }
      });
    });
    return Object.entries(categoriesStats);
  };

  // Chart data: Complete Performance by Seller (Orders, Total Revenue, Avg Ticket)
  const getSellersPerformance = () => {
    const stats = {};
    
    // Initialize stats for each registered seller
    sellers.forEach(s => {
      stats[s.name] = { count: 0, revenue: 0, pending: 0, completed: 0 };
    });
    
    // Initialize 'Site Direto'
    stats['Site Direto'] = { count: 0, revenue: 0, pending: 0, completed: 0 };

    orders.forEach(o => {
      const name = o.seller_name || 'Site Direto';
      if (!stats[name]) {
        stats[name] = { count: 0, revenue: 0, pending: 0, completed: 0 };
      }
      
      stats[name].count += 1;
      if (o.status === 'processing') {
        stats[name].pending += 1;
      } else if (o.status === 'completed') {
        stats[name].completed += 1;
      }
      
      // Calculate order revenue
      let orderValue = 0;
      o.items.forEach(i => {
        if (i.price) {
          orderValue += (i.price * i.quantity);
        }
      });
      stats[name].revenue += orderValue;
    });

    return Object.entries(stats).map(([name, data]) => {
      const avgTicket = data.completed > 0 ? (data.revenue / data.completed) : (data.count > 0 ? (data.revenue / data.count) : 0);
      return {
        name,
        count: data.count,
        revenue: data.revenue,
        pending: data.pending,
        completed: data.completed,
        avgTicket
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  if (isCheckingAuth) {
    return (
      <div className="w-full flex-1 min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center p-4 bg-base-200 gap-4" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-xs text-base-content/50 uppercase tracking-wider font-bold">Verificando credenciais...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full flex-1 min-h-[calc(100vh-3rem)] flex items-center justify-center p-4 bg-base-200 animate-[fadeIn_0.3s_ease]">
        <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-primary/20">
          <form onSubmit={handleLogin} className="card-body">
            <h2 className="card-title justify-center text-primary font-bold mb-4 text-lg">Painel Gerencial</h2>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Senha de Acesso</span>
              </label>
              <input 
                type="password" 
                placeholder="Digite sua senha de acesso" 
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="card-actions justify-end mt-4">
              <button type="submit" className="btn btn-primary btn-block">
                Acessar Painel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full overflow-hidden">
      
      {/* Redesigned Premium Sidebar Panel - DaisyUI Menu */}
      <aside className="w-[220px] bg-base-300 border-r border-base-200 flex flex-col flex-shrink-0 hide-mobile">
        <div className="px-5 pt-7 pb-3">
          <h3 className="text-primary text-[13px] tracking-tight font-bold whitespace-nowrap mb-0.5">Antenor &amp; Filhos</h3>
          <span className="text-[9px] text-base-content/50 font-bold uppercase tracking-wider">Módulo de Expedição v1.2</span>
        </div>

        <ul className="menu w-full px-4 gap-1 flex-1 overflow-y-auto mt-4 text-sm font-medium">
          <li>
            <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>
              <i className="fa-solid fa-list-check w-5 text-center"></i> Orçamentos
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>
              <i className="fa-solid fa-drumstick-bite w-5 text-center"></i> Catálogo
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('categories')} className={activeTab === 'categories' ? 'active' : ''}>
              <i className="fa-solid fa-tags w-5 text-center"></i> Categorias
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('sellers')} className={activeTab === 'sellers' ? 'active' : ''}>
              <i className="fa-solid fa-users w-5 text-center"></i> Vendedores
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'active' : ''}>
              <i className="fa-solid fa-brain w-5 text-center"></i> Inteligência AI
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('monitor')} className={activeTab === 'monitor' ? 'active' : ''}>
              <i className="fa-solid fa-desktop w-5 text-center"></i> Monitor Ao Vivo
            </button>
          </li>
          <li className="mt-2">
            <button onClick={() => setActiveTab('solidcon')} className={activeTab === 'solidcon' ? 'active' : ''}>
              <i className="fa-solid fa-cloud-arrow-down w-5 text-center"></i> Integração ERP
            </button>
          </li>

          <div className="divider text-[10px] uppercase opacity-50 my-2">Painel Estendido</div>
          <li>
            <button onClick={() => setActiveTab('recipes')} className={activeTab === 'recipes' ? 'active' : ''}>
              <i className="fa-solid fa-book-open w-5 text-center"></i> Receitas
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('menu_restaurant')} className={activeTab === 'menu_restaurant' ? 'active' : ''}>
              <i className="fa-solid fa-utensils w-5 text-center"></i> Cardápio (Admin)
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('biolinks')} className={activeTab === 'biolinks' ? 'active' : ''}>
              <i className="fa-solid fa-link w-5 text-center"></i> Biolinks (Admin)
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('reviews')} className={activeTab === 'reviews' ? 'active' : ''}>
              <i className="fa-solid fa-star w-5 text-center"></i> Avaliações
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
              <i className="fa-solid fa-gear w-5 text-center"></i> Configurações
            </button>
          </li>

          <div className="divider text-[10px] uppercase opacity-50 my-2">Atalhos Externos</div>
          <li>
            <a href="/adega" target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-wine-glass w-5 text-center"></i> Abrir Adega
            </a>
          </li>
          <li>
            <a href="/boutique" target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-store w-5 text-center"></i> Abrir Boutique
            </a>
          </li>
          <li>
            <a href="/cardapio" target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-utensils w-5 text-center"></i> Abrir Cardápio
            </a>
          </li>
        </ul>

        <div className="p-4 border-t border-base-200 mt-auto bg-base-300">
          <div className="text-xs text-base-content/70 mb-3 text-center">
            Usuário: <span className="font-bold">{role === 'admin' ? 'Administrador' : 'Gerente'}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm btn-block">
            Sair do Módulo
          </button>
        </div>
      </aside>

      {/* Main Admin Content Panel */}
      <main className="flex-grow p-4 md:p-8 bg-base-200 overflow-y-auto w-full">
        
        {/* Mobile Navigation bar (tabs visible only on mobile) */}
        <div className="md:hidden mb-6">
          <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value)}
            className="select select-bordered select-primary w-full font-bold"
          >
            <option value="orders">📋 Orçamentos ({totalOrders})</option>
            <option value="products">🥩 Produtos ({products.length})</option>
            <option value="categories">🏷️ Categorias ({categories.length})</option>
            <option value="sellers">👥 Vendedores ({sellers.length})</option>
            <option value="stats">📈 Estatísticas & Relatórios</option>
            <option value="monitor">🖥️ Monitor Ao Vivo</option>
            <option value="recipes">📖 Receitas</option>
            <option value="menu_restaurant">🍽️ Cardápio (Admin)</option>
            <option value="biolinks">🔗 Biolinks (Admin)</option>
            <option value="settings">⚙️ Configurações</option>
            <option value="solidcon">☁️ Integração ERP</option>
          </select>
        </div>

        {activeTab === 'monitor' && <LiveOrdersMonitor password={password} />}

        {/* Dashboard Widgets Row (Visible in stats/orders) */}
        {(activeTab === 'orders' || activeTab === 'stats') && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Widget 1 */}
            <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-200">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Faturamento Finalizado</span>
                  <div className="p-2 bg-success/15 rounded-lg text-success">
                    <i className="fa-solid fa-circle-dollar-to-slot text-lg"></i>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-base-content tracking-tight">
                  <span className="text-sm font-normal mr-1 text-base-content/70">R$</span>
                  {salesRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <span className="text-xs text-base-content/50 mt-2">Base: {completedOrdersCount} orçamentos concluídos</span>
              </div>
            </div>

            {/* Widget 2 */}
            <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-200">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Pedidos Totais</span>
                  <div className="p-2 bg-primary/15 rounded-lg text-primary">
                    <i className="fa-solid fa-file-invoice text-lg"></i>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-base-content tracking-tight">{totalOrders}</h2>
                <span className="text-xs text-warning font-semibold mt-2">{pendingOrdersCount} pendentes de atendimento</span>
              </div>
            </div>

            {/* Widget 3 */}
            <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-200">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Ticket Médio</span>
                  <div className="p-2 bg-info/15 rounded-lg text-info">
                    <i className="fa-solid fa-calculator text-lg"></i>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-base-content tracking-tight">
                  <span className="text-sm font-normal mr-1 text-base-content/70">R$</span>
                  {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <span className="text-xs text-base-content/50 mt-2">Média por orçamento finalizado</span>
              </div>
            </div>

            {/* Widget 4 */}
            <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-200">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Demanda Solicitada</span>
                  <div className="p-2 bg-neutral/15 rounded-lg text-neutral-content">
                    <i className="fa-solid fa-arrows-to-eye text-lg"></i>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-base-content tracking-tight">
                  <span className="text-sm font-normal mr-1 text-base-content/70">R$</span>
                  {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <span className="text-xs text-base-content/50 mt-2">Volume bruto de todos os orçamentos</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-base-content/60">Carregando dados do servidor...</div>
        ) : (
          <div>
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div>
                {/* Filters Row */}
                <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
                  <div className="card-body p-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-base-content/80 mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-magnifying-glass text-primary"></i> Filtros de Pesquisa
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-[10px] uppercase font-bold text-base-content/60">Pesquisa</span></label>
                        <input 
                          type="text" 
                          placeholder="Cliente ou ID..." 
                          className="input input-bordered w-full"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                        />
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-[10px] uppercase font-bold text-base-content/60">Status</span></label>
                        <select
                          className="select select-bordered w-full"
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                        >
                          <option value="">Todos os Status</option>
                          <option value="processing">🟡 Pendente</option>
                          <option value="viewed">🔵 Visualizado</option>
                          <option value="completed">🟢 Finalizado</option>
                          <option value="cancelled">🔴 Cancelado</option>
                        </select>
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-[10px] uppercase font-bold text-base-content/60">Vendedor</span></label>
                        <select
                          className="select select-bordered w-full"
                          value={orderSellerFilter}
                          onChange={(e) => setOrderSellerFilter(e.target.value)}
                        >
                          <option value="">Filtrar por Vendedor</option>
                          <option value="direto">Site Direto</option>
                          {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-[10px] uppercase font-bold text-base-content/60">Data Inicial</span></label>
                        <input 
                          type="date"
                          className="input input-bordered w-full"
                          value={orderStartDate}
                          onChange={(e) => setOrderStartDate(e.target.value)}
                        />
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-[10px] uppercase font-bold text-base-content/60">Data Final</span></label>
                        <input 
                          type="date"
                          className="input input-bordered w-full"
                          value={orderEndDate}
                          onChange={(e) => setOrderEndDate(e.target.value)}
                        />
                      </div>
                      <div className="form-control w-full">
                        <button onClick={exportToCSV} className="btn btn-outline btn-primary w-full gap-2 h-[48px] min-h-[48px]">
                          <i className="fa-solid fa-file-csv text-lg"></i> Exportar CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="text-base-content/60 italic p-4">Nenhum pedido de orçamento corresponde aos filtros selecionados.</p>
                ) : (
                  <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
                    <table className="table table-zebra table-sm md:table-md w-full">
                      <thead className="bg-base-200">
                        <tr>
                          <th>ID</th>
                          <th>Data</th>
                          <th>Cliente</th>
                          <th>Contato</th>
                          <th>Vendedor</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order.id} className="hover">
                            <td className="font-mono text-xs">#{String(order.id).slice(0, 8)}</td>
                            <td className="whitespace-nowrap">
                              <div>{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                              <div className="text-[11px] text-base-content/55 font-mono">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td>
                              <div className="font-bold">{order.customer_name}</div>
                              {order.customer_address && <div className="text-xs text-base-content/60 truncate max-w-[150px]" title={order.customer_address}>Entrega: {order.customer_address}</div>}
                            </td>
                            <td>
                              <a 
                                href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-success hover:text-success/80 font-bold flex items-center gap-2 whitespace-nowrap"
                              >
                                <i className="fa-brands fa-whatsapp text-lg"></i>
                                {order.customer_whatsapp}
                              </a>
                            </td>
                            <td>{order.seller_name || <span className="text-base-content/50 italic">Site Direto</span>}</td>
                            <td>
                              <select 
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`select select-xs font-bold uppercase text-[10px] tracking-wider text-center ${
                                  order.status === 'processing' ? 'bg-warning/20 border-warning/30 text-warning hover:bg-warning/35' : 
                                  order.status === 'completed' ? 'bg-success/20 border-success/30 text-success hover:bg-success/35' : 
                                  order.status === 'cancelled' ? 'bg-error/20 border-error/30 text-error hover:bg-error/35' : 
                                  'bg-info/20 border-info/30 text-info hover:bg-info/35'
                                } focus:outline-none focus:ring-0 focus:border-current cursor-pointer`}
                                style={{ textAlignLast: 'center', minWidth: '120px' }}
                              >
                                <option value="processing" className="bg-base-100 text-warning font-bold">Pendente</option>
                                <option value="viewed" className="bg-base-100 text-info font-bold">Visualizado</option>
                                <option value="completed" className="bg-base-100 text-success font-bold">Finalizado</option>
                                <option value="cancelled" className="bg-base-100 text-error font-bold">Cancelado</option>
                              </select>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setSelectedOrder(order)}
                                  className="btn btn-sm btn-primary btn-outline font-semibold"
                                >
                                  Detalhes
                                </button>
                                <button 
                                  onClick={() => handlePrintOrder(order)}
                                  className="btn btn-sm btn-ghost text-base-content/70 hover:text-primary hover:bg-primary/10"
                                  title="Imprimir Cupom"
                                >
                                  <i className="fa-solid fa-print"></i>
                                </button>
                                {role === 'admin' && (
                                  <button 
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="btn btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10"
                                    title="Excluir"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-base text-base-content font-bold">Catálogo de Produtos</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenProductModal(null)} className="btn btn-primary">
                      <i className="fa-solid fa-plus mr-2"></i> Criar Produto
                    </button>
                  )}
                </div>

                <div className="card bg-base-200 shadow-sm border border-base-300 mb-6">
                  <div className="card-body p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Pesquisar catálogo..." 
                        className="input input-bordered w-full"
                        value={prodSearch}
                        onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
                      />
                      <select
                        className="select select-bordered w-full"
                        value={prodTypeFilter}
                        onChange={(e) => { setProdTypeFilter(e.target.value); setProdPage(1); }}
                      >
                        <option value="">Todos os Setores</option>
                        <option value="carnes_">Boutique de Carnes</option>
                        <option value="adega">Adega de Vinhos</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
                  <table className="table table-zebra w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="w-24 px-4 py-3">Imagem</th>
                        <th className="w-1/3 min-w-[280px] px-4 py-3">Título</th>
                        <th className="w-44 min-w-[160px] px-4 py-3">EAN (SKU)</th>
                        <th className="w-36 min-w-[120px] px-4 py-3">Preço</th>
                        <th className="w-28 min-w-[90px] px-4 py-3">Setor</th>
                        <th className="w-28 min-w-[90px] px-4 py-3">Status</th>
                        {role === 'admin' && <th className="w-36 min-w-[130px] px-4 py-3">Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map(p => (
                        <tr key={p.id} className="hover">
                          <td className="px-4 py-3.5">
                            {p.image_url ? (
                              <div className="avatar">
                                <div className="w-14 h-14 rounded-md border border-base-300 overflow-hidden shadow-sm">
                                  <img src={p.image_url} alt={p.title} className="object-cover w-full h-full" />
                                </div>
                              </div>
                            ) : (
                              <div className="avatar placeholder">
                                <div className="bg-neutral/10 text-neutral rounded-md w-14 h-14 flex items-center justify-center border border-base-300">
                                  <span className="text-[10px] uppercase font-bold text-base-content/40">Sem foto</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-base-content leading-snug">{p.title}</div>
                            {p.categories && p.categories.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap mt-2">
                                {p.categories.map(c => (
                                  <span key={c.id} className="badge badge-primary badge-outline text-[10px] font-bold py-0.5 px-2 h-auto">
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-base-content/80 whitespace-nowrap">{p.sku || '-'}</td>
                          <td className="px-4 py-3.5 text-primary font-bold whitespace-nowrap">
                            {p.preco ? (
                              <>
                                <span className="text-xs font-normal mr-1 text-base-content/60">R$</span>
                                {p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            ) : (
                              <span className="text-base-content/50 italic text-sm font-normal">Sob consulta</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="badge badge-ghost font-semibold text-[11px] uppercase tracking-wider py-1 px-2.5">
                              {p.type === 'carnes_' ? 'Boutique' : 'Adega'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className={`badge font-bold text-[10px] uppercase tracking-wider py-1 px-2.5 ${p.status === 'on' ? 'badge-success bg-success/20 border-success text-success-content' : 'badge-error bg-error/20 border-error text-error-content'}`}>
                              {p.status === 'on' ? 'Ativo' : 'Inativo'}
                            </div>
                          </td>
                          {role === 'admin' && (
                            <td className="px-4 py-3.5">
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenProductModal(p)} className="btn btn-xs md:btn-sm btn-primary btn-outline font-semibold">Editar</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-xs md:btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10" title="Excluir">
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center mt-6">
                  <div className="join">
                    <button 
                      disabled={prodPage === 1}
                      onClick={() => setProdPage(p => p - 1)}
                      className="join-item btn btn-outline"
                    >
                      Anterior
                    </button>
                    <button className="join-item btn btn-active no-animation pointer-events-none bg-base-300 text-base-content/70">
                      Página <strong className="text-base-content mx-1">{prodPage}</strong> de {totalProdPages}
                    </button>
                    <button 
                      disabled={prodPage === totalProdPages}
                      onClick={() => setProdPage(p => p + 1)}
                      className="join-item btn btn-outline"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORIES */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-base text-base-content font-bold">Gerenciamento de Categorias</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenCategoryModal(null)} className="btn btn-primary">
                      <i className="fa-solid fa-plus mr-2"></i> Criar Categoria
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
                  <table className="table table-zebra w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Slug</th>
                        <th>Tipo (Taxonomia)</th>
                        {role === 'admin' && <th>Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id} className="hover">
                          <td className="font-mono text-xs">#{String(cat.id).slice(0, 8)}</td>
                          <td className="font-bold">{cat.name}</td>
                          <td className="font-mono text-xs text-base-content/70">{cat.slug}</td>
                          <td>
                            <div className="badge badge-primary badge-outline text-xs">{cat.type}</div>
                          </td>
                          {role === 'admin' && (
                            <td>
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenCategoryModal(cat)} className="btn btn-sm btn-outline btn-primary">Editar</button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-sm btn-outline btn-error" title="Excluir">
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: SELLERS */}
            {activeTab === 'sellers' && (
              <div>
                <div className={`grid gap-8 ${role === 'admin' ? 'lg:grid-cols-[1fr_350px]' : 'grid-cols-1'} items-start`}>
                  <div>
                    <h3 className="text-sm font-bold text-base-content uppercase tracking-wider mb-4">Lista de Vendedores Ativos</h3>
                    <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
                      <table className="table table-zebra table-sm w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>WhatsApp</th>
                            <th>Slug Comissional</th>
                            <th>Link de Vendas</th>
                            {role === 'admin' && <th>Ações</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {sellers.map(s => (
                            <tr key={s.id} className="hover">
                              <td className="font-mono text-xs">#{String(s.id).slice(0, 8)}</td>
                              <td className="font-bold">{s.name}</td>
                              <td>
                                <a href={`https://wa.me/${s.phone}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold flex items-center gap-2 w-fit">
                                  <i className="fa-brands fa-whatsapp text-lg"></i>
                                  {s.phone}
                                </a>
                              </td>
                              <td className="font-mono text-xs text-base-content/70">?ref={s.slug}</td>
                              <td>
                                <button
                                  onClick={() => {
                                    const link = `${window.location.origin}/?ref=${s.slug}`;
                                    navigator.clipboard.writeText(link);
                                    alert(`Link copiado para o vendedor ${s.name}!\n\n${link}`);
                                  }}
                                  className="btn btn-xs btn-primary btn-outline flex items-center gap-1.5"
                                  title="Copiar link comissionado"
                                >
                                  <i className="fa-regular fa-copy"></i>
                                  Copiar Link
                                </button>
                              </td>
                              {role === 'admin' && (
                                <td>
                                  <button onClick={() => handleDeleteSeller(s.id)} className="btn btn-sm btn-outline btn-error" title="Excluir">
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>

                  {role === 'admin' && (
                    <aside className="card bg-base-200 shadow-sm border border-base-300 w-full">
                      <div className="card-body p-6">
                        <h4 className="card-title text-sm uppercase tracking-wider mb-2">Cadastrar Vendedor</h4>
                        <form onSubmit={handleCreateSeller} className="flex flex-col gap-4">
                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-bold">Nome Completo</span>
                            </label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Nome do vendedor" 
                              className="input input-bordered w-full"
                              value={newSeller.name}
                              onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                            />
                          </div>
                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-bold">WhatsApp (Fixo sem símbolos)</span>
                            </label>
                            <input 
                              type="tel" 
                              required 
                              placeholder="Ex: 5524988650462" 
                              className="input input-bordered w-full"
                              value={newSeller.phone}
                              onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary mt-2">
                            Salvar Vendedor
                          </button>
                        </form>
                      </div>
                    </aside>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: INTELIGÊNCIA IA */}
            {activeTab === 'stats' && (
              <HermesDashboard 
                orders={orders}
                sellers={sellers}
                products={products}
                password={password}
              />
            )}

            {/* TAB 6: SOLIDCON ERP */}
            {activeTab === 'solidcon' && (
              <SolidconIntegration password={password} />
            )}

            {/* TAB 7: STORE SETTINGS */}
            {activeTab === 'settings' && (
              <StoreSettings password={password} />
            )}

            {/* TAB 8: RECIPES */}
            {activeTab === 'recipes' && (
              <RecipeEditor password={password} products={products} />
            )}

            {/* TAB 9: MENU RESTAURANT */}
            {activeTab === 'menu_restaurant' && (
              <MenuRestaurantEditor password={password} />
            )}

            {/* TAB 10: BIOLINKS MANAGER */}
            {activeTab === 'biolinks' && (
              <BiolinksManager password={password} />
            )}

            {/* TAB 11: REVIEWS MODERATION */}
            {activeTab === 'reviews' && (
              <ReviewsModerator password={password} />
            )}
          </div>
        )}
      </main>

      {/* PRODUCT FORM MODAL */}
      {/* PRODUCT FORM MODAL */}
      {showProductModal && (
        <ProductEditor 
          productForm={productForm}
          setProductForm={setProductForm}
          categories={categories}
          handleSaveProduct={handleSaveProduct}
          onClose={() => setShowProductModal(false)}
          handleProductTitleChange={handleProductTitleChange}
          password={password}
        />
      )}

      {/* CATEGORY FORM MODAL (DAISYUI PILOT) */}
      {showCategoryModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-base-100 border border-base-300 max-w-sm">
            <h3 className="font-bold text-lg text-base-content mb-6">
              {categoryForm.id ? 'Editar Categoria' : 'Criar Categoria'}
            </h3>
            
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">Nome da Categoria</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: VPJ Angus" 
                  className="input input-bordered w-full"
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">Tipo de Taxonomia</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                >
                  <option value="sessoes_carnes_">Boutique: Categorias</option>
                  <option value="racas_carnes">Boutique: Raças</option>
                  <option value="embalagem_carnes">Boutique: Embalagens</option>
                  <option value="sessoes_vinho_">Adega: Seções de Vinho</option>
                </select>
              </div>

              <div className="modal-action mt-6 flex gap-3">
                <button type="submit" className="btn btn-primary flex-grow">Salvar Categoria</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-ghost">Cancelar</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowCategoryModal(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* ── Order Details Modal ─────────────────────────── */}
      {selectedOrder && (() => {
        const order = selectedOrder;
        const totalPrice = order.items.reduce((sum, item) => item.price ? sum + item.price * item.quantity : sum, 0);
        const hasPrice = order.items.some(item => item.price);
        const statusLabels = { processing: 'Pendente', viewed: 'Visualizado', completed: 'Finalizado', cancelled: 'Cancelado' };
        const statusColors = { processing: 'var(--warning)', viewed: '#60a5fa', completed: 'var(--success)', cancelled: 'var(--danger)' };
        return (
          <dialog className="modal modal-open" onClick={() => setSelectedOrder(null)}>
            <div className="modal-box max-w-3xl bg-base-100 p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-base-200 bg-base-200 sticky top-0 z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-bold text-base-content">Pedido #{order.id}</span>
                    <div className={`badge font-bold uppercase text-[10px] tracking-wider ${
                      order.status === 'processing' ? 'badge-warning' : 
                      order.status === 'completed' ? 'badge-success' : 
                      order.status === 'cancelled' ? 'badge-error' : 'badge-info'
                    }`}>
                      {statusLabels[order.status] || order.status}
                    </div>
                  </div>
                  <span className="text-xs text-base-content/60">{formatDate(order.created_at)}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="btn btn-sm btn-circle btn-ghost">✕</button>
              </div>

              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">

                {/* Origin */}
                <div className={`alert ${order.seller_name ? 'alert-warning bg-warning/10 text-warning-content border-warning/20' : 'alert-info bg-info/10 text-info-content border-info/20'}`}>
                  <span className="text-2xl">{order.seller_name ? '🤝' : '🌐'}</span>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider opacity-70">Origem do Pedido</h3>
                    <div className="text-lg font-bold">
                      {order.seller_name ? `Indicação de ${order.seller_name}` : 'Site Direto (sem indicação)'}
                    </div>
                    {order.seller_name && (
                      <div className="text-xs opacity-70 mt-1">Este pedido veio através de link de vendedor</div>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-base-content/60 mb-3 font-bold">Dados do Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-base-200 p-4 rounded-box border border-base-300">
                      <div className="text-[10px] text-base-content/60 mb-1 font-bold">NOME</div>
                      <div className="text-sm font-bold text-base-content">{order.customer_name}</div>
                    </div>
                    <div className="bg-base-200 p-4 rounded-box border border-base-300">
                      <div className="text-[10px] text-base-content/60 mb-1 font-bold">WHATSAPP</div>
                      <a href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-success hover:text-success/80 font-bold flex items-center gap-2 text-sm w-fit">
                        <i className="fa-brands fa-whatsapp text-lg"></i>{order.customer_whatsapp}
                      </a>
                    </div>
                    {order.customer_address && (
                      <div className="bg-base-200 p-4 rounded-box border border-base-300 md:col-span-2">
                        <div className="text-[10px] text-base-content/60 mb-1 font-bold">ENDEREÇO DE ENTREGA</div>
                        <div className="text-sm text-base-content">{order.customer_address}</div>
                      </div>
                    )}
                    {order.delivery_date && (
                      <div className="bg-base-200 p-4 rounded-box border border-base-300 md:col-span-2">
                        <div className="text-[10px] text-base-content/60 mb-1 font-bold">AGENDA DE ENTREGA</div>
                        <div className="text-sm font-bold text-primary flex items-center gap-2">
                          <i className="fa-solid fa-calendar-days"></i>
                          {order.delivery_date.split('-').reverse().join('/')} - Período: {order.delivery_period || 'Qualquer Horário'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-base-content/60 mb-3 font-bold">
                    Itens do Pedido ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, idx) => {
                      const matchProd = products.find(p => p.title === item.product_title);
                      return (
                        <div key={item.id || idx} className="flex items-center gap-4 p-3 bg-base-200 border border-base-300 rounded-box">
                          {matchProd?.image_url ? (
                            <img src={matchProd.image_url} alt={matchProd.title} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-base-300 rounded flex items-center justify-center text-xl">🥩</div>
                          )}
                          <div className="flex-grow min-w-0">
                            <div className="text-sm font-bold text-base-content mb-1 leading-tight">
                              <span className="text-primary mr-2">{item.quantity}×</span>{item.product_title}
                            </div>
                            {item.sku && <div className="text-xs text-base-content/60 font-mono">EAN: {item.sku}</div>}
                          </div>
                          <div className="text-right shrink-0">
                            {item.price ? (
                              <span className="text-sm font-bold text-primary">
                                R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-xs text-base-content/60 italic">Sob consulta</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hasPrice && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-box flex justify-between items-center">
                      <span className="text-xs text-primary/80 uppercase tracking-wider font-bold">Total (itens com preço)</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="alert alert-warning bg-warning/10 border-warning/30 text-warning-content items-start">
                    <i className="fa-solid fa-note-sticky mt-1"></i>
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider opacity-70">Observações do Cliente</h3>
                      <div className="text-sm mt-1">{order.notes}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-base-200 bg-base-300 flex gap-3 justify-end">
                <button onClick={() => handlePrintOrder(order)} className="btn btn-outline btn-primary">
                  <i className="fa-solid fa-print"></i> Imprimir Cupom
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn btn-primary">
                  Fechar
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        );
      })()}
    </div>
  );
}

