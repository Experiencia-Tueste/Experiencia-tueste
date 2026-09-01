# Base de datos administrativa — panel Tueste

## Propósito

La base administrativa guarda la identidad, roles y auditoría del panel
interno de Tueste. Usa **PostgreSQL administrado de Supabase** y el esquema
privado `private` (nunca el esquema `public`).

## Tablas (schema `private`)

| Tabla                      | Propósito                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `private.admin_users`      | Usuarios del panel: correo normalizado único, estado (`invited`, `active`, `suspended`), fechas con timezone. |
| `private.admin_roles`      | Los seis roles: `owner`, `admin`, `editor`, `operador`, `moderador`, `lector`.                                |
| `private.admin_user_roles` | Asignación usuario ↔ rol (clave primaria compuesta).                                                          |
| `private.audit_logs`       | Trazabilidad append-only: actor, acción, objetivo, razón y metadata JSONB.                                    |

## Reglas de acceso

- El schema `private` **no debe exponerse vía Data API** de Supabase: la
  migración revoca todo acceso a `PUBLIC`, `anon` y `authenticated`.
- El único acceso a la base es **server-side** (`src/db/client.ts`, con
  `import 'server-only'` y `getDb()` perezoso).
- **No hay pagos ni operaciones de negocio implementadas aún.**

## Migraciones

- Todo cambio de esquema pasa por una **migración versionada**
  (`npm run db:generate` para generarla, `npm run db:migrate` para
  aplicarla). No existe `db:push`.
- La carpeta `drizzle/` se versiona en Git; no se ignora.

## Procedimiento de recuperación

- **No editar producción manualmente** (ni SQL a mano ni la consola de
  Supabase).
- Para corregir un error de esquema: crear una **nueva migración
  correctiva** con `npm run db:generate`, revisarla y aplicarla con
  `npm run db:migrate`.

## Bootstrap (roles y primer administrador)

- Los seis roles iniciales y el primer administrador se crean con un
  comando **explícito e idempotente** (no se ejecuta automáticamente y
  no se inventa ningún correo):

  ```bash
  ADMIN_BOOTSTRAP_EMAIL=correo@tueste.co npm run db:bootstrap
  ```

- El comando:
  - inserta los seis roles (`owner`, `admin`, `editor`, `operador`,
    `moderador`, `lector`) con `ON CONFLICT DO NOTHING`;
  - crea el primer usuario con estado `active` (idempotente por email);
  - le asigna el rol `owner`;
  - nunca imprime secretos ni valores de `DATABASE_URL`.
- Requiere que `DATABASE_URL` esté definida únicamente en `.env.local`.

## RBAC persistente

- `getCurrentAdmin()` consulta `private.admin_users` y los roles del
  usuario en PostgreSQL. El acceso se concede solo a usuarios `active`
  con al menos un rol persistido; cualquier fallo cierra el acceso.
- La antigua allowlist temporal (`ADMIN_ALLOWED_EMAILS`) **ya no decide
  el acceso**: Supabase Auth identifica desde la puerta pública y el RBAC
  persistente decide si la persona puede entrar al panel.
- Las capacidades por rol se derivan del contrato
  (`src/features/admin/permissions.ts`), no se duplican en la base.

## Contenido y activos (Fase 2)

- Tablas nuevas en `private`: `assets`, `content_entries`, `releases`,
  `tracks` (relación lanzamiento → pistas 1:N; portada/audio → assets).
- **Migración `0001_blue_tarantula.sql` generada**: aplicar manualmente
  con `npm run db:migrate` cuando se confirme.
- Toda mutación pasa por el servicio de contenido: sesión, capacidad
  (`content.read` / `content.edit` / `content.publish`), Zod y auditoría
  append-only con razón obligatoria.
- **Multi-rol**: un usuario puede tener varios roles; las capacidades
  efectivas son la unión de todos sus roles (no se descartan roles
  secundarios).

## Storage (URLs firmadas) — implementado con Supabase

- El contrato `storageProvider` está **implementado** en
  `src/integrations/storage/supabase-storage.ts` (Supabase Storage):
  subida con URL firmada (`createSignedUploadUrl` desde el navegador),
  lectura con URLs firmadas de corta expiración y previews en la
  biblioteca de activos.
- Requiere credenciales server-only (`SUPABASE_STORAGE_URL`,
  `SUPABASE_STORAGE_ADMIN_KEY`, `SUPABASE_STORAGE_BUCKET`), nunca con
  prefijo `NEXT_PUBLIC_`. Sin ellas, el panel queda con Storage
  deshabilitado (fail cerrado, sin subidas).
- Exposición a la interfaz: solo URLs firmadas con expiración corta;
  las claves del proveedor nunca llegan al cliente.
