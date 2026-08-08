import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tueste · Origen Tostado',
  description: 'Base técnica de la aplicación Tueste. Origen tostado, sonido y café.',
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
      </head>
      <body>{children}</body>
    </html>
  );
}
