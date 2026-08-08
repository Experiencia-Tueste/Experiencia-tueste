import { describe, expect, it } from 'vitest';
import { metadata } from '../layout';

/**
 * Metadata de marca y redes sociales (entorno node, sin jsdom).
 * Verifica description de marca, Open Graph y Twitter con el asset
 * local oficial y sus dimensiones reales, y metadataBase derivada del
 * contrato de configuración.
 */
describe('metadata de marca (layout raíz)', () => {
  it('deriva metadataBase del contrato de configuración', () => {
    expect(metadata.metadataBase?.toString()).toBe('http://localhost:3000/');
  });

  it('usa la description de marca, no la técnica', () => {
    expect(metadata.description).toBe(
      'Tueste · Origen Tostado. Café, música y ritual nacidos en el Eje Cafetero colombiano.',
    );
  });

  it('declara Open Graph de marca con imagen local y dimensiones reales', () => {
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      locale: 'es_CO',
      siteName: 'Tueste',
      title: 'Tueste · Origen Tostado',
    });

    const images = metadata.openGraph?.images;
    const image = Array.isArray(images) ? images[0] : images;
    expect(image).toMatchObject({
      url: '/brand/original-logo-completo-fondo-blanco.png',
      alt: 'Logo de Tueste · Origen Tostado',
      width: 1092,
      height: 1092,
    });
  });

  it('declara metadata de Twitter equivalente', () => {
    expect(metadata.twitter).toMatchObject({
      card: 'summary',
      title: 'Tueste · Origen Tostado',
      images: ['/brand/original-logo-completo-fondo-blanco.png'],
    });
  });
});
