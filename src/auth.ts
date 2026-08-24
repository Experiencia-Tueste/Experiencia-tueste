import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { loadAdminConfig } from './lib/config/admin-auth-env';

/**
 * Auth.js (v5) para el panel administrativo — App Router.
 *
 * Google OAuth/OIDC se configura SOLO cuando AUTH_GOOGLE_ID y
 * AUTH_GOOGLE_SECRET existen ambas. Si no están configuradas o la
 * allowlist está vacía, el panel queda cerrado: `auth()` devuelve null,
 * los handlers responden 503 y no existe ningún proveedor ni acceso
 * demo.
 *
 * Allowlist: se valida en el callback `signIn` Y de nuevo al consultar
 * la sesión (callback `session`), de modo que un correo retirado de la
 * allowlist deja de tener sesión válida sin confiar solo en el login
 * inicial. Sin Credentials, sin usuarios demo, sin localStorage.
 */

const config = loadAdminConfig();

function buildAuth() {
  if (!config.googleConfigured || config.allowedEmails.length === 0) {
    return null;
  }

  return NextAuth({
    secret: config.authSecret,
    providers: [
      Google({
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      }),
    ],
    session: { strategy: 'jwt' },
    callbacks: {
      signIn({ user }) {
        const email = user.email?.trim().toLowerCase() ?? '';
        return config.allowedEmails.includes(email);
      },
      jwt({ token, user }) {
        if (user?.email) {
          token.email = user.email.trim().toLowerCase();
        }
        return token;
      },
      session({ session, token }) {
        const email = typeof token.email === 'string' ? token.email.trim().toLowerCase() : '';
        if (!config.allowedEmails.includes(email)) {
          // Rechazo server-side de una sesión cuyo correo ya no está
          // permitido: sin identidad admin válida.
          return { ...session, user: { ...session.user, name: null, email: null } };
        }
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
