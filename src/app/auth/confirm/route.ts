import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { loadSiteUrl } from '@/lib/config/env-server';
import { createServerSupabase } from '@/lib/supabase/server';

function publicRedirect(pathname: string, searchParams?: Record<string, string>) {
  const destination = new URL(pathname, loadSiteUrl());

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    destination.searchParams.set(key, value);
  });

  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;

  // Flujo PKCE predeterminado de @supabase/ssr + ConfirmationURL.
  if (code) {
    try {
      const supabase = await createServerSupabase();
      if (supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return publicRedirect('/experiencia', { bienvenida: '1' });
      }
    } catch {
      // Un código inválido o una indisponibilidad temporal nunca debe
      // tumbar el callback ni exponer detalles del proveedor al cliente.
    }
  }

  // Compatible con plantillas personalizadas SSR basadas en TokenHash.
  if (tokenHash && type) {
    try {
      const supabase = await createServerSupabase();
      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) return publicRedirect('/experiencia', { bienvenida: '1' });
      }
    } catch {
      // Mismo comportamiento seguro para tokens vencidos o malformados.
    }
  }

  return publicRedirect('/cuenta/iniciar-sesion', { confirmacion: 'fallida' });
}
