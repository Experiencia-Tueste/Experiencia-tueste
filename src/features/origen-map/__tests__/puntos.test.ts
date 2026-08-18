import { describe, expect, it } from 'vitest';
import { PUNTOS_MAPA, getPuntoMapa } from '../data/puntos';

/**
 * Contrato de datos del mapa de origen: los puntos son provisionales,
 * nunca «exactos», y el punto de guardianes es una demostración.
 */
describe('origen-map data (puntos provisionales)', () => {
  it('existen exactamente dos puntos', () => {
    expect(PUNTOS_MAPA).toHaveLength(2);
  });

  it('ningún punto se afirma como exacto, confirmado o ubicación real', () => {
    for (const punto of PUNTOS_MAPA) {
      expect(['aproximada', 'ilustrativa']).toContain(punto.precision);
      // Afirmaciones prohibidas (p. ej. «es la ubicación exacta»).
      expect(punto.descripcion).not.toMatch(
        /es .*exact|ubicación real|ubicación confirmad|exactamente ahí/i,
      );
      expect(punto.nombre).not.toMatch(/exacta|confirmad/i);
      // La negación sí es obligatoria: cada punto aclara que NO es
      // una localización exacta.
      expect(punto.descripcion.toLowerCase()).toContain('no representa');
    }
  });

  it('el segundo punto es una demostración editorial próxima', () => {
    const guardianes = getPuntoMapa('guardianes-origen');
    expect(guardianes).toBeDefined();
    expect(guardianes!.estado).toBe('proximamente');
    expect(guardianes!.precision).toBe('ilustrativa');
    expect(guardianes!.descripcion).toBe(
      'Punto editorial de demostración. No representa una ubicación física de los guardianes.',
    );
  });

  it('la finca usa la referencia aproximada de la página (4°32′ N · 75°40′ O)', () => {
    const finca = getPuntoMapa('finca-tres-esquinas');
    expect(finca).toBeDefined();
    expect(finca!.precision).toBe('aproximada');
    expect(finca!.lngLat).toEqual([-75.6667, 4.5333]);
  });

  it('todas las coordenadas están en formato GeoJSON [longitud, latitud]', () => {
    for (const punto of PUNTOS_MAPA) {
      const [lng, lat] = punto.lngLat;
      expect(lng).toBeGreaterThan(-180);
      expect(lng).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    }
  });
});
