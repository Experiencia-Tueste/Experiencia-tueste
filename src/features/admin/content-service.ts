import 'server-only';

import { getCurrentAdmin } from '@/lib/auth/authorization';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getContentRepository } from '@/db/admin-content-repository';
import { getDb } from '@/db/client';
import { buildAuditEntry } from './content-audit';
import {
  ASSET_REGISTRATION_SCHEMA,
  ASSET_STATUS_TRANSITION_SCHEMA,
  CONTENT_DRAFT_SCHEMA,
  CONTENT_UPDATE_SCHEMA,
  RELEASE_SCHEMA,
  STATUS_TRANSITION_SCHEMA,
  canTransitionAsset,
  canTransitionContent,
} from './content-schemas';
import type { AdminCapability } from './permissions';
import type { CurrentAdmin } from './authorization-core';
import { getAdminStorageStatus } from './storage-service';

/**
 * Servicio de operaciones de contenido — server-only.
 * ---------------------------------------------------------------------
 * Toda mutación: comprueba sesión (401), capacidad en servidor (403),
 * valida con Zod y ejecuta la mutación Y su auditoría de forma
 * ATOMICA dentro de una transacción (si la auditoría falla, la
 * mutación se revierte). Las razones son siempre aportadas por quien
 * llama (nunca razones ocultas por defecto). El actor de auditoría es
 * el UUID persistido del admin (`admin.id`).
 */

/** 401: sin sesión; 403: sin capacidad. */
async function requireContentCapability(capability: AdminCapability) {
  const admin = await getCurrentAdmin();
  if (admin === null) {
    throw new Error('401: sesión requerida para operaciones de contenido.');
  }
  if (!admin.capabilities.includes(capability)) {
    throw new Error(`403: se requiere la capacidad ${capability}.`);
  }
  return admin;
}

/** Lista contenido. Recibe el admin ya autorizado por la capa de UI
 *  (evita una segunda consulta de identidad) y verifica la capacidad en
 *  servidor como autoridad final. */
export async function listContent(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('content.read')) {
    throw new Error('403: se requiere la capacidad content.read.');
  }
  return getContentRepository().listContent();
}

export async function getContentWorkspace(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('content.read')) {
    throw new Error('403: se requiere la capacidad content.read.');
  }
  const repository = getContentRepository();
  const [content, releases, assets] = await Promise.all([
    repository.listContent(),
    repository.listReleases(),
    repository.listAssets(),
  ]);

  return {
    content,
    releases,
    assets,
    storage: getAdminStorageStatus(),
  };
}

export async function createContentDraft(input: unknown, reason: string) {
  const admin = await requireContentCapability('content.edit');
  const parsed = CONTENT_DRAFT_SCHEMA.parse(input);

  return getDb().transaction(async (tx) => {
    const row = await getContentRepository().createContentDraft(
      { ...parsed, actorId: admin.id },
      tx,
    );
    const auditEntry = buildAuditEntry(admin, {
      action: 'content.created',
      targetType: 'content',
      targetId: row.id,
      reason,
      from: null,
      to: 'draft',
    });
    await getAdminRepository().appendAudit(auditEntry, tx);
    return row;
  });
}

export async function updateContent(id: string, input: unknown, reason: string) {
  const admin = await requireContentCapability('content.edit');
  const parsed = CONTENT_UPDATE_SCHEMA.parse(input);
  const auditEntry = buildAuditEntry(admin, {
    action: 'content.updated',
    targetType: 'content',
    targetId: id,
    reason,
  });

  return getDb().transaction(async (tx) => {
    const row = await getContentRepository().updateContent(id, parsed, admin.id, tx);
    if (row === null) throw new Error('404: contenido no encontrado.');
    await getAdminRepository().appendAudit({ ...auditEntry, targetId: id }, tx);
    return row;
  });
}

export async function transitionContentStatus(id: string, input: unknown) {
  const parsed = STATUS_TRANSITION_SCHEMA.parse(input);

  // Publicar exige content.publish; revisar/archivar exige content.edit.
  const capability: AdminCapability =
    parsed.to === 'published' ? 'content.publish' : 'content.edit';
  const admin = await requireContentCapability(capability);

  const current = await getContentRepository().getContentById(id);
  if (current === null) throw new Error('404: contenido no encontrado.');
  if (current.status !== parsed.from) {
    throw new Error(`409: el contenido está en «${current.status}», no en «${parsed.from}».`);
  }
  if (!canTransitionContent(parsed.from, parsed.to)) {
    throw new Error(`400: transición inválida de «${parsed.from}» a «${parsed.to}».`);
  }

  const action =
    parsed.to === 'published'
      ? 'content.published'
      : parsed.to === 'archived'
        ? 'content.archived'
        : parsed.to === 'review'
          ? 'content.reviewed'
          : 'content.updated';

  const auditEntry = buildAuditEntry(admin, {
    action,
    targetType: 'content',
    targetId: id,
    reason: parsed.reason,
    from: parsed.from,
    to: parsed.to,
  });

  return getDb().transaction(async (tx) => {
    const updated = await getContentRepository().setContentStatus(
      id,
      parsed.from,
      parsed.to,
      admin.id,
      tx,
    );
    if (updated === null) {
      throw new Error(`409: el estado «${parsed.from}» ya no es el actual.`);
    }
    await getAdminRepository().appendAudit(auditEntry, tx);
    return { ok: true as const };
  });
}

