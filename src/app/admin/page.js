'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null); // 'admin' or 'manager'
  
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
    if (!pass) return;
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
        alert('Senha incorreta. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth_pass');
    if (saved) {
      setPassword(saved);
      checkAuth(saved);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
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
    if (orders.length === 0) return;
    const headers = ['Pedido ID', 'Data', 'Cliente', 'WhatsApp', 'Email', 'Endereco de Entrega', 'Vendedor', 'Status', 'Itens Requisitados', 'Observacoes'];
    const rows = orders.map(o => {
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
        categoryIds: prod.categories ? prod.categories.map(c => c.id) : []
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
        categoryIds: []
      });
    }
    setShowProductModal(true);
  };

  const handleProductTitleChange = (val) => {
    if (!productForm.id) {
      const slugVal = val.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setProductForm({ ...productForm, title: val, slug: slugVal });
    } else {
      setProductForm({ ...productForm, title: val });
    }
  };

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;

    if (!isLocalhost) {
      alert('⚠️ Edição de produtos só funciona em ambiente local (localhost).\n\nPara salvar alterações em produção:\n1. Execute: npm run dev\n2. Acesse: http://localhost:3000/admin\n3. Edite o produto\n4. Execute: ./sync-catalog.ps1\n\nO Vercel redesploa automaticamente após o push.');
      return;
    }

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
    if (!isLocalhost) {
      alert('⚠️ Exclusão de produtos só funciona em localhost. Execute npm run dev e acesse http://localhost:3000/admin');
      return;
    }
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
    if (!isLocalhost) {
      alert('⚠️ Edição de categorias só funciona em localhost. Execute npm run dev e acesse http://localhost:3000/admin');
      return;
    }

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

  // Filtering Orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.id.toString() === orderSearch;
    const matchesStatus = orderStatusFilter === '' || o.status === orderStatusFilter;
    
    let matchesSeller = true;
    if (orderSellerFilter !== '') {
      if (orderSellerFilter === 'direto') {
        matchesSeller = !o.seller_id;
      } else {
        matchesSeller = o.seller_id === Number(orderSellerFilter);
      }
    }
    return matchesSearch && matchesStatus && matchesSeller;
  });

  // Filtering Products for Table
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(prodSearch.toLowerCase()) || 
                          (p.sku && p.sku.includes(prodSearch));
    const matchesType = prodTypeFilter === '' || p.type === prodTypeFilter;
    return matchesSearch && matchesType;
  });

  // Pagination helper
  const totalProdPages = Math.ceil(filteredProducts.length / prodPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((prodPage - 1) * prodPerPage, prodPage * prodPerPage);

  // Statistics calculation helpers
  const totalOrders = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  
  // Total Budgets Estimate Revenue
  const calculateTotalRevenue = (onlyCompleted = false) => {
    let total = 0;
    orders.forEach(o => {
      if (onlyCompleted && o.status !== 'completed') return;
      o.items.forEach(i => {
        if (i.price) {
          total += (i.price * i.quantity);
        }
      });
    });
    return total;
  };

  const salesRevenue = calculateTotalRevenue(true);
  const totalRevenue = calculateTotalRevenue(false);
  const ticketMedio = completedOrdersCount > 0 ? (salesRevenue / completedOrdersCount) : 0;

  // Chart data: Sales by Category
  const getSalesByCategory = () => {
    const categoriesStats = { Boutique: 0, Adega: 0 };
    orders.forEach(o => {
      o.items.forEach(i => {
        // Simple heuristic: if EAN starts with number or has certain structure
        // In database type is carnes_ or adega, let's fetch matching products
        const matchProd = products.find(p => p.title === i.product_title);
        const sector = matchProd?.type === 'adega' ? 'Adega' : 'Boutique';
        if (i.price) {
          categoriesStats[sector] += (i.price * i.quantity);
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
      if (o.status === 'pending') {
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

  if (!isAuthenticated) {
    return (
      <div className="page-wrapper" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <form onSubmit={handleLogin} className="glass" style={{ maxWidth: '400px', width: '100%', padding: '40px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '10px', fontFamily: 'var(--font-serif)' }}>Painel Gerencial</h2>
          <div className="form-group">
            <label className="form-label">Senha de Acesso</label>
            <input 
              type="password" 
              placeholder="Digite sua senha de acesso" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '90vh', display: 'flex' }}>
      
      {/* Redesigned Premium Sidebar Panel */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: '#07080a', 
        borderRight: '1px solid var(--border-color)', 
        padding: '30px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '30px',
        flexShrink: 0
      }} className="hide-mobile">
        <div>
          <h3 style={{ color: 'var(--primary)', fontSize: '15px', letterSpacing: '0.15em', marginBottom: '5px' }}>Antenor & Filhos</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MÓDULO DE EXPEDIÇÃO v1.2</span>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <button 
              onClick={() => setActiveTab('orders')} 
              style={{
                width: '100%', textLeft: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                backgroundColor: activeTab === 'orders' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === 'orders' ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <i className="fa-solid fa-list-check" style={{ width: '16px' }}></i> Orçamentos
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('products')} 
              style={{
                width: '100%', textLeft: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                backgroundColor: activeTab === 'products' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === 'products' ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <i className="fa-solid fa-drumstick-bite" style={{ width: '16px' }}></i> Catálogo
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('categories')} 
              style={{
                width: '100%', textLeft: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                backgroundColor: activeTab === 'categories' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === 'categories' ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <i className="fa-solid fa-tags" style={{ width: '16px' }}></i> Categorias
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('sellers')} 
              style={{
                width: '100%', textLeft: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                backgroundColor: activeTab === 'sellers' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'sellers' ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === 'sellers' ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <i className="fa-solid fa-users" style={{ width: '16px' }}></i> Vendedores
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('stats')} 
              style={{
                width: '100%', textLeft: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                backgroundColor: activeTab === 'stats' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'stats' ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === 'stats' ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <i className="fa-solid fa-chart-pie" style={{ width: '16px' }}></i> Estatísticas
            </button>
          </li>
        </ul>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Usuário: <b>{role === 'admin' ? 'Administrador' : 'Gerente'}</b>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
            Sair do Módulo
          </button>
        </div>
      </aside>

      {/* Main Admin Content Panel */}
      <main style={{ flexGrow: 1, padding: '30px', backgroundColor: 'var(--bg-main)' }}>
        
        {/* Banner de Aviso de Produção */}
        {typeof window !== 'undefined' && 
         (window.location.hostname === 'antenorefilhos.com.br' || 
          window.location.hostname === 'www.antenorefilhos.com.br' ||
          window.location.hostname.includes('vercel.app')) && (
          <div style={{
            backgroundColor: '#7a1b1b',
            color: '#ffdddd',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid #ff4444',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ff4444', fontSize: '18px' }}></i>
            <span>Atenção: Você está visualizando o Painel em PRODUÇÃO. Quaisquer alterações salvas afetarão o site público em tempo real!</span>
          </div>
        )}
        
        {/* Mobile Navigation bar (tabs visible only on mobile) */}
        <div className="show-mobile" style={{ marginBottom: '20px' }}>
          <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value)}
            className="form-control"
            style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
          >
            <option value="orders">📋 Orçamentos ({totalOrders})</option>
            <option value="products">🥩 Produtos ({products.length})</option>
            <option value="categories">🏷️ Categorias ({categories.length})</option>
            <option value="sellers">👥 Vendedores ({sellers.length})</option>
            <option value="stats">📈 Estatísticas & Relatórios</option>
          </select>
        </div>

        {/* Dashboard Widgets Row (Visible in stats/orders) */}
        {(activeTab === 'orders' || activeTab === 'stats') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Widget 1 */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Faturamento Finalizado</span>
                <i className="fa-solid fa-circle-dollar-to-slot" style={{ color: 'var(--success)' }}></i>
              </div>
              <h2 style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>
                <span style={{ fontSize: '0.65em', marginRight: '4px', fontWeight: 'normal' }}>R$</span>
                {salesRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base: {completedOrdersCount} orçamentos concluídos</span>
            </div>

            {/* Widget 2 */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Pedidos Totais</span>
                <i className="fa-solid fa-file-invoice" style={{ color: 'var(--primary)' }}></i>
              </div>
              <h2 style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>{totalOrders}</h2>
              <span style={{ fontSize: '11px', color: 'var(--warning)' }}>{pendingOrdersCount} pendentes de atendimento</span>
            </div>

            {/* Widget 3 */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Ticket Médio</span>
                <i className="fa-solid fa-calculator" style={{ color: 'var(--primary-hover)' }}></i>
              </div>
              <h2 style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>
                <span style={{ fontSize: '0.65em', marginRight: '4px', fontWeight: 'normal' }}>R$</span>
                {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Média por orçamento finalizado</span>
            </div>

            {/* Widget 4 */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Demanda Solicitada</span>
                <i className="fa-solid fa-arrows-to-eye" style={{ color: 'var(--text-muted)' }}></i>
              </div>
              <h2 style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>
                <span style={{ fontSize: '0.65em', marginRight: '4px', fontWeight: 'normal' }}>R$</span>
                {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume total de orçamentos abertos</span>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Carregando dados do servidor...</div>
        ) : (
          <div>
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div>
                {/* Filters Row */}
                <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '25px' }}>
                  <h4 style={{ color: 'white', fontSize: '13px', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros de Pesquisa</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <input 
                      type="text" 
                      placeholder="Pesquisar por cliente ou ID..." 
                      className="form-control"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                    <select
                      className="form-control"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <option value="">Todos os Status</option>
                      <option value="pending">🟡 Pendente</option>
                      <option value="viewed">🔵 Visualizado</option>
                      <option value="completed">🟢 Finalizado</option>
                      <option value="cancelled">🔴 Cancelado</option>
                    </select>
                    <select
                      className="form-control"
                      value={orderSellerFilter}
                      onChange={(e) => setOrderSellerFilter(e.target.value)}
                    >
                      <option value="">Filtrar por Vendedor</option>
                      <option value="direto">Site Direto</option>
                      {sellers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button onClick={exportToCSV} className="btn btn-secondary" style={{ padding: '10px', fontSize: '12px' }}>
                      <i className="fa-solid fa-file-csv" style={{ marginRight: '6px' }}></i> Exportar CSV
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum pedido de orçamento corresponde aos filtros selecionados.</p>
                ) : (
                  <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <table className="admin-table">
                      <thead>
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
                          <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td>#{order.id}</td>
                            <td>{formatDate(order.created_at)}</td>
                            <td>
                              <b>{order.customer_name}</b>
                              {order.customer_address && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entrega: {order.customer_address}</div>}
                            </td>
                            <td>
                              <a 
                                href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i>
                                {order.customer_whatsapp}
                              </a>
                            </td>
                            <td>{order.seller_name || <span style={{ color: 'var(--text-muted)' }}>Site Direto</span>}</td>
                            <td>
                              <select 
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                style={{
                                  backgroundColor: '#1a1e26',
                                  color: order.status === 'pending' ? 'var(--warning)' : 
                                         order.status === 'completed' ? 'var(--success)' : 
                                         order.status === 'cancelled' ? 'var(--danger)' : 'white',
                                  border: '1px solid var(--border-color)',
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                <option value="pending">Pendente</option>
                                <option value="viewed">Visualizado</option>
                                <option value="completed">Finalizado</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => setSelectedOrder(order)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                >
                                  Ver Detalhes
                                </button>
                                <button 
                                  onClick={() => handlePrintOrder(order)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '11px', borderColor: 'var(--primary)' }}
                                  title="Imprimir Cupom de Expedição"
                                >
                                  <i className="fa-solid fa-print"></i>
                                </button>
                                {role === 'admin' && (
                                  <button 
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="btn btn-danger" 
                                    style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                  >
                                    Excluir
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ color: 'white' }}>Lista do Catálogo de Produtos</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenProductModal(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                      ➕ Criar Produto
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="Pesquisar catálogo..." 
                    className="form-control"
                    style={{ maxWidth: '300px' }}
                    value={prodSearch}
                    onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
                  />
                  <select
                    className="form-control"
                    style={{ maxWidth: '200px' }}
                    value={prodTypeFilter}
                    onChange={(e) => { setProdTypeFilter(e.target.value); setProdPage(1); }}
                  >
                    <option value="">Todos os Setores</option>
                    <option value="carnes_">Boutique de Carnes</option>
                    <option value="adega">Adega de Vinhos</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Imagem</th>
                        <th>Título</th>
                        <th>EAN (SKU)</th>
                        <th>Preço</th>
                        <th>Setor</th>
                        <th>Status</th>
                        {role === 'admin' && <th>Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            {p.image_url ? (
                              <img src={p.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                            ) : (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sem foto</span>
                            )}
                          </td>
                          <td>
                            <b>{p.title}</b>
                            {p.categories && p.categories.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {p.categories.map(c => (
                                  <span key={c.id} style={{ fontSize: '9px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '1px 5px' }}>
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td><code>{p.sku || '-'}</code></td>
                          <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                            {p.preco ? (
                              <>
                                <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                                {p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            ) : (
                              'Sob consulta'
                            )}
                          </td>
                          <td>{p.type === 'carnes_' ? 'Boutique' : 'Adega'}</td>
                          <td>
                            <span style={{ color: p.status === 'on' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                              {p.status === 'on' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          {role === 'admin' && (
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenProductModal(p)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Editar</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Excluir</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button 
                    disabled={prodPage === 1}
                    onClick={() => setProdPage(p => p - 1)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px' }}
                  >
                    Anterior
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Página <b>{prodPage}</b> de {totalProdPages}</span>
                  <button 
                    disabled={prodPage === totalProdPages}
                    onClick={() => setProdPage(p => p + 1)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px' }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORIES */}
            {activeTab === 'categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ color: 'white' }}>Gerenciamento de Categorias</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenCategoryModal(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                      ➕ Criar Categoria
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <table className="admin-table">
                    <thead>
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
                        <tr key={cat.id}>
                          <td>#{cat.id}</td>
                          <td><b>{cat.name}</b></td>
                          <td><code>{cat.slug}</code></td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--primary-hover)' }}>{cat.type}</span>
                          </td>
                          {role === 'admin' && (
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenCategoryModal(cat)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Editar</button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Excluir</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: role === 'admin' ? '1fr 350px' : '1fr', gap: '30px', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Lista de Vendedores Ativos</h3>
                    <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>WhatsApp</th>
                            <th>Slug Comissional</th>
                            {role === 'admin' && <th>Ações</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {sellers.map(s => (
                            <tr key={s.id}>
                              <td>#{s.id}</td>
                              <td><b>{s.name}</b></td>
                              <td>
                                <a href={`https://wa.me/${s.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                  {s.phone} ↗
                                </a>
                              </td>
                              <td><code>?ref={s.slug}</code></td>
                              {role === 'admin' && (
                                <td>
                                  <button onClick={() => handleDeleteSeller(s.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Excluir</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {role === 'admin' && (
                    <aside className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                      <h4 style={{ color: 'white', marginBottom: '15px', textTransform: 'uppercase', fontSize: '13px' }}>Cadastrar Vendedor</h4>
                      <form onSubmit={handleCreateSeller} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Nome Completo</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Nome do vendedor" 
                            className="form-control"
                            value={newSeller.name}
                            onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">WhatsApp (Fixo sem símbolos)</label>
                          <input 
                            type="tel" 
                            required 
                            placeholder="Ex: 5524988650462" 
                            className="form-control"
                            value={newSeller.phone}
                            onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                          Salvar Vendedor
                        </button>
                      </form>
                    </aside>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: STATS */}
            {activeTab === 'stats' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Upper Row: Category Demand & Quick Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                  {/* Chart 1: Sales By Category */}
                  <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mapeamento de Demanda por Setor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {getSalesByCategory().map(([sector, amount]) => {
                        const totalAmt = calculateTotalRevenue(false) || 1;
                        const percentage = Math.round((amount / totalAmt) * 100);
                        return (
                          <div key={sector}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                              <span style={{ color: 'var(--text-primary)' }}>{sector === 'adega' ? 'Adega' : 'Boutique'}</span>
                              <span style={{ fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                                {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage}%)
                              </span>
                            </div>
                            {/* Visual CSS-bar */}
                            <div style={{ width: '100%', height: '8px', backgroundColor: '#1c1f26', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${percentage}%`, 
                                height: '100%', 
                                backgroundColor: sector === 'adega' ? '#800020' : 'var(--primary)',
                                borderRadius: '4px' 
                              }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Revenue Share by Seller */}
                  <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento Estimado por Canal / Vendedor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                      {getSellersPerformance().map((seller) => {
                        const maxRevenue = Math.max(...getSellersPerformance().map(x => x.revenue)) || 1;
                        const percentage = Math.round((seller.revenue / maxRevenue) * 100);
                        return (
                          <div key={seller.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                              <span style={{ color: 'var(--text-primary)' }}>{seller.name}</span>
                              <span style={{ fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: 'var(--text-muted)' }}>R$ </span>
                                {seller.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            {/* Visual CSS-bar */}
                            <div style={{ width: '100%', height: '8px', backgroundColor: '#1c1f26', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${percentage}%`, 
                                height: '100%', 
                                backgroundColor: seller.name === 'Site Direto' ? 'var(--text-muted)' : 'var(--primary)',
                                borderRadius: '4px' 
                              }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Performance Dashboard Table */}
                <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desempenho Detalhado da Equipe</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Vendedor</th>
                          <th style={{ textAlign: 'center' }}>Total Pedidos</th>
                          <th style={{ textAlign: 'center' }}>Pendentes</th>
                          <th style={{ textAlign: 'center' }}>Concluídos</th>
                          <th style={{ textAlign: 'right' }}>Faturamento Total</th>
                          <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSellersPerformance().map((seller) => (
                          <tr key={seller.name}>
                            <td>
                              <b style={{ color: seller.name === 'Site Direto' ? 'var(--text-secondary)' : 'white' }}>{seller.name}</b>
                            </td>
                            <td style={{ textAlign: 'center' }}>{seller.count}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: seller.pending > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                {seller.pending}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: seller.completed > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                {seller.completed}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                              <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', fontWeight: 'normal' }}>R$ </span>
                              {seller.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                              <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', fontWeight: 'normal' }}>R$ </span>
                              {seller.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* PRODUCT FORM MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleSaveProduct} className="glass" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>{productForm.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
            
            <div className="form-group">
              <label className="form-label">Nome do Produto</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Picanha Black Angus" 
                className="form-control"
                value={productForm.title}
                onChange={(e) => handleProductTitleChange(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">EAN (SKU)</label>
                <input 
                  type="text" 
                  placeholder="Código de barras" 
                  className="form-control"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 129.90" 
                  className="form-control"
                  value={productForm.preco}
                  onChange={(e) => setProductForm({ ...productForm, preco: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Peso / Volume</label>
                <input 
                  type="text" 
                  placeholder="Ex: 500" 
                  className="form-control"
                  value={productForm.peso}
                  onChange={(e) => setProductForm({ ...productForm, peso: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unidade de Peso</label>
                <select 
                  className="form-control"
                  value={productForm.unidade_peso}
                  onChange={(e) => setProductForm({ ...productForm, unidade_peso: e.target.value })}
                >
                  <option value="g">Gramas (g)</option>
                  <option value="kg">Quilos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Setor / Tipo</label>
                <select 
                  className="form-control"
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                >
                  <option value="carnes_">Boutique de Carnes</option>
                  <option value="adega">Adega de Vinhos</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pontuação / Classificação (Se Adega)</label>
                <input 
                  type="text" 
                  placeholder="Ex: RP95 | WS92" 
                  className="form-control"
                  value={productForm.pontuacao}
                  onChange={(e) => setProductForm({ ...productForm, pontuacao: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">URL da Imagem</label>
              <input 
                type="text" 
                placeholder="Ex: /novo/wp-content/uploads/imagem.jpg" 
                className="form-control"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categorias Associadas</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border-color)' }}>
                {categories.map(cat => {
                  const isChecked = productForm.categoryIds.includes(cat.id);
                  return (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked 
                            ? productForm.categoryIds.filter(id => id !== cat.id)
                            : [...productForm.categoryIds, cat.id];
                          setProductForm({ ...productForm, categoryIds: updated });
                        }}
                      />
                      {cat.name} <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({cat.type})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição detalhada</label>
              <textarea 
                rows="3"
                placeholder="Detalhes adicionais do corte ou vinho" 
                className="form-control"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Salvar Alterações</button>
              <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY FORM MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleSaveCategory} className="glass" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>{categoryForm.id ? 'Editar Categoria' : 'Criar Categoria'}</h3>
            
            <div className="form-group">
              <label className="form-label">Nome da Categoria</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: VPJ Angus" 
                className="form-control"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Taxonomia</label>
              <select
                className="form-control"
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
              >
                <option value="sessoes_carnes_">Boutique: Categorias</option>
                <option value="racas_carnes">Boutique: Raças</option>
                <option value="embalagem_carnes">Boutique: Embalagens</option>
                <option value="sessoes_vinho_">Adega: Seções de Vinho</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Salvar Categoria</button>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Order Details Modal ─────────────────────────── */}
      {selectedOrder && (() => {
        const order = selectedOrder;
        const totalPrice = order.items.reduce((sum, item) => item.price ? sum + item.price * item.quantity : sum, 0);
        const hasPrice = order.items.some(item => item.price);
        const statusLabels = { pending: 'Pendente', viewed: 'Visualizado', completed: 'Finalizado', cancelled: 'Cancelado' };
        const statusColors = { pending: 'var(--warning)', viewed: '#60a5fa', completed: 'var(--success)', cancelled: 'var(--danger)' };
        return (
          <div
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: '#0d0f14',
                border: '1px solid rgba(171,144,112,0.25)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(171,144,112,0.1)',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '24px 28px 20px',
                borderBottom: '1px solid rgba(171,144,112,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                position: 'sticky', top: 0, backgroundColor: '#0d0f14', zIndex: 1,
                borderRadius: '16px 16px 0 0'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: 'white' }}>Pedido #{order.id}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
                      padding: '3px 10px', borderRadius: '20px',
                      backgroundColor: `${statusColors[order.status]}22`,
                      color: statusColors[order.status],
                      border: `1px solid ${statusColors[order.status]}55`
                    }}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(order.created_at)}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', borderRadius: '8px', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '16px', flexShrink: 0
                  }}
                >✕</button>
              </div>

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Origin */}
                <div style={{
                  padding: '14px 18px', borderRadius: '10px',
                  backgroundColor: order.seller_name ? 'rgba(171,144,112,0.08)' : 'rgba(96,165,250,0.06)',
                  border: `1px solid ${order.seller_name ? 'rgba(171,144,112,0.25)' : 'rgba(96,165,250,0.2)'}`,
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>{order.seller_name ? '🤝' : '🌐'}</span>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Origem do Pedido</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: order.seller_name ? 'var(--primary)' : '#60a5fa' }}>
                      {order.seller_name ? `Indicação de ${order.seller_name}` : 'Site Direto (sem indicação)'}
                    </div>
                    {order.seller_name && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Este pedido veio através de link de vendedor</div>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Dados do Cliente</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>NOME</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{order.customer_name}</div>
                    </div>
                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>WHATSAPP</div>
                      <a href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '14px', fontWeight: '600', color: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                        <i className="fa-brands fa-whatsapp"></i>{order.customer_whatsapp}
                      </a>
                    </div>
                    {order.customer_address && (
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>ENDEREÇO DE ENTREGA</div>
                        <div style={{ fontSize: '14px', color: 'white' }}>{order.customer_address}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Itens do Pedido ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item, idx) => {
                      const matchProd = products.find(p => p.title === item.product_title);
                      return (
                        <div key={item.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '12px 16px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px'
                        }}>
                          {matchProd?.image_url ? (
                            <img src={matchProd.image_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🥩</div>
                          )}
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '3px' }}>
                              <span style={{ color: 'var(--primary)', marginRight: '6px' }}>{item.quantity}×</span>{item.product_title}
                            </div>
                            {item.sku && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EAN: {item.sku}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {item.price ? (
                              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                                R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sob consulta</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hasPrice && (
                    <div style={{
                      marginTop: '12px', padding: '14px 16px',
                      backgroundColor: 'rgba(171,144,112,0.06)',
                      border: '1px solid rgba(171,144,112,0.2)',
                      borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (itens com preço)</span>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                        R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'rgba(255,200,50,0.04)',
                    border: '1px solid rgba(255,200,50,0.15)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(255,200,50,0.5)'
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,200,50,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Observações do Cliente</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>{order.notes}</div>
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button onClick={() => handlePrintOrder(order)} className="btn btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '13px', borderColor: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-print"></i> Imprimir Cupom
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px' }}>
                    Fechar
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

