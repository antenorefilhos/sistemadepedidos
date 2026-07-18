'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getFingerprint, trackEvent } from '@/lib/telemetry';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [cartIds, setCartIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSeller, setActiveSeller] = useState(null);

  // Form Fields
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    city: '',
    notes: '',
    delivery_date: '',
    delivery_period: ''
  });

  useEffect(() => {
    // 1. Load active seller
    try {
      const storedSeller = localStorage.getItem('ref_seller');
      if (storedSeller) {
        setActiveSeller(JSON.parse(storedSeller));
      }
    } catch (e) {
      console.warn('Invalid seller in storage, clearing...');
      localStorage.removeItem('ref_seller');
    }

    // 2. Load cart items
    const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
    const ids = cartStr.split(',').filter(id => id.trim() !== '');
    setCartIds(ids);

    // 3. Fetch products to get details
    const fetchProductDetails = async () => {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

       try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const prods = await res.json();
          // Filter products that are in our cart IDs, extracting base ID
          const uniqueIds = new Set(ids.map(id => id.split('_')[0]));
          const filtered = prods.filter(p => uniqueIds.has(String(p.id)));
          setProducts(filtered);
        }
      } catch (err) {
        console.error('Error fetching cart products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, []);

  // Compute quantity and lists
  const cartQuantities = cartIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const updateQuantity = (id, newQty) => {
    let updatedIds = [...cartIds];
    const currentQty = cartQuantities[id] || 0;

    if (newQty > currentQty) {
      // Add items
      const diff = newQty - currentQty;
      for (let i = 0; i < diff; i++) {
        updatedIds.push(String(id));
      }
    } else if (newQty < currentQty) {
      // Remove items
      const diff = currentQty - newQty;
      for (let i = 0; i < diff; i++) {
        const idx = updatedIds.indexOf(String(id));
        if (idx > -1) {
          updatedIds.splice(idx, 1);
        }
      }
    }

    setCartIds(updatedIds);
    localStorage.setItem('jet_engine_store_carrinho', updatedIds.join(','));
    window.dispatchEvent(new Event('cart_changed'));

    // Remove product details from state if all variations of this product are 0
    if (newQty === 0) {
      const realProductId = String(id).split('_')[0];
      const remainingVariations = updatedIds.some(cartId => cartId.split('_')[0] === realProductId);
      if (!remainingVariations) {
        setProducts(products.filter(p => String(p.id) !== String(realProductId)));
      }
    }
  };

  // Compute cart items details with variations
  const cartItemsDetails = Object.keys(cartQuantities).map(cartKey => {
    const [realId, unitType] = cartKey.split('_');
    const product = products.find(p => String(p.id) === String(realId));
    if (!product) return null;

    let displayPrice = product.preco || 0;
    let unitLabel = 'Garrafa';
    let factor = 1;

    if (unitType === 'c6') {
      displayPrice = displayPrice * 6;
      unitLabel = 'Caixa com 6un';
      factor = 6;
    } else if (unitType === 'c12') {
      displayPrice = displayPrice * 12;
      unitLabel = 'Caixa com 12un';
      factor = 12;
    }

    return {
      cartKey,
      realId,
      unitType,
      product,
      qty: cartQuantities[cartKey] || 0,
      displayPrice,
      unitLabel,
      factor,
      totalPhysicalUnits: (cartQuantities[cartKey] || 0) * factor
    };
  }).filter(Boolean);

  const totalOrderPrice = cartItemsDetails.reduce((acc, item) => {
    return acc + (item.displayPrice * item.qty);
  }, 0);

  const totalPhysicalGarrafas = cartItemsDetails.reduce((acc, item) => {
    return acc + item.totalPhysicalUnits;
  }, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'delivery_date' && value) {
      const day = new Date(value + 'T00:00:00').getDay();
      if (day === 0) {
        alert('Não realizamos entregas aos domingos. Por favor, escolha outro dia útil ou sábado.');
        setFormData({ ...formData, [name]: '' });
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartIds.length === 0) return;

    if (!formData.name || !formData.whatsapp) {
      setFormError('Preencha seu nome e WhatsApp para continuar.');
      return;
    }
    setFormError('');

    setSubmitting(true);

    // Prepare order items using details
    const orderItems = cartItemsDetails.map(item => ({
      product_id: item.product.id,
      title: `${item.product.title} (${item.unitLabel})`,
      sku: item.product.sku || '',
      quantity: item.qty,
      price: item.displayPrice
    }));

    // Concatenar campos de endereço de forma bonita
    let finalAddress = formData.address || '';
    if (formData.neighborhood) {
      finalAddress += finalAddress ? `, Bairro: ${formData.neighborhood}` : `Bairro: ${formData.neighborhood}`;
    }
    if (formData.city) {
      finalAddress += finalAddress ? `, ${formData.city}` : `${formData.city}`;
    }

    const orderPayload = {
      customer_name: formData.name,
      customer_whatsapp: formData.whatsapp,
      customer_email: formData.email,
      customer_address: finalAddress || null,
      notes: formData.notes,
      seller_id: activeSeller ? activeSeller.id : null,
      fingerprint: getFingerprint(),
      delivery_date: formData.delivery_date || null,
      delivery_period: formData.delivery_period || null,
      items: orderItems
    };

    try {
      // Telemetria local antes de enviar
      trackEvent('checkout', { total_items: orderItems.length });

      // 1. Save to server database
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const orderRes = await res.json();
        const orderId = orderRes.orderId;

        // 2. Format WhatsApp Message
        let message = `*SOLICITAÇÃO DE ORÇAMENTO - #${orderId}*\n\n`;
        message += `*Cliente:* ${formData.name}\n`;
        message += `*WhatsApp:* ${formData.whatsapp}\n`;
        if (formData.email) message += `*Email:* ${formData.email}\n`;
        if (finalAddress) message += `*Entregar em:* ${finalAddress}\n`;
        if (formData.delivery_date) {
          const dateFormatted = formData.delivery_date.split('-').reverse().join('/');
          const periodText = formData.delivery_period ? ` (${formData.delivery_period})` : '';
          message += `*Entrega Programada:* ${dateFormatted}${periodText}\n`;
        }
        if (formData.notes) message += `*Observações:* ${formData.notes}\n`;
        
        if (activeSeller) {
          message += `*Vendedor:* ${activeSeller.name}\n`;
        }
        
        message += `\n*PRODUTOS REQUISITADOS:*\n`;
        
        cartItemsDetails.forEach(item => {
          const itemTotal = item.displayPrice * item.qty;
          const skuText = item.product.sku ? ` (EAN: ${item.product.sku})` : '';
          const priceText = item.displayPrice > 0 
            ? ` - R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
            : ' - Preço sob consulta';
          message += `- ${item.qty}x ${item.product.title} (${item.unitLabel})${skuText}${priceText}\n`;
        });

        message += `\n*TOTAL ESTIMADO:* R$ ${totalOrderPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `*TOTAL DE UNIDADES:* ${totalPhysicalGarrafas} item(ns)/garrafa(s)\n`;
        
        message += `\n_Orçamento enviado via antenorefilhos.com.br_`;

        // 3. Clear cart
        localStorage.removeItem('jet_engine_store_carrinho');
        window.dispatchEvent(new Event('cart_changed'));

        // 4. Determine destination WhatsApp number
        // If selling through a validated seller, redirect to the seller's specific WhatsApp!
        // Else, redirect to store main WhatsApp.
        const rawPhone = activeSeller ? activeSeller.phone : '5524988650462';
        const destPhone = rawPhone.replace(/\D/g, ''); // Garante que só tenha números
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${destPhone}&text=${encodeURIComponent(message)}`;

        // 5. Open WhatsApp in a new tab
        window.open(whatsappUrl, '_blank');

        // 6. Navigate current page to /obrigado
        router.push('/obrigado');
      } else {
        setFormError('Não foi possível enviar seu orçamento. Verifique sua conexão e tente novamente.');
      }
    } catch (err) {
      console.error('Error submitting checkout:', err);
      setFormError('Ocorreu um erro inesperado. Tente novamente em alguns instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Carregando sua lista...</h2>
      </div>
    );
  }

  if (cartIds.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>🛒</span>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Sua lista está vazia</h2>
        <p style={{ marginBottom: '30px' }}>Adicione produtos da boutique ou adega para montar seu orçamento.</p>
        <Link href="/boutique" className="btn btn-primary">
          Explorar Boutique & Adega
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: '40px' }}>
      <div className="container">
        <h1 style={{ fontSize: '32px', color: 'white', marginBottom: '30px' }}>Revise seu Orçamento</h1>
        
        <div className="checkout-layout">
          
          {/* Cart Items List */}
          <main>
            <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Produtos Selecionados ({cartItemsDetails.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItemsDetails.map(item => {
                const { cartKey, product, qty, displayPrice, unitLabel } = item;
                if (qty === 0) return null;
                
                return (
                  <div key={cartKey} className="checkout-item-card">
                    {/* Thumbnail (Exactly 1:1) */}
                    <div style={{ position: 'relative', width: '80px', height: '80px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.title} fill sizes="80px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>Sem foto</div>
                      )}
                    </div>

                    {/* Product Contents */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Top: Description (takes full width) */}
                      <div>
                        <h4 
                          style={{ color: 'white', fontSize: '15px', marginBottom: '2px', fontWeight: '500' }}
                          dangerouslySetInnerHTML={{ __html: `${product.title} <span style="font-size: 0.8em; color: var(--primary); font-weight: normal; margin-left: 5px;">(${unitLabel})</span>` }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {product.sku ? `EAN: ${product.sku}` : ''} 
                          {product.peso ? ` | Peso unitário: ${product.peso} ${product.unidade_peso}` : ''}
                        </p>
                      </div>
                      
                      {/* Bottom: Price and Quantity Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {displayPrice > 0 ? (
                            <>
                              <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                                {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Subtotal: R$ {(displayPrice * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Preço sob consulta</span>
                          )}
                        </div>

                        {/* Quantity selectors */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => updateQuantity(cartKey, qty - 1)}
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '12px', minWidth: '32px' }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold', color: 'white', fontSize: '14px' }}>
                            {qty}
                          </span>
                          <button 
                            onClick={() => updateQuantity(cartKey, qty + 1)}
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '12px', minWidth: '32px' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Checkout Info Form */}
          <aside>
            <div className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
               Suas Informações de Contato
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="Seu nome completo" 
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp (Celular) *</label>
                  <input 
                    type="tel" 
                    name="whatsapp" 
                    required 
                    placeholder="Ex: (24) 98865-0462" 
                    className="form-control"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="seuemail@exemplo.com" 
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço de Entrega (Opcional)</label>
                  <input 
                    type="text" 
                    name="address" 
                    placeholder="Rua, Avenida, Praça e Número" 
                    className="form-control"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input 
                      type="text" 
                      name="neighborhood" 
                      placeholder="Ex: Itaipava" 
                      className="form-control"
                      value={formData.neighborhood || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input 
                      type="text" 
                      name="city" 
                      placeholder="Ex: Petrópolis" 
                      className="form-control"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Data de Entrega (Opcional)</label>
                    <input 
                      type="date" 
                      name="delivery_date" 
                      className="form-control"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.delivery_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Período de Entrega</label>
                    <select 
                      name="delivery_period" 
                      className="form-control"
                      value={formData.delivery_period || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Qualquer Horário</option>
                      <option value="Manhã">Manhã (09h às 13h)</option>
                      <option value="Tarde">Tarde (13h às 18h)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea 
                    name="notes" 
                    rows="3" 
                    placeholder="Alguma observação sobre ponto da carne, safra do vinho, etc." 
                    className="form-control"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                {activeSeller && (
                  <div style={{
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '12px',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                  }}>
                    📢 Seu atendimento será finalizado no WhatsApp do vendedor: <b>{activeSeller.name}</b>.
                  </div>
                )}

                {formError && (
                  <p style={{
                    color: 'var(--danger)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'rgba(176, 0, 32, 0.08)',
                    border: '1px solid rgba(176, 0, 32, 0.3)',
                  }}>
                    {formError}
                  </p>
                )}

                {/* Resumo de Totais do Orçamento */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '15px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Total de Itens:</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>
                      {cartItemsDetails.reduce((sum, item) => sum + item.qty, 0)} item(ns)
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Total Físico (Garrafas/Carnes):</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>
                      {totalPhysicalGarrafas} un
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    color: 'white',
                    fontWeight: 'bold',
                    marginTop: '6px',
                    borderTop: '1px dotted var(--border-color)',
                    paddingTop: '10px'
                  }}>
                    <span>Total Estimado:</span>
                    <span style={{ color: 'var(--primary)' }}>
                      R$ {totalOrderPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  {submitting ? 'Enviando orçamento...' : 'Solicitar Orçamento via WhatsApp'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
