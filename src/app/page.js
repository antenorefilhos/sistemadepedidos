import Link from 'next/link';

export const metadata = {
  title: "Antenor e Filhos | Boutique de Carnes Nobres, Adega e Restaurante em Itaipava",
  description: "Boutique de Carnes Nobres (Angus, Wagyu, exóticas), adega climatizada de vinhos selecionados e restaurante premium na Serra Fluminense. Faça seu orçamento online.",
  alternates: {
    canonical: "https://antenorefilhos.com.br"
  }
};

export default function Home() {
  return (
    <div>
      {/* Premium Parallax Hero Section */}
      <section style={{
        position: 'relative',
        height: 'calc(100vh - 80px)',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(11, 12, 14, 1)), url("/images/hero.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 20px'
      }}>
        <div style={{ maxWidth: '800px', zIndex: 2 }}>
          <span style={{
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            display: 'block',
            marginBottom: '15px'
          }}>
            Itaipava &bull; Petrópolis
          </span>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 68px)',
            fontFamily: 'var(--font-serif)',
            color: 'white',
            lineHeight: '1.1',
            marginBottom: '20px',
            textShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}>
            Experiência Gastronômica Exclusiva
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(16px, 2.5vw, 19px)',
            marginBottom: '35px',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 35px auto'
          }}>
            Boutique de carnes nobres e exóticas, adega de vinhos selecionados e restaurante premium na serra fluminense.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="/boutique" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
              Ver Catálogo de Pedidos
            </Link>
            <a href="#operation" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '15px' }}>
              Conhecer a Casa
            </a>
          </div>
        </div>
      </section>

      {/* Corporate Info / Business Areas */}
      <section id="operation" className="section" style={{ backgroundColor: 'var(--bg-main)', position: 'relative' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '36px', color: 'white', marginBottom: '20px' }}>
              Nossa Operação
            </h2>
            <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--primary)', margin: '0 auto 20px auto' }}></div>
            <p>
              Oferecemos uma experiência completa com qualidade e procedência garantida em cada detalhe. Conheça as frentes da nossa casa em Itaipava.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {/* Area 1: Carnes */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              transition: 'border-color var(--transition-normal)',
              position: 'relative',
              overflow: 'hidden'
            }} className="operation-card">
              <h3 style={{ fontSize: '22px', color: 'white', marginBottom: '15px' }}>Boutique de Carnes</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
                Os cortes mais nobres do mercado nacional e internacional. Raças britânicas Angus e Hereford, cortes Wagyu de alta marmorização, além de carnes exóticas como coelho, jacaré, javali e cordeiro selecionado.
              </p>
              <Link href="/boutique" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Fazer Pedido de Carnes &rarr;
              </Link>
            </div>

            {/* Area 2: Adega */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              transition: 'border-color var(--transition-normal)'
            }} className="operation-card">
              <h3 style={{ fontSize: '22px', color: 'white', marginBottom: '15px' }}>Adega & Delicatessen</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
                Rótulos selecionados das melhores vinícolas do Velho e Novo Mundo. Do clássico ao exclusivo, nossa adega climatizada harmoniza perfeitamente com a sofisticação de nossos pratos e carnes, além de queijos e antepastos.
              </p>
              <Link href="/adega" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Fazer Pedido de Vinhos &rarr;
              </Link>
            </div>

            {/* Area 3: Restaurante */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              transition: 'border-color var(--transition-normal)'
            }} className="operation-card">
              <h3 style={{ fontSize: '22px', color: 'white', marginBottom: '15px' }}>Restaurante & Brasa</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
                Para quem deseja degustar no local, nosso restaurante oferece grelhados na brasa preparados na hora por mestres churrasqueiros, acompanhamentos refinados e atendimento diferenciado em ambiente aconchegante.
              </p>
              <a href="https://wa.me/552422221482?text=Gostaria%20de%20reservar%20uma%20mesa%20no%20Restaurante" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i> Reservar uma Mesa &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Local Store Map and Address Banner */}
      <section className="section" style={{
        backgroundImage: 'linear-gradient(rgba(11, 12, 14, 0.95), rgba(11, 12, 14, 0.95)), url("/images/hero.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '50px',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '32px', color: 'white', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
              Visite nossa Loja Física
            </h2>
            <p style={{ marginBottom: '25px', fontSize: '15px' }}>
              Estamos localizados no coração de Itaipava, em Petrópolis. Venha conhecer nossa boutique de carnes, escolher seus vinhos direto na adega e desfrutar do nosso espaço gourmet de restaurante.
            </p>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>Endereço:</h4>
              <p style={{ fontSize: '14px' }}>Estrada União Indústria, 12273 - Itaipava, Petrópolis - RJ</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Em frente ao Armazém do Grão)</p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>Telefone / WhatsApp:</h4>
              <p style={{ fontSize: '14px' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)', marginRight: '6px' }}></i> Fixo: (24) 2222-1482 | <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', marginRight: '4px' }}></i> WhatsApp: (24) 98865-0462
              </p>
            </div>
          </div>
          <div style={{
            height: '350px',
            backgroundColor: '#15181c',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
          }}>
            {/* Simple Leaflet/Google Maps iframe representation placeholder since we don't have active API key, rendering a stylized map block */}
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundImage: 'linear-gradient(rgba(11, 12, 14, 0.75), rgba(11, 12, 14, 0.85)), url("/images/map_dark.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'var(--text-secondary)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Localização em Itaipava</h4>
              <p style={{ fontSize: '13px', maxWidth: '300px', marginBottom: '20px' }}>
                Clique abaixo para abrir as coordenadas direto no Google Maps.
              </p>
              <a 
                href="https://maps.google.com/?q=Antenor+e+Filhos+Itaipava" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary" 
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Como Chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LocalBusiness JSON-LD Schema Markup */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FoodEstablishment",
            "name": "Antenor e Filhos Boutique & Adega",
            "image": "https://antenorefilhos.com.br/img/logo.png",
            "url": "https://antenorefilhos.com.br",
            "telephone": "+552422221482",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Estrada União Indústria, 12273",
              "addressLocality": "Itaipava, Petrópolis",
              "addressRegion": "RJ",
              "postalCode": "25730-735",
              "addressCountry": "BR"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": -22.387114,
              "longitude": -43.136279
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "09:00",
                "closes": "21:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "09:00",
                "closes": "16:00"
              }
            ]
          })
        }}
      />
    </div>
  );
}
