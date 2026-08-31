import { describe, expect, it } from 'vitest';

import type { CurrentAdmin } from '@/features/admin/authorization-core';
import { postSignInDestination } from '../post-sign-in';

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
});
