import { Suspense } from 'react';
import BoutiqueClient from './BoutiqueClient';

export const metadata = {
  title: "Boutique de Carnes Nobres e Exóticas em Itaipava | Antenor e Filhos",
  description: "Faça seu pedido de orçamento para carnes nobres: Angus, Hereford, Wagyu e cortes exóticos (jacaré, coelho, javali, cordeiro). Entrega em todo o RJ.",
  alternates: {
    canonical: "https://antenorefilhos.com.br/boutique"
  }
};

export default function BoutiquePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>Carregando catálogo de carnes...</div>}>
      <BoutiqueClient />
    </Suspense>
  );
}
