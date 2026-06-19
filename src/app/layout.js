import "./globals.css";
import Header from "@/components/Header";
import SellerReferralTracker from "@/components/SellerReferralTracker";
import Script from "next/script";
import Link from "next/link";

export const metadata = {
  title: "Antenor e Filhos | Boutique de Carnes Nobres e Delicatessen em Itaipava",
  description: "Boutique de Carnes Nobres, Exóticas, Adega de Vinhos Finos e Delicatessen em Itaipava, Petrópolis. Faça seu pedido de orçamento online e receba no WhatsApp.",
  keywords: "boutique de carnes, itaipava, carnes exóticas, adega de vinhos, petropolis, delicatessen, vpj angus, cordeiro, salmao, churrasco",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Antenor e Filhos"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ab9070"
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-4H9W5QPE0L";

  return (
    <html lang="pt-BR">
      <head>
        {/* Google Site-Kit / Analytics tag (gtag.js) */}
        <Script 
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>

        {/* Font Awesome Icons */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('PWA ServiceWorker registered on scope:', reg.scope);
                }).catch(function(err) {
                  console.warn('PWA ServiceWorker registration failed:', err);
                });
              });
            }
          `}
        </Script>
      </head>
      <body>
        {/* Track seller links (?ref=vendedor_slug) and save details */}
        <SellerReferralTracker />
        
        {/* Navigation Header */}
        <Header />
        
        {/* Main Content Area */}
        <main style={{ flexGrow: 1, paddingTop: '80px' }}>
          {children}
        </main>
        
        {/* Premium Luxury Footer */}
        <footer style={{
          backgroundColor: '#07080a',
          borderTop: '1px solid var(--border-color)',
          padding: '60px 0 30px 0',
          color: 'var(--text-secondary)'
        }}>
          <div className="container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontFamily: 'var(--font-serif)', fontSize: '20px' }}>
                Antenor & Filhos
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7' }}>
                Desde sua fundação, trazendo cortes premium de gados selecionados, carnes exóticas e uma adega exclusiva de vinhos finos em Itaipava, Petrópolis.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Funcionamento
              </h4>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                <b>Boutique:</b> Terça a Sábado: 9h às 21h | Domingo: 9h às 16h
              </p>
              <p style={{ fontSize: '13px' }}>
                <b>Restaurante:</b> Quinta a Sábado: 12h às 23h | Domingo: 12h às 17h
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contato
              </h4>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> Estrada União Indústria, 12273 - Itaipava, Petrópolis - RJ
              </p>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                <b>Loja/Boutique:</b> (24) 2222-1482 | (24) 98865-0462
              </p>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                <b>Restaurante:</b> (24) 2222-1482
              </p>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                <b>Distribuidora:</b> (24) 2223-1945 | (24) 98816-5164
              </p>
              <p style={{ fontSize: '13px' }}>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> loja@antenorefilhos.com.br
              </p>
            </div>
          </div>
          <div className="container" style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <p>&copy; {new Date().getFullYear()} Antenor e Filhos. Todos os direitos reservados.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/politica-de-privacidade-antenor-e-filhos" style={{ hover: { color: 'var(--primary)' } }}>Termos de Uso</Link>
              <Link href="/politica-de-privacidade-antenor-e-filhos" style={{ hover: { color: 'var(--primary)' } }}>Privacidade</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
