import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { loadPublicConfig } from '@/lib/config/env-public';

function treeLoginRedirect(request: NextRequest) {
  const destination = new URL('/cuenta/iniciar-sesion', request.url);
  destination.searchParams.set('next', '/tueste-tree/adoptar');
  return NextResponse.redirect(destination);
}

/** Renueva las cookies de Supabase antes de renderizar rutas públicas. */
export async function updateSupabaseSession(request: NextRequest) {
  const protectsTreeAdoption =
    request.nextUrl.pathname === '/tueste-tree/adoptar' ||
    request.nextUrl.pathname.startsWith('/tueste-tree/adoptar/');
  const config = loadPublicConfig();
  if (!config) {
    return protectsTreeAdoption ? treeLoginRedirect(request) : NextResponse.next({ request });
  }

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
  const { data, error } = await client.auth.getClaims();
  if (protectsTreeAdoption && (error || !data?.claims?.sub)) {
    const redirect = treeLoginRedirect(request);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
