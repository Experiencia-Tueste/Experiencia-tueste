import { redirect } from 'next/navigation';

// El estado de configuración de Google se resuelve en runtime del
// servidor: nunca congelar esta ruta con el estado visto durante el
// build (los secretos se inyectan en runtime).
export const dynamic = 'force-dynamic';

/**
 * Compatibilidad para enlaces antiguos. Todo acceso nuevo pasa por la
 * misma puerta pública; allí Supabase identifica y PostgreSQL decide si
 * el destino es la experiencia o el panel administrativo.
 */
export default function AdminLoginPage() {
  redirect('/cuenta/iniciar-sesion');
}
