import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('proyección pública de contenido', () => {
  const repository = readFileSync(
    resolve(process.cwd(), 'src/db/public-content-repository.ts'),
    'utf8',
  );
  const service = readFileSync(
    resolve(process.cwd(), 'src/features/public-content/service.ts'),
    'utf8',
  );

  it('consulta exclusivamente estados publicados y activos aprobados', () => {
    expect(repository).toContain("eq(contentEntries.status, 'published')");
    expect(repository).toContain("eq(releases.status, 'published')");
    expect(repository).toContain("eq(assets.status, 'approved')");
    expect(repository).toContain('isNotNull(contentEntries.publishedAt)');
    expect(repository).toContain('isNotNull(releases.publishedAt)');
  });

  it('mantiene las storage keys en servidor y entrega URLs firmadas', () => {
    expect(service.startsWith("import 'server-only';")).toBe(true);
    expect(service).toContain('provider.getSignedUrl');
    expect(service).not.toContain('NEXT_PUBLIC');
    expect(service).not.toContain('service_role');
  });
});
