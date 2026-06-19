import { Suspense } from 'react';
import AdegaClient from './AdegaClient';

export const metadata = {
  title: "Adega de Vinhos Finos em Itaipava | Antenor e Filhos",
  description: "Rótulos selecionados das melhores vinícolas do Velho e Novo Mundo. Solicite seu orçamento de vinhos online para entrega rápida na Região Serrana e Rio de Janeiro.",
  alternates: {
    canonical: "https://antenorefilhos.com.br/adega"
  }
};

export default function AdegaPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>Carregando catálogo de vinhos...</div>}>
      <AdegaClient />
    </Suspense>
  );
}
