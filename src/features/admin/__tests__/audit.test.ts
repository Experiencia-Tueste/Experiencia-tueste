import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, isSafeReason, parseAuditEntry, validateAuditMetadata } from '../audit';
import type { ContentAuditAction } from '../audit';

/**
 * Pruebas del contrato de auditoría inmutable: razón obligatoria,
 * metadata estrictamente JSON-segura y rechazo de valores no
 * serializables. Sin IDs aleatorios ni fechas fabricadas.
 */

const VALID_ENTRY = {
  id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
  actorUserId: 'b4c9d7e3-0a5f-4b2c-9d8e-3f6a7b8c9d0e',
  action: 'user.invited' as const,
  targetType: 'user',
  targetId: 'c5d0e8f4-1b6a-4c3d-9e0f-4a7b8c9d0e1f',
  occurredAt: '2026-08-24T12:00:00.000Z',
  reason: 'Invitación inicial del equipo',
  metadata: { from: 'invited', to: 'active' },
};

describe('admin · auditoría (reason obligatoria)', () => {
  it('define las acciones administrativas iniciales', () => {
    expect(AUDIT_ACTIONS).toEqual([
      'user.invited',
      'user.activated',
      'user.suspended',
      'role.assigned',
      'role.revoked',
      'auth.sign_in',
      'auth.sign_out',
      'content.created',
      'content.updated',
      'content.reviewed',
      'content.published',
      'content.scheduled',
      'content.archived',
      'release.created',
      'release.reviewed',
      'release.published',
      'release.scheduled',
      'release.archived',
      'asset.created',
      'asset.approved',
      'asset.archived',
      'config.updated',
      'event.created',
      'event.status_changed',
      'event.attendee_registered',
      'event.checked_in',
      'farm.created',
      'farm.lot_created',
      'compliance.created',
      'compliance.status_changed',
      'community.member_created',
      'community.member_status_changed',
      'community.post_created',
      'community.post_status_changed',
      'community.report_created',
      'community.report_resolved',
    ]);
  });

  it('acepta una entrada de auditoría válida con reason', () => {
    const entry = parseAuditEntry(VALID_ENTRY);
    expect(entry.reason).toBe('Invitación inicial del equipo');
    expect(() => JSON.stringify(entry)).not.toThrow();
  });

  it('rechaza si falta reason', () => {
    const sinReason: Record<string, unknown> = { ...VALID_ENTRY };
    delete sinReason.reason;
    expect(() => parseAuditEntry(sinReason)).toThrow();
  });

  it('rechaza reason de solo espacios y reason demasiado corta', () => {
    expect(() => parseAuditEntry({ ...VALID_ENTRY, reason: '   ' })).toThrow();
    expect(() => parseAuditEntry({ ...VALID_ENTRY, reason: 'ab' })).toThrow();
  });

  it('rechaza reason que supera 300 caracteres', () => {
    expect(() => parseAuditEntry({ ...VALID_ENTRY, reason: 'x'.repeat(301) })).toThrow();
    // 300 exactos: válido.
    expect(parseAuditEntry({ ...VALID_ENTRY, reason: 'x'.repeat(300) }).reason.length).toBe(300);
  });

  it('rechaza razones que embeben secretos o tokens', () => {
    expect(isSafeReason('Asignación de rol para operación editorial')).toBe(true);
    expect(isSafeReason('El token=abc del cliente')).toBe(false);
    expect(isSafeReason('password=1234 guardada')).toBe(false);
    expect(() => parseAuditEntry({ ...VALID_ENTRY, reason: 'access_token=xyz' })).toThrow();
  });
});

describe('admin · auditoría (acciones de contenido derivadas)', () => {
  it('ContentAuditAction es un tipo derivado de AuditAction (compilación)', () => {
    // Extract garantiza la alineación en tiempo de compilación: cualquier
    // literal de contenido es asignable a AuditAction.
    const accion: ContentAuditAction = 'content.published';
    const comoAuditAction: (typeof AUDIT_ACTIONS)[number] = accion;
    expect(comoAuditAction).toBe('content.published');
    expect(AUDIT_ACTIONS).toContain(accion);
  });
});

