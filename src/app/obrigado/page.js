import Link from 'next/link';

export default function ObrigadoPage() {
  return (
    <div className="page-wrapper" style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: '40px',
      paddingLeft: '20px',
      paddingRight: '20px'
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
          Pedido Recebido com Sucesso!
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '35px'
        }}>
          Sua lista foi registrada e o WhatsApp foi aberto para finalizar o atendimento.
          Nossa equipe irá confirmar a disponibilidade e os preços antes de concluir a compra.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/boutique" className="btn btn-primary" style={{ padding: '12px', fontWeight: 'bold' }}>
            Continuar Comprando
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ padding: '12px' }}>
            Ir para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