export async function transitionReleaseStatus(id: string, input: unknown) {
  const parsed = STATUS_TRANSITION_SCHEMA.parse(input);
  const capability: AdminCapability =
    parsed.to === 'published' ? 'content.publish' : 'content.edit';
  const admin = await requireContentCapability(capability);

  const current = await getContentRepository().getReleaseById(id);
  if (current === null) throw new Error('404: lanzamiento no encontrado.');
  if (current.status !== parsed.from) {
    throw new Error(`409: el lanzamiento está en «${current.status}», no en «${parsed.from}».`);
  }
  if (!canTransitionContent(parsed.from, parsed.to)) {
    throw new Error(`400: transición inválida de «${parsed.from}» a «${parsed.to}».`);
  }

  const action =
    parsed.to === 'published'
      ? 'release.published'
      : parsed.to === 'archived'
        ? 'release.archived'
        : 'release.reviewed';

  const auditEntry = buildAuditEntry(admin, {
    action,
    targetType: 'release',
    targetId: id,
    reason: parsed.reason,
    from: parsed.from,
    to: parsed.to,
  });

  return getDb().transaction(async (tx) => {
    const updated = await getContentRepository().setReleaseStatus(id, parsed.from, parsed.to, tx);
    if (updated === null) {
      throw new Error(`409: el estado «${parsed.from}» ya no es el actual.`);
    }
    await getAdminRepository().appendAudit(auditEntry, tx);
    return { ok: true as const };
  });
}

export async function createRelease(input: unknown, reason: string) {
  const admin = await requireContentCapability('content.edit');
  const parsed = RELEASE_SCHEMA.parse(input);

  return getDb().transaction(async (tx) => {
    const id = await getContentRepository().createRelease({ ...parsed, actorId: admin.id }, tx);
    const auditEntry = buildAuditEntry(admin, {
      action: 'release.created',
      targetType: 'release',
      targetId: id,
      reason,
      from: null,
      to: 'draft',
    });
    await getAdminRepository().appendAudit(auditEntry, tx);
    return id;
  });
}

export async function registerAsset(input: unknown, reason: string) {
  const admin = await requireContentCapability('content.edit');
  const parsed = ASSET_REGISTRATION_SCHEMA.parse(input);

  return getDb().transaction(async (tx) => {
    const row = await getContentRepository().registerAsset({ ...parsed, actorId: admin.id }, tx);
    const auditEntry = buildAuditEntry(admin, {
      action: 'asset.created',
      targetType: 'asset',
      targetId: row.id,
      reason,
      from: null,
      to: row.status,
      metadata: {
        filename: row.filename,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
      },
    });
    await getAdminRepository().appendAudit(auditEntry, tx);
    return row;
  });
}

export async function transitionAssetStatus(id: string, input: unknown) {
  const parsed = ASSET_STATUS_TRANSITION_SCHEMA.parse(input);
  const admin = await requireContentCapability('content.edit');

  const current = await getContentRepository().getAssetById(id);
  if (current === null) throw new Error('404: activo no encontrado.');
  if (current.status !== parsed.from) {
    throw new Error(`409: el activo está en «${current.status}», no en «${parsed.from}».`);
  }
  if (!canTransitionAsset(parsed.from, parsed.to)) {
    throw new Error(`400: transición inválida de «${parsed.from}» a «${parsed.to}».`);
  }

  const action = parsed.to === 'approved' ? 'asset.approved' : 'asset.archived';
  const auditEntry = buildAuditEntry(admin, {
    action,
    targetType: 'asset',
    targetId: id,
    reason: parsed.reason,
    from: parsed.from,
    to: parsed.to,
  });

  return getDb().transaction(async (tx) => {
    const updated = await getContentRepository().setAssetStatus(id, parsed.from, parsed.to, tx);
    if (updated === null) {
      throw new Error(`409: el estado «${parsed.from}» ya no es el actual.`);
    }
    await getAdminRepository().appendAudit(auditEntry, tx);
    return { ok: true as const };
  });
}
