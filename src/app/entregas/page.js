export const metadata = {
  title: "Política de Entregas e Frota Frigorificada | Antenor e Filhos",
  description: "Entregas programadas de segunda a sexta com frota frigorificada própria monitorada. Atendemos a Região Serrana, Metropolitana, Lagos e Niterói.",
  alternates: {
    canonical: "https://antenorefilhos.com.br/entregas"
  }
};

export default function EntregasPage() {
  return (
    <div style={{ minHeight: '80vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '10px'
          }}>
            Logística & Frota
          </span>
          <h1 style={{ fontSize: '38px', color: 'white', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
            Política de Entregas
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--primary)', margin: '0 auto' }}></div>
        </div>

        {/* Content Section 1: Schedule */}
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Dias & Horários de Distribuição
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '20px' }}>
            Nossas entregas de atacado e varejo são organizadas em rotas programadas de <b>segunda a sexta-feira</b>, garantindo agilidade e pontualidade na entrega do seu pedido.
          </p>
        </section>

        {/* Content Section 2: Coverage Areas */}
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Regiões Atendidas
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '15px' }}>
            Atendemos as principais regiões do Estado do Rio de Janeiro:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '2', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            <li><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> <b>Região Metropolitana</b>: Rio de Janeiro (Zonas Sul, Oeste, Norte e Centro).</li>
            <li><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> <b>Niterói & São Gonçalo</b>.</li>
            <li><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> <b>Região Serrana</b>: Petrópolis, Itaipava, Teresópolis, Nova Friburgo.</li>
            <li><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> <b>Região dos Lagos</b>: Cabo Frio, Armação dos Búzios, São Pedro da Aldeia, Macaé.</li>
          </ul>
        </section>

        {/* Content Section 3: Refrigerated Fleet */}
        <section style={{ marginBottom: '50px' }}>
          <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Frota Frigorificada
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
            O grande diferencial do transporte da Antenor & Filhos é a preservação rigorosa da cadeia fria. Todos os nossos veículos são **100% frigorificados e climatizados** de acordo com as normas da vigilância sanitária. A temperatura é monitorada ativamente, garantindo que as carnes resfriadas, congeladas e pescados cheguem à sua cozinha no estado de conservação perfeito.
          </p>
        </section>

        {/* Contact info banner */}
        <section className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '20px', marginBottom: '15px', fontFamily: 'var(--font-serif)' }}>
            Dúvidas sobre o frete do seu pedido?
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            Fale diretamente com o nosso setor de expedição para saber a data exata da rota na sua rua ou agendar uma entrega:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h5 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Telefone Varejo (Loja)</h5>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> (24) 2222-1482
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 'normal' }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', marginRight: '4px' }}></i> WhatsApp
                </span>
              </p>
            </div>
            <div>
              <h5 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Expedição Distribuidora</h5>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> (24) 2223-1945
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
