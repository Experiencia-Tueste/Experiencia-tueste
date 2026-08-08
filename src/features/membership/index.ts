/**
 * Feature: membership
 * ---------------------------------------------------------------------
 * Membresía Cántara: niveles, beneficios y estado del miembro.
 *
 * Regla del plan: el estado de membresía se deriva de la suscripción
 * real (pagos) en el servidor; aquí está el contrato de tipos y la
 * lógica de presentación (qué beneficios muestra cada nivel).
 */

export type MembershipTier = 'free' | 'canon' | 'resonancia';

export interface Membership {
  tier: MembershipTier;
  /** true solo si el servidor confirma una suscripción activa. */
  active: boolean;
  /** Fecha de vencimiento (ISO). */
  renewsAt?: string;
}

export interface MembershipPlan {
  id: MembershipTier;
  name: string;
  price: number;
  period: 'mes' | 'año';
  perks: string[];
  highlighted?: boolean;
}

/** Planes del mockup. */
export const PLANS: MembershipPlan[] = [
  {
    id: 'canon',
    name: 'Cántara',
    price: 35000,
    period: 'mes',
    perks: ['Envío gratis en la tienda', 'Acceso anticipado a lotes', 'Sesión de escucha mensual'],
  },
  {
    id: 'resonancia',
    name: 'Resonancia',
    price: 320000,
    period: 'año',
    perks: [
      'Todo lo de Cántara',
      'Vinilo de la colección al año',
      'Invitación a Casa Cántara',
      'Descuento 15% en subastas',
    ],
    highlighted: true,
  },
];

/** Beneficios visibles según el nivel (presentación pura). */
export function visiblePerks(tier: MembershipTier): string[] {
  if (tier === 'free') return ['Sigue a Tueste', 'Foro de comunidad', 'Tienda sin descuentos'];
  const plan = PLANS.find((p) => p.id === tier);
  return plan ? plan.perks : [];
}

/** El nivel de la membresía activa (o free). */
export function effectiveTier(m: Membership): MembershipTier {
  return m.active ? m.tier : 'free';
}
