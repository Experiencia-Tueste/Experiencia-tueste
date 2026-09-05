import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSupabaseSession } from '../proxy';

let claimsResult: {
  data: { claims: { sub?: string } | null };
  error: Error | null;
};

vi.mock('@/lib/config/env-public', () => ({
  loadPublicConfig: () => ({
    supabaseUrl: 'https://project.supabase.co',
    supabaseAnonKey: 'public-anon-key',
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims: vi.fn(async () => claimsResult),
    },
  })),
}));

describe('protección de funciones personales de Tueste Tree', () => {
  beforeEach(() => {
    claimsResult = { data: { claims: null }, error: new Error('Sesión ausente') };
  });

  it('redirige adopciones anónimas al acceso unificado con retorno', async () => {
    const response = await updateSupabaseSession(
      new NextRequest('https://tueste.co/tueste-tree/adoptar'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://tueste.co/cuenta/iniciar-sesion?next=%2Ftueste-tree%2Fadoptar',
    );
  });

  it('admite adopciones cuando la sesión compartida tiene un usuario válido', async () => {
    claimsResult = { data: { claims: { sub: 'tree-customer' } }, error: null };

    const response = await updateSupabaseSession(
      new NextRequest('https://tueste.co/tueste-tree/adoptar'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('mantiene público el dashboard de Tueste Tree sin sesión', async () => {
    const response = await updateSupabaseSession(new NextRequest('https://tueste.co/tueste-tree'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
