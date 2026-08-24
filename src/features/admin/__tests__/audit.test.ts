import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, isSafeReason, parseAuditEntry, validateAuditMetadata } from '../audit';

/**
 * Pruebas del contrato de auditoría inmutable: razón obligatoria,
 * metadata estrictamente JSON-segura y rechazo de valores no
 * serializables. Sin IDs aleatorios ni fechas fabricadas.
 */

const VALID_ENTRY = {
  id: 'audit_1',
  actorUserId: 'usr_1',
  action: 'user.invited' as const,
  targetType: 'user',
  targetId: 'usr_2',
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
