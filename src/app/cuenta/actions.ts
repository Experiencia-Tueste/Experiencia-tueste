'use server';

import { redirect } from 'next/navigation';
import { loadSiteUrl } from '@/lib/config/env-server';
import { createServerSupabase } from '@/lib/supabase/server';
import { customerCredentialsSchema } from '@/features/customer-auth/schemas';
import { getAdminByEmail } from '@/lib/auth/authorization';
import { postSignInDestination, safePostSignInPath } from '@/features/customer-auth/post-sign-in';

export interface CustomerAuthState {
  status: 'idle' | 'error' | 'success';
  message: string;
}

function authPage(
  pathname: '/cuenta/registro' | '/cuenta/iniciar-sesion',
  params: Record<string, string>,
) {
  const search = new URLSearchParams(params);
  return `${pathname}?${search.toString()}`;
}

function destinationHref(pathname: string, searchParams?: Record<string, string>) {
  const search = new URLSearchParams(searchParams);
  return search.size > 0 ? `${pathname}?${search.toString()}` : pathname;
}

export async function loginWithGoogleAction(formData: FormData) {
  const nextPath = safePostSignInPath(formData.get('next'));
  const fallbackPath = authPage(
    formData.get('fallback') === 'registro' ? '/cuenta/registro' : '/cuenta/iniciar-sesion',
    { oauth: 'fallido', ...(nextPath ? { next: nextPath } : {}) },
  );
  const supabase = await createServerSupabase();
  if (!supabase) {
    redirect(fallbackPath);
  }

  const redirectTarget = new URL('/auth/confirm', loadSiteUrl());
  if (nextPath) redirectTarget.searchParams.set('next', nextPath);
  const redirectTo = redirectTarget.toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error || !data.url) {
    redirect(fallbackPath);
  }

  redirect(data.url);
}

function credentialsFrom(formData: FormData) {
  return customerCredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
}

export async function loginCustomerAction(
  _previousState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = credentialsFrom(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { status: 'error', message: 'El acceso de clientes aún no está disponible.' };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Mensaje deliberadamente genérico para no revelar qué correos existen.
    return { status: 'error', message: 'Correo o contraseña inválidos.' };
  }

  const { data: verified } = await supabase.auth.getUser();
  const admin = await getAdminByEmail(verified.user?.email);
  const destination = postSignInDestination(admin, formData.get('next'));
  redirect(destinationHref(destination.pathname, destination.searchParams));
}

export async function registerCustomerAction(
  _previousState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = credentialsFrom(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { status: 'error', message: 'El registro de clientes aún no está disponible.' };
  }

  const nextPath = safePostSignInPath(formData.get('next'));
  const emailRedirectTarget = new URL('/auth/confirm', loadSiteUrl());
  if (nextPath) emailRedirectTarget.searchParams.set('next', nextPath);
  const emailRedirectTo = emailRedirectTarget.toString();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo },
  });

  if (error) {
    return {
      status: 'error',
      message: 'No pudimos completar el registro. Inténtalo de nuevo en unos minutos.',
    };
  }

  // Mismo resultado visible para cuentas nuevas o ya existentes.
  return {
    status: 'success',
    message: 'Revisa tu correo para confirmar la cuenta y continuar.',
  };
}

export async function logoutCustomerAction() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect('/');
}
