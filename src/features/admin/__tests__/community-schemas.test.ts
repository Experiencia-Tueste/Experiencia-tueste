import { describe, expect, it } from 'vitest';
import {
  COMMUNITY_MEMBER_SCHEMA,
  COMMUNITY_POST_SCHEMA,
  COMMUNITY_REPORT_SCHEMA,
  COMMUNITY_REPORT_STATUS_SCHEMA,
  isCommunityStatusChange,
} from '../community-schemas';

describe('admin · comunidad', () => {
  it('normaliza el correo del miembro', () => {
    const parsed = COMMUNITY_MEMBER_SCHEMA.parse({
      displayName: 'Ana',
      email: ' ANA@EXAMPLE.COM ',
      reason: 'Alta inicial',
    });
    expect(parsed.email).toBe('ana@example.com');
  });

  it('acepta publicaciones con o sin miembro persistido', () => {
    expect(
      COMMUNITY_POST_SCHEMA.parse({
        memberId: '',
        authorName: 'Invitado',
        title: 'Café y territorio',
        body: 'Una conversación abierta.',
        reason: 'Carga editorial',
      }).memberId,
    ).toBeUndefined();
  });

  it('limita las categorías de reporte', () => {
    expect(() =>
      COMMUNITY_REPORT_SCHEMA.parse({
        postId: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        reporterName: 'Laura',
        category: 'otro-inventado',
        reason: 'Reporte manual',
      }),
    ).toThrow();
  });

  it('exige resolución y no permite reabrir desde el formulario', () => {
    expect(() =>
      COMMUNITY_REPORT_STATUS_SCHEMA.parse({
        id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        from: 'resolved',
        to: 'open',
        resolution: '',
        reason: 'Cambio',
      }),
    ).toThrow();
  });

  it('rechaza transiciones sin cambio', () => {
    expect(isCommunityStatusChange('active', 'active')).toBe(false);
    expect(isCommunityStatusChange('active', 'restricted')).toBe(true);
  });
});
