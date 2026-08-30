import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const next = request.nextUrl.clone();
  const supabase = await createServerSupabase();

  // Flujo PKCE predeterminado de @supabase/ssr + ConfirmationURL.
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      next.pathname = '/cuenta';
      next.search = '';
      return NextResponse.redirect(next);
    }
  }

  // Compatible con plantillas personalizadas SSR basadas en TokenHash.
  if (tokenHash && type && supabase) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      next.pathname = '/cuenta';
      next.search = '';
      return NextResponse.redirect(next);
    }
  }

  next.pathname = '/cuenta/iniciar-sesion';
  next.search = '?confirmacion=fallida';
  return NextResponse.redirect(next);
}
