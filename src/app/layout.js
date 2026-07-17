import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellerReferralTracker from "@/components/SellerReferralTracker";
import Script from "next/script";
import Link from "next/link";
import { getFingerprint, trackEvent } from "@/lib/telemetry";
import TelemetryProvider from "@/components/TelemetryProvider";
import AdminThemeManager from "@/components/AdminThemeManager";

const inter = Inter({
  // Force rebuild comment for style updates
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata = {
  title: "Antenor & Filhos | Boutique de Carnes & Adega",
  description: "Descubra o mais alto padrão em carnes nobres (Angus, Wagyu, Exóticas) e vinhos premiados em Itaipava. Monte seu pedido online e garanta momentos inesquecíveis!",
  keywords: "boutique de carnes, itaipava, carnes exóticas, adega de vinhos, petropolis, delicatessen, vpj angus, cordeiro, salmao, churrasco",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Antenor & Filhos"
  },
  openGraph: {
    title: "Antenor & Filhos | Boutique de Carnes & Adega",
    description: "Descubra o mais alto padrão em carnes nobres (Angus, Wagyu, Exóticas) e vinhos premiados em Itaipava. Monte seu pedido online e garanta momentos inesquecíveis!",
    url: "https://antenorefilhos.com.br",
    siteName: "Antenor & Filhos",
    locale: "pt_BR",
    type: "website",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ab9070"
};
export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-4H9W5QPE0L";

  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Theme preservation script to avoid styling flash */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.location.pathname.startsWith('/admin')) {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.classList.add('light-theme');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.classList.remove('light-theme');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
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
        <AdminThemeManager />

        {/* Track seller links (?ref=vendedor_slug) and save details */}
        <SellerReferralTracker />
        
        {/* Navigation Header */}
        <Header />
        
        {/* Main Content Area */}
        <main style={{ flexGrow: 1 }}>
          {children}
        </main>
        
        {/* Premium Dynamic Footer */}
        <Footer />
      </body>
    </html>
  );
}
