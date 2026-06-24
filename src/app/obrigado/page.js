import Link from 'next/link';

export default function ObrigadoPage() {
  return (
    <div className="page-wrapper" style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="glass" style={{
        maxWidth: '550px',
        width: '100%',
        padding: '50px 40px',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }}>🍷🥩</span>
        <h1 style={{
          fontSize: '36px',
          color: 'var(--primary)',
          fontFamily: 'var(--font-serif)',
          marginBottom: '20px'
        }}>
          Orçamento Enviado!
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '35px'
        }}>
          Sua lista foi registrada com sucesso no nosso sistema e você foi redirecionado para o WhatsApp para atendimento. Nossa equipe irá conferir a disponibilidade dos itens em estoque e entrará em contato para finalizar sua compra.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/boutique" className="btn btn-primary" style={{ padding: '12px', fontWeight: 'bold' }}>
            Voltar para a Boutique
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ padding: '12px' }}>
            Ir para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
