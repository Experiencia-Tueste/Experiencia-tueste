import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const accountPage = readFileSync(resolve(__dirname, '../../../app/cuenta/page.tsx'), 'utf8');
const proxy = readFileSync(resolve(__dirname, '../../../lib/supabase/proxy.ts'), 'utf8');
const confirmRoute = readFileSync(resolve(__dirname, '../../../app/auth/confirm/route.ts'), 'utf8');
const customerActions = readFileSync(resolve(__dirname, '../../../app/cuenta/actions.ts'), 'utf8');
const googleAuth = readFileSync(
  resolve(__dirname, '../../../app/cuenta/GoogleCustomerAuth.tsx'),
  'utf8',
);
const welcome = readFileSync(
  resolve(__dirname, '../../../features/customer-auth/components/CustomerWelcome.tsx'),
  'utf8',
);

describe('frontera de autenticación pública', () => {
  it('valida la cuenta y renueva sesión con getClaims, nunca con getSession', () => {
    expect(accountPage).toContain('auth.getClaims()');
    expect(proxy).toContain('auth.getClaims()');
    expect(accountPage).not.toContain('auth.getSession()');
    expect(proxy).not.toContain('auth.getSession()');
  });

  it('mantiene las rutas públicas fuera del namespace /admin', () => {
    expect(accountPage).not.toContain('/admin');
  });

  it('acepta confirmación PKCE y plantillas token_hash', () => {
    expect(confirmRoute).toContain('exchangeCodeForSession(code)');
    expect(confirmRoute).toContain('verifyOtp({ type, token_hash: tokenHash })');
  });

  it('devuelve al cliente a la experiencia con confirmación visible', () => {
    expect(confirmRoute).toContain("publicRedirect('/experiencia', { bienvenida: '1' })");
    expect(customerActions).toContain("redirect('/experiencia?bienvenida=1')");
    expect(welcome).toContain('Ya eres Cliente Tueste. Tu experiencia está lista.');
  });

  it('inicia Google OAuth con PKCE hacia el callback público', () => {
    expect(customerActions).toContain("provider: 'google'");
    expect(customerActions).toContain("new URL('/auth/confirm', loadSiteUrl())");
    expect(customerActions).toContain('redirect(data.url)');
    expect(googleAuth).toContain('Continuar con Google');
  });

  it('redirecciona al dominio público y nunca al host interno de Railway', () => {
    expect(confirmRoute).toContain('new URL(pathname, loadSiteUrl())');
    expect(confirmRoute).not.toContain('request.nextUrl.clone()');
    expect(confirmRoute).not.toContain('0.0.0.0');
  });

  it('convierte errores del proveedor en una respuesta segura y recuperable', () => {
    expect(confirmRoute).toContain('try {');
    expect(confirmRoute).toContain("publicRedirect('/cuenta/iniciar-sesion'");
  });
});
