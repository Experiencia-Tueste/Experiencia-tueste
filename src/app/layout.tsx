import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { loadSiteUrl } from '@/lib/config/env';
import './globals.css';

const BRAND_DESCRIPTION =
  'Tueste · Origen Tostado. Café, música y ritual nacidos en el Eje Cafetero colombiano.';

export const metadata: Metadata = {
  // URL canónica del contrato de configuración (SITE_URL o fallback
  // local de desarrollo/build). Requerida por Next para URLs absolutas
  // de Open Graph/Twitter sin falsificar dominios.
  metadataBase: new URL(loadSiteUrl()),
  title: 'Tueste · Origen Tostado',
  description: BRAND_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Tueste',
    title: 'Tueste · Origen Tostado',
    description: BRAND_DESCRIPTION,
    images: [
      {
        url: '/brand/original-logo-completo-fondo-blanco.png',
        alt: 'Logo de Tueste · Origen Tostado',
        width: 1092,
        height: 1092,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Tueste · Origen Tostado',
    description: BRAND_DESCRIPTION,
    images: ['/brand/original-logo-completo-fondo-blanco.png'],
  },
};

/**
 * Tipografías reales: Fraunces (serif), Hanken Grotesk (sans) y DM Mono
 * (mono), equivalentes a las del mockup. Se cargan vía Google Fonts con
 * preconnect; el build no descarga fuentes en compilación.
 */
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..700&family=Hanken+Grotesk:wght@300..800&family=DM+Mono:wght@300;400;500&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={FONT_HREF} rel="stylesheet" />
        {/* Marca de JS antes del primer paint: habilita la animación de
            entrada por scroll (Reveal) sin ocultar contenido sin JS. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
