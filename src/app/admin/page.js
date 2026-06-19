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
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Pagination/Search for products
  const [prodSearch, setProdSearch] = useState('');
  const [prodTypeFilter, setProdTypeFilter] = useState('');
  const [prodPage, setProdPage] = useState(1);
  const prodPerPage = 50;

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
      const ordersRes = await fetch(`/api/admin/orders?auth=${encodeURIComponent(pass)}`);
      if (ordersRes.ok) {
        // Find role: adminPass is 'antenor123'
        const isDefaultAdmin = pass === 'antenor123';
        // Test role via write operation validation or simple matching (for UI roles)
        const detectedRole = isDefaultAdmin ? 'admin' : 'manager';
        setRole(detectedRole);
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth_pass', pass);
      } else {
        setIsAuthenticated(false);
        setRole(null);
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

    try {
      const res = await fetch(`/api/admin/sellers?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeller)
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

  // Helpers
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR');
  };

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
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  // Revenue estimation (total value of all items in completed or all orders)
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

  // Group orders by date (last 10 entries with dates)
  const getOrdersCountByDate = () => {
    const counts = {};
    orders.forEach(o => {
      const dateStr = new Date(o.created_at).toLocaleDateString('pt-BR');
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 10);
  };

  // Get Top Products Sold
  const getTopProducts = () => {
    const productCounts = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        productCounts[i.product_title] = (productCounts[i.product_title] || 0) + i.quantity;
      });
    });
    return Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyCentent: 'center', padding: '40px 20px' }}>
        <form onSubmit={handleLogin} className="glass" style={{ maxWidth: '400px', width: '100%', padding: '40px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '10px' }}>Painel Gerencial</h2>
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
    <div style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="container">
        
        {/* Header Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '30px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '32px', color: 'white' }}>Painel Gerencial</h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                color: 'black',
                padding: '2px 8px',
                borderRadius: '10px',
                textTransform: 'uppercase'
              }}>{role}</span>
            </div>
            <p style={{ fontSize: '14px' }}>Gerenciamento do catálogo, pedidos, vendedores e relatórios</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            Sair do Painel
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            📋 Pedidos ({totalOrders})
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            🥩 Produtos ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            🏷️ Categorias ({categories.length})
          </button>
          <button 
            onClick={() => setActiveTab('sellers')} 
            className={`btn ${activeTab === 'sellers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            👥 Vendedores ({sellers.length})
          </button>
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            📈 Relatórios & Métricas
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Processando dados...</div>
        ) : (
          <div>
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ color: 'white' }}>Lista de Pedidos de Orçamento</h3>
                  <button onClick={exportToCSV} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    📥 Exportar para CSV
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum pedido de orçamento registrado.</p>
                ) : (
                  <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Data</th>
                          <th>Cliente</th>
                          <th>WhatsApp</th>
                          <th>Vendedor</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <tr key={order.id} style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)' }}>
                              <td>#{order.id}</td>
                              <td>{formatDate(order.created_at)}</td>
                              <td>
                                <b>{order.customer_name}</b>
                                {order.customer_email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.customer_email}</div>}
                                {order.customer_address && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entrega: {order.customer_address}</div>}
                              </td>
                              <td>
                                <a 
                                  href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ color: 'var(--primary)', fontWeight: 'bold' }}
                                >
                                  {order.customer_whatsapp} ↗
                                </a>
                              </td>
                              <td>
                                {order.seller_name ? (
                                  <span style={{ color: '#e5c158' }}>{order.seller_name}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Site Direto</span>
                                )}
                              </td>
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
                                    fontWeight: '500'
                                  }}
                                >
                                  <option value="pending">🟡 Pendente</option>
                                  <option value="viewed">🔵 Visualizado</option>
                                  <option value="completed">🟢 Finalizado</option>
                                  <option value="cancelled">🔴 Cancelado</option>
                                </select>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button 
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                  >
                                    {isExpanded ? 'Recolher' : 'Ver Itens'}
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
                                
                                {isExpanded && (
                                  <div style={{
                                    position: 'absolute',
                                    left: 20,
                                    right: 20,
                                    backgroundColor: '#1c212a',
                                    border: '1px solid var(--border-hover)',
                                    padding: '20px',
                                    marginTop: '10px',
                                    zIndex: 10
                                  }}>
                                    <h5 style={{ color: 'white', marginBottom: '10px', fontSize: '14px' }}>Itens Requisitados:</h5>
                                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                      {order.items.map(item => (
                                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #232936', fontSize: '13px' }}>
                                          <span>
                                            <b>{item.quantity}x</b> {item.product_title} 
                                            {item.sku ? <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '10px' }}>EAN: {item.sku}</span> : ''}
                                          </span>
                                          <span style={{ color: 'var(--primary)' }}>
                                            {item.price ? `R$ ${(item.price * item.quantity).toFixed(2)}` : 'Preço sob consulta'}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                    {order.notes && (
                                      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '12px' }}>
                                        <b>Observações do Cliente:</b> {order.notes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
                  <h3 style={{ color: 'white' }}>Gerenciamento de Produtos</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenProductModal(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                      ➕ Novo Produto
                    </button>
                  )}
                </div>

                {/* Filter & Search Product Bar */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="Pesquisar por título ou EAN..." 
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
                    <option value="carnes_">🥩 Boutique de Carnes</option>
                    <option value="adega">🍷 Adega de Vinhos</option>
                  </select>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                    <span>Total filtrado: <b>{filteredProducts.length}</b></span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Imagem</th>
                        <th>Título</th>
                        <th>EAN (SKU)</th>
                        <th>Preço</th>
                        <th>Peso</th>
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
                            {p.preco ? `R$ ${p.preco.toFixed(2)}` : 'Consulta'}
                          </td>
                          <td>{p.peso ? `${p.peso} ${p.unidade_peso}` : '-'}</td>
                          <td>
                            {p.type === 'carnes_' ? '🥩 Boutique' : '🍷 Adega'}
                          </td>
                          <td>
                            <span style={{ color: p.status === 'on' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                              {p.status === 'on' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          {role === 'admin' && (
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => handleOpenProductModal(p)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="btn btn-danger" 
                                  style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                >
                                  Excluir
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
                {totalProdPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <button 
                      onClick={() => setProdPage(Math.max(1, prodPage - 1))}
                      disabled={prodPage === 1}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Anterior
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'white' }}>Página {prodPage} de {totalProdPages}</span>
                    <button 
                      onClick={() => setProdPage(Math.min(totalProdPages, prodPage + 1))}
                      disabled={prodPage === totalProdPages}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CATEGORIES */}
            {activeTab === 'categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ color: 'white' }}>Categorias & Taxonomias</h3>
                  {role === 'admin' && (
                    <button onClick={() => handleOpenCategoryModal(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                      ➕ Nova Categoria / Tag
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {['sessoes_carnes_', 'sessoes_vinho_', 'racas_carnes', 'embalagem_carnes'].map(taxType => {
                    const filteredCats = categories.filter(c => c.type === taxType);
                    let displayTitle = '';
                    switch (taxType) {
                      case 'sessoes_carnes_': displayTitle = '🥩 Categorias de Carnes'; break;
                      case 'sessoes_vinho_': displayTitle = '🍷 Categorias de Vinhos'; break;
                      case 'racas_carnes': displayTitle = '🐂 Raças de Carnes'; break;
                      case 'embalagem_carnes': displayTitle = '📦 Embalagens de Carnes'; break;
                    }

                    return (
                      <div key={taxType} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                        <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px', fontSize: '15px' }}>
                          {displayTitle}
                        </h4>
                        {filteredCats.length === 0 ? (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhuma cadastrada.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredCats.map(c => (
                              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #161922', paddingBottom: '8px', fontSize: '13px' }}>
                                <div>
                                  <span style={{ color: 'white', fontWeight: '500' }}>{c.name}</span>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Slug: <code>{c.slug}</code> | {c.products_count || 0} prod.</div>
                                </div>
                                {role === 'admin' && (
                                  <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => handleOpenCategoryModal(c)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px' }}>Editar</button>
                                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px' }}>Excluir</button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SELLERS */}
            {activeTab === 'sellers' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px' }} className="admin-sellers-layout">
                
                {/* Sellers List */}
                <div>
                  <h3 style={{ color: 'white', marginBottom: '20px' }}>Vendedores Cadastrados</h3>
                  <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Slug (Referência)</th>
                          <th>WhatsApp Vendedor</th>
                          <th>Total Pedidos</th>
                          <th>Link de Divulgação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellers.map(sel => (
                          <tr key={sel.id}>
                            <td><b>{sel.name}</b></td>
                            <td><code>{sel.slug}</code></td>
                            <td>{sel.phone}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{sel.orders_count}</td>
                            <td>
                              <input 
                                type="text" 
                                readOnly 
                                value={`https://antenorefilhos.com.br/boutique?ref=${sel.slug}`}
                                style={{
                                  backgroundColor: '#1a1e26',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '11px',
                                  padding: '6px',
                                  width: '240px'
                                }}
                                onClick={(e) => { e.target.select(); document.execCommand('copy'); alert('Link copiado!'); }}
                                title="Clique para copiar"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Create Seller Form */}
                <aside>
                  {role === 'admin' ? (
                    <form onSubmit={handleCreateSeller} className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        Cadastrar Novo Vendedor
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label">Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Carlos Santos" 
                          className="form-control"
                          value={newSeller.name}
                          onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">WhatsApp (DDD+Celular, sem traço)</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="Ex: 5524988650462" 
                          className="form-control"
                          value={newSeller.phone}
                          onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Código de Indicação (Slug opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: carlos" 
                          className="form-control"
                          value={newSeller.slug}
                          onChange={(e) => setNewSeller({ ...newSeller, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                        Salvar Vendedor
                      </button>
                    </form>
                  ) : (
                    <div className="glass" style={{ padding: '30px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ⚠️ Cadastro de vendedores desabilitado no nível de permissão Manager.
                    </div>
                  )}
                </aside>
              </div>
            )}

            {/* TAB 5: STATS */}
            {activeTab === 'stats' && (
              <div>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>Relatórios e Métricas de Atendimento</h3>
                
                {/* Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Total de Orçamentos</h5>
                    <span style={{ fontSize: '36px', color: 'white', fontWeight: 'bold' }}>{totalOrders}</span>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Pedidos Pendentes</h5>
                    <span style={{ fontSize: '36px', color: 'var(--warning)', fontWeight: 'bold' }}>{pendingOrders}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Pedidos Finalizados</h5>
                    <span style={{ fontSize: '36px', color: 'var(--success)', fontWeight: 'bold' }}>{completedOrders}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Faturamento Estimado</h5>
                    <span style={{ fontSize: '30px', color: 'var(--primary)', fontWeight: 'bold' }}>R$ {calculateTotalRevenue(true).toFixed(2)}</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Total: R$ {calculateTotalRevenue(false).toFixed(2)}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap' }} className="stats-graphics-grid">
                  
                  {/* Left Side: Orders by Date list */}
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>📅 Volume por Data (Últimos dias)</h4>
                    {getOrdersCountByDate().length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>Sem dados.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {getOrdersCountByDate().map(([date, count]) => (
                          <li key={date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #161922', fontSize: '13px', color: 'white' }}>
                            <span>{date}</span>
                            <b>{count} orçamento(s)</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Right Side: Top products sold */}
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>🏆 Produtos Mais Solicitados</h4>
                    {getTopProducts().length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>Sem solicitações.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {getTopProducts().map(([title, qty], index) => (
                          <li key={title} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #161922', fontSize: '13px', color: 'white' }}>
                            <span>{index + 1}. {title}</span>
                            <b>{qty} unidades</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Seller commissions performance ranking */}
                <h3 style={{ color: 'white', marginTop: '40px', marginBottom: '20px' }}>Desempenho de Vendas por Vendedor</h3>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '30px' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {sellers.map((sel, idx) => {
                      const percentage = totalOrders > 0 ? (sel.orders_count / totalOrders) * 100 : 0;
                      return (
                        <li key={sel.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'white' }}>
                            <span><b>#{idx+1}</b> {sel.name} (<code>{sel.slug}</code>)</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{sel.orders_count} pedidos ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#1a1e26', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--primary)' }}></div>
                          </div>
                        </li>
                      );
                    })}
                    
                    {/* Site Direct sales */}
                    {(() => {
                      const directCount = orders.filter(o => !o.seller_id).length;
                      const percentage = totalOrders > 0 ? (directCount / totalOrders) * 100 : 0;
                      return (
                        <li style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'white' }}>
                            <span>🌐 Compras Diretas no Site (Sem vendedor)</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{directCount} pedidos ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#1a1e26', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--text-muted)' }}></div>
                          </div>
                        </li>
                      );
                    })()}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRODUCT FORM MODAL (Admin Only) */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <form onSubmit={handleSaveProduct} className="glass" style={{
            maxWidth: '650px',
            width: '100%',
            backgroundColor: '#0c0e12',
            border: '1px solid var(--primary)',
            padding: '30px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              {productForm.id ? '📝 Editar Produto' : '➕ Cadastrar Novo Produto'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="stats-graphics-grid">
              <div className="form-group">
                <label className="form-label">Título do Produto</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Shoulder Steak Novilho"
                  className="form-control"
                  value={productForm.title}
                  onChange={(e) => handleProductTitleChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug (URL)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="shoulder-steak-novilho"
                  className="form-control"
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea 
                rows="2"
                placeholder="Detalhes sobre a procedência, marmorização, etc."
                className="form-control"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }} className="stats-graphics-grid">
              <div className="form-group">
                <label className="form-label">EAN (SKU/Código)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 789123456"
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
                  placeholder="Ex: 89.90"
                  className="form-control"
                  value={productForm.preco}
                  onChange={(e) => setProductForm({ ...productForm, preco: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Peso</label>
                  <input 
                    type="text" 
                    placeholder="400"
                    className="form-control"
                    value={productForm.peso}
                    onChange={(e) => setProductForm({ ...productForm, peso: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label className="form-label">Unidade</label>
                  <select 
                    className="form-control"
                    value={productForm.unidade_peso}
                    onChange={(e) => setProductForm({ ...productForm, unidade_peso: e.target.value })}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="un">un</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }} className="stats-graphics-grid">
              <div className="form-group">
                <label className="form-label">Setor</label>
                <select 
                  className="form-control"
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                >
                  <option value="carnes_">🥩 Boutique (Carnes)</option>
                  <option value="adega">🍷 Adega (Vinho)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-control"
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                >
                  <option value="on">Ativo (Exibido)</option>
                  <option value="off">Inativo (Oculto)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pontuação (Vinhos)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 94 pts"
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
                placeholder="https://antenorefilhos.com.br/wp-content/..."
                className="form-control"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              />
            </div>

            {/* Category checkboxes */}
            <div className="form-group">
              <label className="form-label">Categorias / Taxonomias Vinculadas</label>
              <div style={{
                maxHeight: '140px',
                overflowY: 'auto',
                backgroundColor: '#161922',
                border: '1px solid var(--border-color)',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px'
              }}>
                {categories.map(cat => {
                  let labelPrefix = '';
                  switch (cat.type) {
                    case 'sessoes_carnes_': labelPrefix = '🥩 Categoria'; break;
                    case 'sessoes_vinho_': labelPrefix = '🍷 Vinho'; break;
                    case 'racas_carnes': labelPrefix = '🐂 Raça'; break;
                    case 'embalagem_carnes': labelPrefix = '📦 Embalagem'; break;
                  }
                  return (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'white', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={productForm.categoryIds.includes(cat.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const updated = isChecked
                            ? [...productForm.categoryIds, cat.id]
                            : productForm.categoryIds.filter(id => id !== cat.id);
                          setProductForm({ ...productForm, categoryIds: updated });
                        }}
                      />
                      <span>[{labelPrefix}] {cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 25px' }}>
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY FORM MODAL (Admin Only) */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <form onSubmit={handleSaveCategory} className="glass" style={{
            maxWidth: '450px',
            width: '100%',
            backgroundColor: '#0c0e12',
            border: '1px solid var(--primary)',
            padding: '30px'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              {categoryForm.id ? '📝 Editar Categoria' : '➕ Nova Categoria / Tag'}
            </h3>

            <div className="form-group">
              <label className="form-label">Nome da Categoria</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Angus"
                className="form-control"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL)</label>
              <input 
                type="text" 
                required 
                placeholder="angus"
                className="form-control"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Taxonomia</label>
              <select 
                className="form-control"
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
              >
                <option value="sessoes_carnes_">🥩 Categoria de Carnes</option>
                <option value="sessoes_vinho_">🍷 Categoria de Vinhos</option>
                <option value="racas_carnes">🐂 Raças de Carnes (Angus, Wagyu, etc.)</option>
                <option value="embalagem_carnes">📦 Embalagens de Carnes (Peça, Fatiado, etc.)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 25px' }}>
                Salvar Categoria
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
