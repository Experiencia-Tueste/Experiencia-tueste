import 'server-only';

import { randomUUID } from 'node:crypto';
import { getAdminEventRepository } from '@/db/admin-event-repository';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getAdminRadioRepository } from '@/db/admin-radio-repository';
import { getDb } from '@/db/client';
import type { DbClient } from '@/db/db-types';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import { parseAuditEntry } from '@/features/admin/audit';
import { isEventPast } from '@/features/events';
import { MERCADO_ITEMS } from '@/features/mercado';
import { RADIO_PLANS } from '@/features/radio';
import { saveCommunityConsentInTransaction } from '@/features/community/consent-service';
import {
  engagementInputSchema,
  marketApplicationStageSchema,
  radioActivationSchema,
  radioOpportunityStageSchema,
  engagementStatusSchema,
  isRadioOpportunityTransitionAllowed,
  type EngagementInput,
  type EngagementPayload,
} from './index';
import {
  createPendingEngagementToken,
  hashPendingEngagementToken,
  PENDING_ENGAGEMENT_TTL_SECONDS,
} from './pending-intent';

export class EngagementDomainError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
  ) {
    super(message);
    this.name = 'EngagementDomainError';
  }
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function compactPayload(payload: Record<string, unknown>): EngagementPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as EngagementPayload;
}

function versionedPayload(payload: Record<string, unknown>): EngagementPayload {
  return { schemaVersion: 1, ...compactPayload(payload) };
}

async function canonicalize(input: EngagementInput, tx: DbClient) {
  if (input.type === 'community') {
    return {
      reference: 'membership',
      details: `Preferencias: ${input.payload.preferences.join(', ')}`,
      payload: versionedPayload({
        preferences: input.payload.preferences,
        consent: input.payload.consent,
      }),
    };
  }

  if (input.type === 'event') {
    const repository = getAdminEventRepository();
    await repository.lockEvent(input.reference, tx);
    const event = await repository.findEvent(input.reference, tx);
    if (
      !event ||
      !['open', 'waitlist'].includes(event.status) ||
      isEventPast({ dateTime: event.endsAt ?? event.startsAt })
    ) {
      throw new EngagementDomainError('El evento ya no recibe solicitudes.', 409);
    }
    const occupied = await repository.countOccupied(event.id, tx);
    const availability =
      event.status === 'waitlist' || (event.capacity !== null && occupied >= event.capacity)
        ? 'waitlist'
        : 'available';
    return {
      reference: event.id,
      details: `${event.title} · ${event.city} · ${event.startsAt}`,
      payload: versionedPayload({
        eventId: event.id,
        eventTitle: event.title,
        attendeeCount: input.payload.attendeeCount,
        city: input.payload.city ?? event.city,
        comment: input.payload.comment ?? null,
        consent: input.payload.consent,
        availability,
      }),
    };
  }

  if (input.type === 'radio') {
    const plan = RADIO_PLANS.find((candidate) => candidate.id === input.reference);
    if (!plan) throw new EngagementDomainError('El plan de radio no existe.', 400);
    return {
      reference: plan.id,
      details: `${plan.nombre} · USD ${plan.priceUsd}/mes`,
      payload: versionedPayload({
        planId: plan.id,
        planName: plan.nombre,
        priceUsd: plan.priceUsd,
        ...compactPayload(input.payload),
      }),
    };
  }

  const marketPayload = input.payload;
  if (marketPayload.intent === 'availability') {
    const item = MERCADO_ITEMS.find(
      (candidate) => slugify(candidate.marca) === marketPayload.itemSlug,
    );
    if (!item) throw new EngagementDomainError('El producto no existe en el catálogo.', 404);
    const itemSlug = slugify(item.marca);
    return {
      reference: `availability:${itemSlug}`,
      details: `${item.marca} · ${item.tipo} · ${item.origen}`,
      payload: versionedPayload({
        intent: 'availability',
        itemSlug,
        brand: item.marca,
        category: item.tipo,
        origin: item.origen,
      }),
    };
  }

  if (input.reference !== 'seller-onboarding') {
    throw new EngagementDomainError('Referencia de vendedor inválida.', 400);
  }
  if (marketPayload.intent !== 'seller_application') {
    throw new EngagementDomainError('Intención de mercado inválida.', 400);
  }
  return {
    reference: 'seller-onboarding',
    details: `${marketPayload.brand} · ${marketPayload.category} · ${marketPayload.region}`,
    payload: versionedPayload(marketPayload),
  };
}

