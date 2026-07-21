// Cálculos de negócio compartilhados (antes duplicados entre page.js e HermesDashboard.js).
export function getOrderTotal(order, products) {
  if (!order.items || !Array.isArray(order.items)) return 0;
  return order.items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || products.find((p) => p.title === item.product_title)?.preco || 0;
    return sum + itemPrice * (Number(item.quantity) || 1);
  }, 0);
}

export function calculateTotalRevenue(orders, products, completedOnly = false) {
  return orders.reduce((sum, order) => {
    if (completedOnly && order.status !== 'completed') return sum;
    return sum + getOrderTotal(order, products);
  }, 0);
}

export function getSellersPerformance(orders, products) {
  const perf = {};
  orders.forEach((o) => {
    const sName = o.seller_name || 'Site Direto';
    if (!perf[sName]) perf[sName] = { name: sName, count: 0, revenue: 0, pending: 0, completed: 0 };
    perf[sName].count += 1;
    perf[sName].revenue += getOrderTotal(o, products);
    if (o.status === 'completed') perf[sName].completed += 1;
    else perf[sName].pending += 1;
  });
  return Object.values(perf)
    .map((p) => ({ ...p, avgTicket: p.count > 0 ? p.revenue / p.count : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getSalesByCategory(orders, products) {
  let adega = 0;
  let carnes = 0;
  orders.forEach((o) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item) => {
        const itemPrice = Number(item.price) || products.find((p) => p.title === item.product_title)?.preco || 0;
        const amount = itemPrice * (Number(item.quantity) || 1);
        if (item.product_category === 'adega' || item.product_title?.toLowerCase().includes('vinho')) {
          adega += amount;
        } else {
          carnes += amount;
        }
      });
    }
  });
  return [
    ['Boutique de Carnes', carnes],
    ['Adega de Vinhos', adega],
  ].sort((a, b) => b[1] - a[1]);
}