describe('admin · auditoría (metadata JSON-segura)', () => {
  it('rechaza claves sensibles en la raíz y anidadas', () => {
    for (const key of [
      'password',
      'secret',
      'token',
      'authorization',
      'clientSecret',
      'accessToken',
      'refreshToken',
    ]) {
      expect(validateAuditMetadata({ [key]: 'valor' }), key).toBe(false);
      expect(validateAuditMetadata({ [key.toUpperCase()]: 'valor' }), key).toBe(false);
    }
    expect(validateAuditMetadata({ datos: { refreshToken: 'x' } })).toBe(false);
  });

  it('rechaza undefined, función, símbolo y bigint', () => {
    expect(validateAuditMetadata({ a: undefined })).toBe(false);
    expect(validateAuditMetadata({ fn: () => {} })).toBe(false);
    expect(validateAuditMetadata({ sym: Symbol('x') })).toBe(false);
    expect(validateAuditMetadata({ big: 10n })).toBe(false);
  });

  it('rechaza NaN, Infinity y -Infinity', () => {
    expect(validateAuditMetadata({ n: NaN })).toBe(false);
    expect(validateAuditMetadata({ n: Infinity })).toBe(false);
    expect(validateAuditMetadata({ n: -Infinity })).toBe(false);
  });

  it('rechaza Date, Map, Set, RegExp e instancias de clase', () => {
    expect(validateAuditMetadata({ d: new Date() })).toBe(false);
    expect(validateAuditMetadata({ m: new Map() })).toBe(false);
    expect(validateAuditMetadata({ s: new Set() })).toBe(false);
    expect(validateAuditMetadata({ r: /x/ })).toBe(false);
    expect(validateAuditMetadata({ c: new (class Foo {})() })).toBe(false);
  });

  it('acepta objetos planos y arrays JSON válidos (números finitos incluidos)', () => {
    expect(
      validateAuditMetadata({ from: 'invited', to: 'active', n: 42, ok: true, nada: null }),
    ).toBe(true);
    expect(validateAuditMetadata({ lista: ['a', 1, true, null, { k: 'v' }] })).toBe(true);
  });

  it('rechaza entrada completa con metadata no serializable', () => {
    expect(() => parseAuditEntry({ ...VALID_ENTRY, metadata: { d: new Date() } })).toThrow();
  });

  it('no fabrica ids ni fechas: los exige del contrato', () => {
    expect(() => parseAuditEntry({ ...VALID_ENTRY, id: '' })).toThrow();
    expect(() => parseAuditEntry({ ...VALID_ENTRY, occurredAt: 'hoy' })).toThrow();
  });
});

describe('admin · auditoría (ciclos y propiedades Symbol)', () => {
  it('rechaza un objeto circular directo sin stack overflow', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(validateAuditMetadata(cyclic)).toBe(false);
  });

  it('rechaza un ciclo anidado objeto → array → objeto', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.lista = [cyclic];
    expect(validateAuditMetadata(cyclic)).toBe(false);
  });

  it('acepta una referencia compartida no circular en dos ramas', () => {
    const shared = { value: 'ok' };
    expect(validateAuditMetadata({ left: shared, right: shared })).toBe(true);
  });

  it('rechaza propiedades Symbol propias en objetos', () => {
    const symbolKey = Symbol('private');
    expect(validateAuditMetadata({ [symbolKey]: 'valor' })).toBe(false);
  });

  it('rechaza propiedades Symbol propias en arrays', () => {
    const conSymbol: unknown[] = ['ok'];
    const symbolKey = Symbol('extra');
    (conSymbol as unknown as Record<symbol, unknown>)[symbolKey] = 'x';
    expect(validateAuditMetadata({ lista: conSymbol })).toBe(false);
  });

  it('parseAuditEntry rechaza metadata circular de forma controlada', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => parseAuditEntry({ ...VALID_ENTRY, metadata: cyclic })).toThrow();
  });
});
