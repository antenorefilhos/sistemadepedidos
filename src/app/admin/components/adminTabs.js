// Fonte única de verdade da navegação do admin, consumida tanto pelo menu desktop
// (<aside>) quanto pelo <select> mobile em page.js. Antes eram duas listas hardcoded
// e dessincronizadas (faltavam "Clientes" e "Avaliações" no select mobile).
export const ADMIN_TAB_GROUPS = [
  {
    id: 'main',
    tabs: [
      { key: 'orders', icon: 'fa-list-check', label: 'Orçamentos', countKey: 'orders' },
      { key: 'products', icon: 'fa-drumstick-bite', label: 'Catálogo', countKey: 'products' },
      { key: 'categories', icon: 'fa-tags', label: 'Categorias', countKey: 'categories' },
      { key: 'sellers', icon: 'fa-users', label: 'Vendedores', countKey: 'sellers' },
      { key: 'customers', icon: 'fa-address-book', label: 'Clientes' },
      { key: 'stats', icon: 'fa-brain', label: 'Inteligência AI' },
      { key: 'monitor', icon: 'fa-desktop', label: 'Monitor Ao Vivo' },
      { key: 'solidcon', icon: 'fa-cloud-arrow-down', label: 'Integração ERP' },
    ],
  },
  {
    id: 'extended',
    title: 'Painel Estendido',
    tabs: [
      { key: 'recipes', icon: 'fa-book-open', label: 'Receitas' },
      { key: 'menu_restaurant', icon: 'fa-utensils', label: 'Cardápio (Admin)' },
      { key: 'biolinks', icon: 'fa-link', label: 'Biolinks (Admin)' },
      { key: 'reviews', icon: 'fa-star', label: 'Avaliações' },
      { key: 'settings', icon: 'fa-gear', label: 'Configurações' },
    ],
  },
];

export const ADMIN_EXTERNAL_LINKS = [
  { href: '/adega', icon: 'fa-wine-glass', label: 'Abrir Adega' },
  { href: '/boutique', icon: 'fa-store', label: 'Abrir Boutique' },
  { href: '/cardapio', icon: 'fa-utensils', label: 'Abrir Cardápio' },
];

export const ADMIN_TABS_FLAT = ADMIN_TAB_GROUPS.flatMap((g) => g.tabs);
