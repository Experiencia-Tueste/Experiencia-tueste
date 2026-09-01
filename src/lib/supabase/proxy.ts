import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { loadPublicConfig } from '@/lib/config/env-public';

/** Renueva las cookies de Supabase antes de renderizar rutas públicas. */
export async function updateSupabaseSession(request: NextRequest) {
  const config = loadPublicConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims valida/renueva la sesión; no se autoriza con getSession.
  await client.auth.getClaims();
  return response;
}
