import AdminUIProvider from '@/components/admin/ui/AdminUIProvider';

export default function AdminLayout({ children }) {
  const adminThemeStyles = {
    // Gold oficial da marca (DESIGN.md). Hover escurece (fundo do admin é claro),
    // em vez do valor anterior que clareava o primary.
    '--color-primary': '#D2BB8A',
    '--color-primary-hover': '#c2a877',
    '--color-primary-content': '#232122',
    '--color-wine': '#5D082A',
    '--color-success': '#10b981',
    '--color-warning': '#f59e0b',
    '--color-error': '#ef4444',

    // Garantir base clara perfeita no admin
    '--color-base-100': '#ffffff',
    '--color-base-200': '#f8fafc',
    '--color-base-300': '#e2e8f0',
    '--color-base-content': '#0f172a',

    // Restaurar arredondamentos do DaisyUI 5
    '--radius-field': '6px',
    '--radius-box': '8px',
    '--radius-selector': '9999px',

    // Restaurar arredondamentos padrão do Tailwind v4
    '--radius-sm': '4px',
    '--radius-md': '6px',
    '--radius-lg': '8px',
    '--radius-round': '9999px',

    // Forçar a fonte padrão limpa do sistema/Inter no escopo do admin
    fontFamily: 'var(--font-inter), sans-serif',

    // Escala Tipográfica Compacta Global (Tier S)
    '--text-xs': '11px',
    '--text-sm': '13px',
    '--text-base': '14.5px',
    '--text-lg': '16px',
    '--text-xl': '18px',
    '--text-2xl': '22px',
    '--text-3xl': '28px',
  };

  return (
    <div data-theme="light" className="bg-base-200 text-base-content min-h-screen p-0 md:p-6 flex items-center justify-center w-full" style={adminThemeStyles}>
      <div className="w-full max-w-[1680px] mx-auto bg-base-100 rounded-box shadow-2xl border border-base-300 min-h-[calc(100vh-3rem)] flex flex-col md:flex-row overflow-hidden">
        <AdminUIProvider>{children}</AdminUIProvider>
      </div>
    </div>
  );
}

