import { defineConfig } from 'drizzle-kit';

/**
 * Configuración de Drizzle Kit.
 * ---------------------------------------------------------------------
 * La credencial se lee de `DATABASE_URL` (inyectada por los scripts
 * `db:generate` / `db:migrate` con `--env-file=.env.local`). Nunca se
 * hardcodean URLs, usuarios ni secretos.
 */

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/db/schema/admin-identity.ts',
    './src/db/schema/admin-content.ts',
    './src/db/schema/admin-config.ts',
  ],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