export async function createEngagementRequest(user: { id: string; email: string }, input: unknown) {
  const parsed = engagementInputSchema.parse(input);
  return getDb().transaction(async (tx) => {
    return createEngagementRequestInTransaction(user, parsed, tx);
  });
}

async function createEngagementRequestInTransaction(
  user: { id: string; email: string },
  parsed: EngagementInput,
  tx: DbClient,
) {
  const canonical = await canonicalize(parsed, tx);
  const requesterName = user.email.split('@')[0] || 'Cliente Tueste';
  const result = await getEngagementRepository().createOrGet(
    {
      type: parsed.type,
      requesterUserId: user.id,
      requesterEmail: user.email.trim().toLowerCase(),
      requesterName,
      reference: canonical.reference,
      details: canonical.details,
      payload: canonical.payload,
      radioStage: parsed.type === 'radio' ? 'new' : null,
      marketStage:
        parsed.type === 'market' && parsed.payload.intent === 'seller_application'
          ? 'submitted'
          : null,
    },
    tx,
  );
  if (parsed.type === 'community') {
    const refreshed = await getEngagementRepository().updateCommunityPayload(
      result.request.id,
      canonical.details,
      canonical.payload,
      tx,
    );
    await saveCommunityConsentInTransaction(
      { id: user.id, email: user.email, name: requesterName },
      parsed.payload,
      tx,
      result.request.id,
    );
    return { request: refreshed ?? result.request, created: result.created };
  }
  return result;
}

export async function createPendingEngagementIntent(input: EngagementInput) {
  const { token, tokenHash } = createPendingEngagementToken();
  const expiresAt = new Date(Date.now() + PENDING_ENGAGEMENT_TTL_SECONDS * 1000);
  await getDb().transaction((tx) =>
    getEngagementRepository().createPendingIntent({ tokenHash, payload: input, expiresAt }, tx),
  );
  return token;
}

/** Consume la intención y crea la solicitud dentro de la misma transacción. */
export async function resumePendingEngagement(user: { id: string; email: string }, token: string) {
  const tokenHash = hashPendingEngagementToken(token);
  return getDb().transaction(async (tx) => {
    const pending = await getEngagementRepository().consumePendingIntent(tokenHash, new Date(), tx);
    if (!pending) return null;
    const input = engagementInputSchema.parse(pending.payload);
    return createEngagementRequestInTransaction(user, input, tx);
  });
}

export async function changeRadioOpportunityStage(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('crm.manage')) throw new Error('403: se requiere crm.manage.');

  const parsed = radioOpportunityStageSchema.parse(input);
  if (parsed.from === parsed.to) throw new Error('400: etapa sin cambios.');
  if (!isRadioOpportunityTransitionAllowed(parsed.from, parsed.to)) {
    throw new Error(`400: transición de Radio no permitida (${parsed.from} → ${parsed.to}).`);
  }

  return getDb().transaction(async (tx) => {
    const request = await getEngagementRepository().setRadioStage(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!request) throw new Error('409: la oportunidad cambió de etapa o no existe.');
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.radio_stage_changed',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { from: parsed.from, to: parsed.to, type: request.type },
      }),
      tx,
    );
    return request;
  });
}

function payloadString(payload: EngagementPayload, key: string) {
  const value = payload[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new EngagementDomainError(`La solicitud de Radio no tiene ${key}.`, 409);
  }
  return value.trim();
}

