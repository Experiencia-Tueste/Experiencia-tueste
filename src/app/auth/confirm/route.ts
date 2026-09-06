import type { EmailOtpType } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { loadSiteUrl } from '@/lib/config/env-server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminByEmail } from '@/lib/auth/authorization';
import { postSignInDestination } from '@/features/customer-auth/post-sign-in';

function publicRedirect(pathname: string, searchParams?: Record<string, string>) {
  const destination = new URL(pathname, loadSiteUrl());

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    destination.searchParams.set(key, value);
  });

  return NextResponse.redirect(destination);
}

async function redirectAuthenticatedUser(supabase: SupabaseClient, requestedPath: string | null) {
  const { data, error } = await supabase.auth.getUser();
  const admin = error ? null : await getAdminByEmail(data.user?.email);
  const destination = postSignInDestination(admin, requestedPath);
  return publicRedirect(destination.pathname, destination.searchParams);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const requestedPath = request.nextUrl.searchParams.get('next');

  // Flujo PKCE predeterminado de @supabase/ssr + ConfirmationURL.
  if (code) {
    try {
      const supabase = await createServerSupabase();
      if (supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return redirectAuthenticatedUser(supabase, requestedPath);
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
        if (!error) return redirectAuthenticatedUser(supabase, requestedPath);
      }
    } catch {
      // Mismo comportamiento seguro para tokens vencidos o malformados.
    }
  }

  return publicRedirect('/cuenta/iniciar-sesion', { confirmacion: 'fallida' });
}
