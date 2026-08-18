import { securityHeaders } from './src/lib/security/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Salida standalone: el build genera `.next/standalone` con el
  // servidor autocontenido para el contenedor de producción (ECS
  // Fargate). Compatible con SSR, autenticación y Route Handlers
  // futuros; NO es `output: 'export'` (que sí los impediría).
  output: 'standalone',
  // Los mockups de referencia son solo lectura; aquí se define la base técnica.
  // El audio embebido en base64 de los HTML no se migra: se servirá por URL
  // desde Supabase Storage / CDN cuando se active el contenido real.
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // Cabeceras de seguridad (módulo puro en src/lib/security): base +
  // CSP Report-Only. HSTS queda pendiente del dominio HTTPS de AWS
  // (ver README).
  async headers() {
    return securityHeaders();
  },
};

export default nextConfig;
