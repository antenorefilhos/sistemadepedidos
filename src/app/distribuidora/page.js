export const metadata = {
  title: "Distribuidora de Carnes Nobres e Exóticas | Antenor e Filhos",
  description: "Tradição de mais de 47 anos em logística e distribuição de carnes nobres e exóticas para estabelecimentos comerciais no Estado do Rio de Janeiro.",
  alternates: {
    canonical: "https://antenorefilhos.com.br/distribuidora"
  }
};

export default function DistribuidoraPage() {
  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', padding: '60px 0' }}>
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
            Logística & Tradição
          </span>
          <h1 style={{ fontSize: '38px', color: 'white', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
            Nossa Distribuidora
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--primary)', margin: '0 auto' }}></div>
        </div>

        {/* Content Section 1: History */}
        <section style={{ marginBottom: '50px' }}>
          <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            História & Tradição
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
            Com mais de 47 anos de tradição no mercado, a <b>Antenor & Filhos</b> se destaca como referência em logística e distribuição de carnes nobres e exóticas no Estado do Rio de Janeiro. Nossa história é pautada pelo compromisso contínuo com a qualidade, procedência e a satisfação de um público exigente de paladar apurado.
          </p>
        </section>

        {/* Content Section 2: Quality & Fleet */}
        <section style={{ marginBottom: '50px' }}>
          <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Qualidade, Inspeção & Frota
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
            Nossa estrutura robusta e altamente eficiente atende com rigor às mais exigentes normas de higiene, segurança alimentar e qualidade do mercado. Cada lote que distribuímos passa por processos criteriosos de inspeção sanitária e seleção de fornecedores homologados.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
            Garantimos a manutenção da cadeia do frio de ponta a ponta. Todas as entregas são realizadas por nossa <b>frota própria de veículos frigorificados e climatizados</b>, monitorados para assegurar que o produto chegue perfeitamente fresco e seguro ao seu estabelecimento.
          </p>
        </section>

        {/* Content Section 3: Wholesale Contacts */}
        <section className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', marginTop: '40px' }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '20px', marginBottom: '15px', fontFamily: 'var(--font-serif)' }}>
            Contato para Atacado / Distribuição
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            Atendemos restaurantes, churrascarias, hotéis, mercados gourmet e parceiros comerciais em todo o Estado do Rio de Janeiro com condições diferenciadas de faturamento e volumes de atacado.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h5 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Telefone Fixo Atacado</h5>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> (24) 2223-1945
              </p>
            </div>
            <div>
              <h5 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>WhatsApp Atacado</h5>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>
                <a href="https://wa.me/5524988165164?text=Olá,%20gostaria%20de%20solicitar%20a%20tabela%20de%20atacado" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  <i className="fa-brands fa-whatsapp" style={{ marginRight: '6px' }}></i> (24) 98816-5164 ↗
                </a>
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
