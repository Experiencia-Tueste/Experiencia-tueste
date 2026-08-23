import { describe, expect, it } from 'vitest';
import * as portalData from '../data/portal';

/**
 * Datos estáticos del portal: textos editoriales exactos y sin
 * aleatoriedad.
 */
describe('portal data (contrato estático)', () => {
  it('los textos editoriales son exactos', () => {
    expect(portalData.PORTAL_KICKER).toBe('TUESTE · TRES CAMINOS, UN ORIGEN');
    expect(portalData.PORTAL_TITLE_1).toBe('El café también se escucha.');
    expect(portalData.PORTAL_SUBTITLE).toBe('Tres caminos nacidos del mismo origen.');
    expect(portalData.PORTAL_FOOTER_TAG).toBe('UN SOLO ORIGEN · TRES FORMAS DE VIVIRLO');
  });

  it('no queda referencia al mini-deck sintético (PORTAL_DECK_BARS)', () => {
    // El arte ahora es la ilustración local portal-experiencia-artwork-v1.webp.
    expect(portalData).not.toHaveProperty('PORTAL_DECK_BARS');
    expect(portalData).not.toHaveProperty('PortalDeckBar');
  });
});
