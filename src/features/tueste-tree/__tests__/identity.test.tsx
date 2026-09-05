import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import TuesteTreeIdentity from '../components/TuesteTreeIdentity';

let currentUser: User | null = null;
const unsubscribe = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: currentUser } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
    },
  },
}));

describe('identidad compartida de Tueste Tree', () => {
  beforeEach(() => {
    currentUser = null;
    unsubscribe.mockClear();
  });

  it('envía al acceso unificado y conserva el retorno a Tree', async () => {
    render(<TuesteTreeIdentity returnTo="/tueste-tree/adoptar" />);

    expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/cuenta/iniciar-sesion?next=%2Ftueste-tree%2Fadoptar',
    );
  });

  it('muestra inmediatamente la identidad de la sesión Supabase activa', async () => {
    currentUser = {
      id: 'tree-customer',
      aud: 'authenticated',
      created_at: '2026-09-05T00:00:00.000Z',
      app_metadata: {},
      user_metadata: { full_name: 'Santiago Tree' },
      email: 'tree@tueste.co',
    };

    render(<TuesteTreeIdentity returnTo="/tueste-tree" />);

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: 'Santiago Tree, Cliente Tueste. Ir a Mi cuenta' }),
      ).toHaveAttribute('href', '/cuenta');
    });
    expect(screen.getByText('tree@tueste.co')).toBeInTheDocument();
  });
});
