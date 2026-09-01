import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { customerIdentityFromUser } from '../customer-identity';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'customer-id',
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-08-31T00:00:00.000Z',
    user_metadata: {},
    ...overrides,
  };
}

describe('customerIdentityFromUser', () => {
  it('usa el nombre entregado por Google para presentación', () => {
    expect(
      customerIdentityFromUser(
        user({ email: 'cliente@tueste.co', user_metadata: { full_name: 'Santiago Palacio' } }),
      ),
    ).toEqual({ email: 'cliente@tueste.co', initial: 'S', name: 'Santiago Palacio' });
  });

  it('convierte el correo en un nombre legible cuando faltan metadatos', () => {
    expect(customerIdentityFromUser(user({ email: 'cliente.tueste@correo.com' }))).toEqual({
      email: 'cliente.tueste@correo.com',
      initial: 'C',
      name: 'Cliente Tueste',
    });
  });

  it('devuelve null sin una sesión autenticada', () => {
    expect(customerIdentityFromUser(null)).toBeNull();
  });
});