export async function activateRadioOpportunity(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('crm.manage')) {
    throw new Error('403: se requiere crm.manage.');
  }
  if (!admin.capabilities.includes('radio.manage')) {
    throw new Error('403: se requiere radio.manage.');
  }

  const parsed = radioActivationSchema.parse(input);
  return getDb().transaction(async (tx) => {
    const engagementRepository = getEngagementRepository();
    const request = await engagementRepository.findByIdForUpdate(parsed.id, tx);
    if (!request || request.type !== 'radio') {
      throw new EngagementDomainError('La oportunidad de Radio no existe.', 404);
    }
    if (request.radioStage !== 'won') {
      throw new EngagementDomainError(
        'Solo una oportunidad ganada puede crear un canal de Radio Origen.',
        409,
      );
    }

    const radioRepository = getAdminRadioRepository();
    if (request.radioCompanyId && request.radioChannelId) {
      const [company, channel] = await Promise.all([
        radioRepository.findCompanyById(request.radioCompanyId, tx),
        radioRepository.findChannelById(request.radioChannelId, tx),
      ]);
      if (!company || !channel) {
        throw new EngagementDomainError('La activación vinculada ya no existe completa.', 409);
      }
      return { request, company, channel };
    }
    const companyPayload = {
      name: payloadString(request.payload, 'company'),
      contactName: payloadString(request.payload, 'responsible'),
      contactEmail: request.requesterEmail.trim().toLowerCase(),
      city: payloadString(request.payload, 'city'),
      actorId: admin.id,
    };
    const company = request.radioCompanyId
      ? await radioRepository.findCompanyById(request.radioCompanyId, tx).then((row) => {
          if (!row) throw new EngagementDomainError('La empresa vinculada ya no existe.', 409);
          return { row, created: false };
        })
      : await radioRepository.createOrGetCompany(companyPayload, tx);

    const plan = RADIO_PLANS.find((candidate) => candidate.id === request.reference);
    if (!plan) throw new EngagementDomainError('El plan de Radio no existe.', 409);
    const channel = request.radioChannelId
      ? await radioRepository.findChannelById(request.radioChannelId, tx).then((row) => {
          if (!row) throw new EngagementDomainError('El canal vinculado ya no existe.', 409);
          return { row, created: false };
        })
      : await radioRepository.createOrGetChannel(
          {
            companyId: company.row.id,
            name: `Radio Origen · ${plan.nombre}`,
            planId: plan.id,
            notes: `Solicitud ${request.id}. Servicio pendiente de confirmación operativa; sin cobro automático.`,
            actorId: admin.id,
          },
          tx,
        );

    const linked = await engagementRepository.linkRadioActivation(
      request.id,
      company.row.id,
      channel.row.id,
      tx,
    );
    if (!linked) throw new Error('409: la oportunidad cambió mientras se activaba.');

    const adminRepository = getAdminRepository();
    if (company.created) {
      await adminRepository.appendAudit(
        parseAuditEntry({
          id: randomUUID(),
          actorUserId: admin.id,
          actorEmail: admin.email,
          action: 'radio.company_created',
          targetType: 'radio_company',
          targetId: company.row.id,
          occurredAt: new Date().toISOString(),
          reason: parsed.reason,
          metadata: { sourceRequestId: request.id, city: company.row.city },
        }),
        tx,
      );
    }
    if (channel.created) {
      await adminRepository.appendAudit(
        parseAuditEntry({
          id: randomUUID(),
          actorUserId: admin.id,
          actorEmail: admin.email,
          action: 'radio.channel_created',
          targetType: 'radio_channel',
          targetId: channel.row.id,
          occurredAt: new Date().toISOString(),
          reason: parsed.reason,
          metadata: { sourceRequestId: request.id, companyId: company.row.id, planId: plan.id },
        }),
        tx,
      );
    }
    await adminRepository.appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.radio_activated',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: {
          radioCompanyId: company.row.id,
          radioChannelId: channel.row.id,
          planId: plan.id,
          subscriptionStatus: channel.row.subscriptionStatus,
        },
      }),
      tx,
    );

    return { request: linked, company: company.row, channel: channel.row };
  });
}

export async function changeMarketApplicationStage(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('crm.manage')) throw new Error('403: se requiere crm.manage.');

  const parsed = marketApplicationStageSchema.parse(input);
  if (parsed.from === parsed.to) throw new Error('400: etapa sin cambios.');

  return getDb().transaction(async (tx) => {
    const request = await getEngagementRepository().setMarketStage(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!request) throw new Error('409: la solicitud de vendedor cambió de etapa o no existe.');
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.market_stage_changed',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { from: parsed.from, to: parsed.to, type: request.type },
      }),
      tx,
    );
    return request;
  });
}

export async function getEngagementRequests() {
  return getEngagementRepository().list();
}

export async function changeEngagementStatus(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('crm.manage')) throw new Error('403: se requiere crm.manage.');

  const parsed = engagementStatusSchema.parse(input);
  if (parsed.from === parsed.to) throw new Error('400: estado sin cambios.');

  return getDb().transaction(async (tx) => {
    const request = await getEngagementRepository().setStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!request) throw new Error('409: la solicitud cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.status_changed',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { from: parsed.from, to: parsed.to, type: request.type },
      }),
      tx,
    );
    return request;
  });
}
