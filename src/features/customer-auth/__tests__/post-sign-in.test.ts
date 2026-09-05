import { describe, expect, it } from 'vitest';

import type { CurrentAdmin } from '@/features/admin/authorization-core';
import { postSignInDestination, safePostSignInPath } from '../post-sign-in';

const ADMIN: CurrentAdmin = {
  id: '20ccda8d-1346-4af8-bade-5cc870bd31ce',
  email: 'admin@tueste.co',
  name: 'Admin Tueste',
  role: 'admin',
  capabilities: ['admin.access'],
};

describe('destino posterior al inicio de sesión', () => {
  it('envía al administrador autorizado al panel', () => {
    expect(postSignInDestination(ADMIN)).toEqual({ pathname: '/admin' });
  });

  it('envía al cliente normal a la experiencia con bienvenida', () => {
    expect(postSignInDestination(null)).toEqual({
      pathname: '/experiencia',
      searchParams: { bienvenida: '1' },
    });
  });

  it('retorna al cliente normal a Tueste Tree cuando inició allí', () => {
    expect(postSignInDestination(null, '/tueste-tree')).toEqual({ pathname: '/tueste-tree' });
    expect(postSignInDestination(null, '/tueste-tree/adoptar')).toEqual({
      pathname: '/tueste-tree/adoptar',
    });
  });

  it('mantiene la prioridad administrativa aunque exista next', () => {
    expect(postSignInDestination(ADMIN, '/tueste-tree/adoptar')).toEqual({ pathname: '/admin' });
  });

  it('solo admite retornos locales de Experiencia y Tueste Tree', () => {
    expect(safePostSignInPath('/experiencia#merch')).toBe('/experiencia#merch');
    expect(safePostSignInPath('/tueste-tree?drop=000')).toBe('/tueste-tree?drop=000');
    expect(safePostSignInPath('https://evil.example/tueste-tree')).toBeNull();
    expect(safePostSignInPath('//evil.example/tueste-tree')).toBeNull();
    expect(safePostSignInPath('/tueste-tree/../admin')).toBeNull();
    expect(safePostSignInPath('/cuenta/iniciar-sesion')).toBeNull();
  });
});
