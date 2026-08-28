import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AssetUploadForm,
  ContentRowActions,
  CreateReleaseForm,
} from '@/app/admin/contenido/ContenidoForms';
import type { AssetRow, ContentRow } from '@/features/admin/content-types';

// Las Server Actions arrastran la cadena server (next-auth → next/server),
// no disponible en jsdom: se mockean; la lógica de autorización se prueba
// en el servicio.
vi.mock('@/app/admin/contenido/actions', () => ({
  approveAssetAction: async () => ({ ok: true }),
  archiveAssetAction: async () => ({ ok: true }),
  sendToReviewAction: async () => ({ ok: true }),
  publishAction: async () => ({ ok: true }),
  archiveAction: async () => ({ ok: true }),
  sendReleaseToReviewAction: async () => ({ ok: true }),
  publishReleaseAction: async () => ({ ok: true }),
  archiveReleaseAction: async () => ({ ok: true }),
  createDraftAction: async () => ({ ok: true }),
  createReleaseAction: async () => ({ ok: true }),
  registerAssetAction: async () => ({ ok: true }),
  prepareSignedAssetUploadAction: async () => ({ ok: true }),
  completeSignedAssetUploadAction: async () => ({ ok: true }),
  editContentAction: async () => ({ ok: true }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => null,
}));

/**
 * Pruebas de la interfaz de contenido: las acciones visibles dependen de
 * las capacidades recibidas (canEdit/canPublish). El servidor sigue
 * siendo la autoridad final.
 */

function fila(status: ContentRow['status'], version = 1): ContentRow {
  return {
    id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
    title: 'Entrada',
    slug: 'entrada',
    body: null,
    status,
    version,
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
    publishedAt: null,
    archivedAt: null,
  };
}

function asset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    id: 'b3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
    storageKey: 'tueste-admin-assets/releases/portada.webp',
    filename: 'portada.webp',
    mimeType: 'image/webp',
    sizeBytes: 2048,
    altText: null,
    status: 'pending',
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
    ...overrides,
  };
}

describe('contenido · acciones visibles por capacidad', () => {
  it('un editor sin content.publish no ve el botón Publicar', () => {
    render(<ContentRowActions row={fila('review')} canEdit canPublish={false} />);

    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    // Sí puede archivar (content.edit).
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeInTheDocument();
  });

  it('con content.publish sí aparece Publicar en revisión', () => {
    render(<ContentRowActions row={fila('review')} canEdit canPublish />);

    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument();
  });

  it('sin content.edit no aparecen acciones de borrador', () => {
    render(<ContentRowActions row={fila('draft')} canEdit={false} canPublish={false} />);

    expect(screen.queryByRole('button', { name: 'Enviar a revisión' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument();
  });

  it('el formulario de lanzamiento permite portada y pistas sin JSON manual', () => {
    render(
      <CreateReleaseForm
        assets={[
          asset(),
          asset({
            id: 'c3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
            filename: 'origen.mp3',
            mimeType: 'audio/mpeg',
          }),
        ]}
      />,
    );

    expect(screen.getByLabelText('Portada')).toBeInTheDocument();
    expect(screen.getByText('Pistas opcionales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear lanzamiento' })).toBeInTheDocument();
  });

  it('el formulario de subida queda deshabilitado si Storage no está configurado', () => {
    render(<AssetUploadForm storageConfigured={false} />);

    expect(screen.getByLabelText('Archivo')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Subir activo' })).toBeDisabled();
    expect(screen.getByText(/Storage todavía no está configurado/)).toBeInTheDocument();
  });
});
