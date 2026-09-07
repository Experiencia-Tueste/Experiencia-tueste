import { z } from 'zod';

export const ENGAGEMENT_TYPES = ['community', 'event', 'radio', 'market'] as const;
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

export const COMMUNITY_PREFERENCES = ['events', 'releases', 'coffee', 'tree', 'general'] as const;
export type CommunityPreference = (typeof COMMUNITY_PREFERENCES)[number];

export const RADIO_PLAN_IDS = ['senal', 'disenada', 'personalizada'] as const;
export type RadioPlanId = (typeof RADIO_PLAN_IDS)[number];

export const RADIO_OPPORTUNITY_STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'] as const;
export type RadioOpportunityStage = (typeof RADIO_OPPORTUNITY_STAGES)[number];

export const MARKET_APPLICATION_STAGES = ['submitted', 'review', 'approved', 'rejected'] as const;
export type MarketApplicationStage = (typeof MARKET_APPLICATION_STAGES)[number];

export interface EngagementPayload {
  [key: string]: boolean | number | string | string[] | null;
}

export interface EngagementRequest {
  id: string;
  type: EngagementType;
  requesterUserId: string;
  requesterEmail: string;
  requesterName: string;
  reference: string;
  details: string | null;
  payload: EngagementPayload;
  status: 'pending' | 'contacted' | 'closed';
  radioStage: RadioOpportunityStage | null;
  radioCompanyId: string | null;
  radioChannelId: string | null;
  marketStage: MarketApplicationStage | null;
  createdAt: string;
  updatedAt: string;
}

const optionalComment = z.string().trim().max(500).optional();

const communityInputSchema = z.object({
  type: z.literal('community'),
  reference: z.literal('membership'),
  payload: z
    .object({
      preferences: z.array(z.enum(COMMUNITY_PREFERENCES)).min(1).max(5).default(['general']),
      consent: z.literal(true),
    })
    .default({ preferences: ['general'], consent: true }),
});

const eventInputSchema = z.object({
  type: z.literal('event'),
  reference: z.string().uuid(),
  payload: z.object({
    attendeeCount: z.number().int().min(1).max(20).default(1),
    city: z.string().trim().max(120).optional(),
    comment: optionalComment,
    consent: z.literal(true),
  }),
});

const radioInputSchema = z.object({
  type: z.literal('radio'),
  reference: z.enum(RADIO_PLAN_IDS),
  payload: z.object({
    company: z.string().trim().min(1).max(160),
    responsible: z.string().trim().min(1).max(160),
    phone: z.string().trim().max(40).optional(),
    city: z.string().trim().min(1).max(120),
    businessType: z.string().trim().min(1).max(100),
    locations: z.number().int().min(1).max(1000),
    hours: z.string().trim().min(1).max(120),
    comment: optionalComment,
    consent: z.literal(true),
  }),
});

const marketInputSchema = z.object({
  type: z.literal('market'),
  reference: z.string().trim().min(1).max(160),
  payload: z.discriminatedUnion('intent', [
    z.object({
      intent: z.literal('availability'),
      itemSlug: z.string().trim().min(1).max(120),
    }),
    z.object({
      intent: z.literal('seller_application'),
      brand: z.string().trim().min(1).max(120),
      responsible: z.string().trim().min(1).max(160),
      region: z.string().trim().min(1).max(120),
      category: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500).optional(),
      priceCop: z.number().int().positive().max(100000000).optional(),
      salesChannels: z.string().trim().max(200).optional(),
      phone: z.string().trim().max(40).optional(),
      consent: z.literal(true),
    }),
  ]),
});

export const engagementInputSchema = z.discriminatedUnion('type', [
  communityInputSchema,
  eventInputSchema,
  radioInputSchema,
  marketInputSchema,
]);

export type EngagementInput = z.infer<typeof engagementInputSchema>;

export const engagementStatusSchema = z.object({
  id: z.string().uuid(),
  from: z.enum(['pending', 'contacted', 'closed']),
  to: z.enum(['pending', 'contacted', 'closed']),
  reason: z.string().trim().min(3).max(300),
});

export const radioOpportunityStageSchema = z.object({
  id: z.string().uuid(),
  from: z.enum(RADIO_OPPORTUNITY_STAGES),
  to: z.enum(RADIO_OPPORTUNITY_STAGES),
  reason: z.string().trim().min(3).max(300),
});

export const radioActivationSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
});

const RADIO_OPPORTUNITY_TRANSITIONS: Record<
  RadioOpportunityStage,
  readonly RadioOpportunityStage[]
> = {
  new: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['won', 'lost'],
  won: [],
  lost: [],
};

export function isRadioOpportunityTransitionAllowed(
  from: RadioOpportunityStage,
  to: RadioOpportunityStage,
) {
  return RADIO_OPPORTUNITY_TRANSITIONS[from].includes(to);
}

export const marketApplicationStageSchema = z.object({
  id: z.string().uuid(),
  from: z.enum(MARKET_APPLICATION_STAGES),
  to: z.enum(MARKET_APPLICATION_STAGES),
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
