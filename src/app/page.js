import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: "Antenor e Filhos | Boutique de Carnes Nobres, Adega e Restaurante em Itaipava",
  description: "Boutique de Carnes Nobres (Angus, Wagyu, exóticas), adega climatizada de vinhos selecionados e restaurante premium na Serra Fluminense. Faça seu orçamento online.",
  alternates: {
    canonical: "https://antenorefilhos.com.br"
  }
};

export default function Home() {
  const jsonLd = {
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
  };

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            O CORAÇÃO DA SERRA FLUMINENSE
          </span>
          <h1 className={styles.heroTitle}>
            A Arte da Alta Gastronomia em Itaipava
          </h1>
          <p className={styles.heroBody}>
            Cortes nobres com padrão de excelência internacional e uma adega exclusiva de vinhos premiados. Criamos valor superior e experiências sensoriais memoráveis para os paladares mais exigentes.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/boutique" className="btn btn-primary">
              Carnes
            </Link>
            <Link href="/adega" className="btn btn-primary">
              Adega
            </Link>
          </div>
        </div>
      </section>

      <section id="operation" className="section relative" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Nossas Frentes de Excelência</h2>
            <div className={styles.sectionDivider} />
            <p>
              Três experiências distintas, guiadas por um único princípio: qualidade inegociável. Descubra nossas especialidades em Itaipava.
            </p>
          </div>

          <div className={styles.operationGrid}>
            <div className={`glass ${styles.operationCard}`}>
              <h3 className={styles.operationCardTitle}>Boutique de Carnes</h3>
              <p className={styles.operationCardBody}>
                A seleção definitiva para os paladares mais exigentes. Cortes premium britânicos, marmorização impecável do Wagyu e exóticas exclusivas.
              </p>
              <Link href="/boutique" className={styles.operationCardLink}>
                Fazer Pedido de Carnes &rarr;
              </Link>
            </div>

            <div className={`glass ${styles.operationCard}`}>
              <h3 className={styles.operationCardTitle}>Adega &amp; Delicatessen</h3>
              <p className={styles.operationCardBody}>
                O casamento perfeito para a sua carne. Rótulos garimpados das melhores safras mundiais, harmonizando perfeitamente com nossos queijos e antepastos finos.
              </p>
              <Link href="/adega" className={styles.operationCardLink}>
                Fazer Pedido de Vinhos &rarr;
              </Link>
            </div>

            <div className={`glass ${styles.operationCard}`}>
              <h3 className={styles.operationCardTitle}>Restaurante &amp; Brasa</h3>
              <p className={styles.operationCardBody}>
                O domínio do fogo. Permita que nossos mestres churrasqueiros transformem nossos cortes exclusivos em obras-primas grelhadas, servidas com excelência.
              </p>
              <a
                href="https://wa.me/552422221482?text=Gostaria%20de%20reservar%20uma%20mesa%20no%20Restaurante"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.operationCardLink}
              >
                <i className="fa-brands fa-whatsapp text-success"></i>
                {' '}Reservar uma Mesa &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={`section ${styles.locationSection}`}>
        <div className={`container ${styles.locationGrid}`}>
          <div>
            <h2 className={styles.locationTitle}>
              Visite nossa Loja Física
            </h2>
            <p className={styles.locationBody}>
              Estamos localizados no coração de Itaipava, em Petrópolis. Venha conhecer nossa boutique de carnes, escolher seus vinhos direto na adega e desfrutar do nosso espaço gourmet de restaurante.
            </p>
            <div className={styles.locationInfoGroup}>
              <h4 className={styles.locationInfoLabel}>Endereço</h4>
              <p className={styles.locationInfoText}>Estrada União Indústria, 12273 - Itaipava, Petrópolis - RJ</p>
              <p className={styles.locationInfoMuted}>(Em frente ao Armazém do Grão)</p>
            </div>
            <div className={styles.locationInfoGroup}>
              <h4 className={styles.locationInfoLabel}>Telefone / WhatsApp</h4>
              <p className={styles.locationInfoText}>
                <i className="fa-solid fa-phone text-primary mr-1.5"></i>
                Fixo: (24) 2222-1482
                {' | '}
                <i className="fa-brands fa-whatsapp text-success mx-1"></i>
                WhatsApp: (24) 98865-0462
              </p>
            </div>
          </div>

          <div className={`glass ${styles.mapCard}`}>
            <div className={styles.mapInner}>
              <h4 className={styles.mapTitle}>Localização em Itaipava</h4>
              <p className={styles.mapBody}>
                Clique abaixo para abrir as coordenadas direto no Google Maps.
              </p>
              <a
                href="https://maps.google.com/?q=Antenor+e+Filhos+Itaipava"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Como Chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
