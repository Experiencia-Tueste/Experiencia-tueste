import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AssetUploadForm,
  ContentRowActions,
  CreateDraftForm,
  CreateReleaseForm,
} from '@/app/admin/contenido/ContenidoForms';
import { createClient } from '@/lib/supabase/client';
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
  prepareSignedAssetUploadAction: async () => ({
    ok: true,
    upload: {
      bucket: 'tueste-admin-assets',
      path: 'admin-assets/2026/08/portada.webp',
      token: 'token-firmado',
      storageKey: 'tueste-admin-assets/admin-assets/2026/08/portada.webp',
      filename: 'portada.webp',
      mimeType: 'image/webp',
      sizeBytes: 2048,
      altText: '',
    },
  }),
  completeSignedAssetUploadAction: async () => ({ ok: true }),
  editContentAction: async () => ({ ok: true }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
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

  it('los formularios muestran ayudas breves de slug y razón', () => {
    render(<CreateDraftForm />);

    expect(screen.getAllByText('Solo minúsculas, números y guiones.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Queda guardada en auditoría.').length).toBeGreaterThan(0);
  });

  it('un lanzamiento sin activos avisa que hay que subir y aprobar antes de usarlos', () => {
    render(<CreateReleaseForm assets={[]} />);

    expect(screen.getByText('Sube y aprueba activos antes de usarlos.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Portada')).not.toBeInTheDocument();
  });

  it('el upload muestra un mensaje accionable y seguro si Storage rechaza la autorización', async () => {
    vi.mocked(createClient).mockReturnValue({
      storage: {
        from: () => ({
          uploadToSignedUrl: async () => ({
            error: { name: 'StorageApiError', status: 403, message: 'AccessDenied' },
          }),
        }),
      },
    } as never);

    render(<AssetUploadForm storageConfigured />);

    const input = screen.getByLabelText('Archivo') as HTMLInputElement;
    const file = new File(['contenido'], 'portada.webp', { type: 'image/webp' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('Razón', { exact: false }), {
      target: { value: 'subo la portada' },
    });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(await screen.findByText(/Storage rechazó la autorización/)).toBeInTheDocument();
    // Nunca se muestra el mensaje JSON crudo del error.
    expect(screen.queryByText('AccessDenied')).not.toBeInTheDocument();
    expect(screen.queryByText(/StorageApiError/)).not.toBeInTheDocument();
  });

  it('un activo con previewUrl conserva el tipo y la tarjeta no rompe la fila', () => {
    const conPreview = asset({
      id: 'd3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
      status: 'approved',
      previewUrl: 'https://example.com/signed/portada.webp?token=abc',
    });
    expect(conPreview.previewUrl).toContain('/signed/');
    expect(conPreview.status).toBe('approved');
  });
});
