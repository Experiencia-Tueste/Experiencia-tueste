import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const accountPage = readFileSync(resolve(__dirname, '../../../app/cuenta/page.tsx'), 'utf8');
const proxy = readFileSync(resolve(__dirname, '../../../lib/supabase/proxy.ts'), 'utf8');

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
});
