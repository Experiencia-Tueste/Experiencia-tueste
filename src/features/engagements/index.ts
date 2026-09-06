import { z } from 'zod';

export const ENGAGEMENT_TYPES = ['community', 'event', 'radio', 'market'] as const;
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

export interface EngagementRequest {
  id: string;
  type: EngagementType;
  requesterUserId: string;
  requesterEmail: string;
  requesterName: string;
  reference: string;
  details: string | null;
  status: 'pending' | 'contacted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export const engagementInputSchema = z.object({
  type: z.enum(ENGAGEMENT_TYPES),
  reference: z.string().trim().min(1).max(160),
  details: z.string().trim().min(1).max(1000).optional(),
});

export const engagementStatusSchema = z.object({
  id: z.string().uuid(),
  from: z.enum(['pending', 'contacted', 'closed']),
  to: z.enum(['pending', 'contacted', 'closed']),
  reason: z.string().trim().min(3).max(300),
});

export function engagementMessage(type: EngagementType, created: boolean): string {
  const prefix = created ? 'Recibimos tu solicitud.' : 'Ya teníamos registrada tu solicitud.';
  const label: Record<EngagementType, string> = {
    community: 'Te avisaremos sobre comunidad y acceso anticipado.',
    event: 'El equipo revisará el cupo y te contactará antes de confirmar una reserva.',
    radio: 'El equipo de Radio Origen revisará tu plan y te contactará para definir la operación.',
    market: 'El equipo revisará tu solicitud comercial y te contactará con el siguiente paso.',
  };
  return `${prefix} ${label[type]}`;
}
