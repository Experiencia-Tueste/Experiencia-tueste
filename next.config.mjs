import { securityHeaders } from './src/lib/security/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Los mockups de referencia son solo lectura; aquí se define la base técnica.
  // El audio embebido en base64 de los HTML no se migra: se servirá por URL
  // desde Supabase Storage / CDN cuando se active el contenido real.
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // Cabeceras de seguridad base (módulo puro en src/lib/security):
  // X-Content-Type-Options, Referrer-Policy, X-Frame-Options y
  // Permissions-Policy para todas las rutas. CSP y HSTS quedan
  // pendientes de dominio/activos de producción (ver README).
  async headers() {
    return securityHeaders();
  },
};

export default nextConfig;
