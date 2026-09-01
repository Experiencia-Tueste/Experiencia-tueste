import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PublishedEditorial from '../PublishedEditorial';
import { EMPTY_PUBLIC_EDITORIAL_PROJECTION } from '@/features/public-content/types';

describe('PublishedEditorial', () => {
  it('no agrega una sección vacía cuando aún no hay publicaciones', () => {
    const { container } = render(
      <PublishedEditorial projection={EMPTY_PUBLIC_EDITORIAL_PROJECTION} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra entradas, lanzamientos y solo URLs públicas temporales', () => {
    render(
      <PublishedEditorial
        projection={{
          entries: [
            {
              id: 'entry-1',
              title: 'Diario de cosecha',
              slug: 'diario-de-cosecha',
              body: 'La finca despierta con el primer pulso del café.',
              publishedAt: '2026-09-01T12:00:00.000Z',
            },
          ],
          releases: [
            {
              id: 'release-1',
              title: 'Origen vivo',
              slug: 'origen-vivo',
              publishedAt: '2026-09-02T12:00:00.000Z',
              coverUrl: 'https://storage.example.test/signed-cover',
              coverAlt: 'Portada del origen vivo',
              tracks: [
                {
                  id: 'track-1',
                  title: 'Pulso de finca',
                  durationSeconds: 75,
                  hz: 432,
                  audioUrl: 'https://storage.example.test/signed-audio',
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Lo nuevo del origen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Diario de cosecha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Origen vivo' })).toBeInTheDocument();
    expect(screen.getByAltText('Portada del origen vivo')).toHaveAttribute(
      'src',
      'https://storage.example.test/signed-cover',
    );
    expect(document.querySelector('audio')).toHaveAttribute(
      'src',
      'https://storage.example.test/signed-audio',
    );
    expect(document.body.textContent).not.toContain('storageKey');
  });
});
