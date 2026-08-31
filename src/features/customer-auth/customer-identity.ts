import type { User } from '@supabase/supabase-js';

export interface CustomerIdentity {
  email: string;
  initial: string;
  name: string;
}

function readableEmailName(email: string) {
  const localPart = email.split('@')[0] ?? '';
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-CO'))
    .trim();
}

function metadataName(user: User) {
  const candidates = [
    user.user_metadata.full_name,
    user.user_metadata.name,
    user.user_metadata.given_name,
  ];

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0,
  );
}

/**
 * Metadatos de OAuth usados únicamente para presentación. Nunca participan
 * en autorización, permisos, roles ni decisiones de acceso.
 */
export function customerIdentityFromUser(user: User | null): CustomerIdentity | null {
  if (!user) return null;

  const email = user.email ?? '';
  const name = metadataName(user)?.trim() || readableEmailName(email) || 'Cliente Tueste';
  const initial = Array.from(name)[0]?.toLocaleUpperCase('es-CO') ?? 'T';

  return { email, initial, name };
}
