import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { loadAdminConfig } from './lib/config/admin-auth-env';

/**
 * Auth.js (v5) se conserva temporalmente para cerrar y reconocer
 * sesiones administrativas heredadas. La puerta principal usa
 * Supabase Auth y comparte identidad entre clientes y administradores.
 *
 * Google OAuth/OIDC se configura SOLO cuando AUTH_GOOGLE_ID y
 * AUTH_GOOGLE_SECRET existen ambas. Si no están configuradas, el panel
 * queda cerrado: `auth()` devuelve null, los handlers responden 503 y
 * no existe ningún proveedor ni acceso demo.
 *
 * El acceso NO se decide aquí: la autorización la resuelve el RBAC persistente en
 * `src/lib/auth/authorization.ts` (usuario activo + roles en
 * PostgreSQL). Sin Credentials, sin usuarios demo, sin localStorage.
 */

const config = loadAdminConfig();

function buildAuth() {
  if (!config.googleConfigured) {
    return null;
  }

  return NextAuth({
    secret: config.authSecret,
    // Railway termina TLS en su proxy y reenvía la petición al contenedor
    // con el host interno 0.0.0.0:8080. Se habilita solo mediante una
    // variable explícita del entorno de despliegue, nunca por defecto.
    trustHost: config.trustHost,
    providers: [
      Google({
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      }),
    ],
    session: { strategy: 'jwt' },
    callbacks: {
      jwt({ token, user }) {
        if (user?.email) {
          token.email = user.email.trim().toLowerCase();
        }
        return token;
      },
      session({ session, token }) {
        const email = typeof token.email === 'string' ? token.email.trim().toLowerCase() : '';
        return { ...session, user: { ...session.user, email } };
      },
    },
  });
}

const instance = buildAuth();

/** Stub fail-closed cuando el panel no está configurado. */
const deniedResponse = () => new Response('Acceso interno en configuración', { status: 503 });

export const auth = instance?.auth ?? (async () => null);
export const handlers = instance?.handlers ?? {
  GET: deniedResponse,
  POST: deniedResponse,
};
export const signIn =
  instance?.signIn ??
  (() => {
    throw new Error('El acceso interno aún no está configurado.');
  });
export const signOut = instance?.signOut ?? (async () => {});
