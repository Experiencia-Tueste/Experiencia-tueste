# Despliegue portable: Railway y Latinoamérica Hosting

## Objetivo

La aplicación se entrega como un contenedor standalone de Next.js. Railway se
usa como entorno temporal de staging; Latinoamérica Hosting será el destino
posterior. La aplicación no debe depender de APIs específicas de ninguno de
los dos proveedores.

## Servicio web

- Build: `Dockerfile` en la raíz del repositorio.
- Proceso: `node server.js`.
- Puerto: `3000` (el contenedor escucha en `0.0.0.0`).
- Health check: `GET /`.
- Reinicio: automático ante fallos.
- Configuración reproducible de Railway: `railway.json`.

El Dockerfile no incluye archivos `.env*`, claves, credenciales ni el directorio
`infra/`. Las variables se configuran en el panel seguro del proveedor.

## Variables privadas del servicio

Configurar en Railway durante staging y, posteriormente, en Latinoamérica
Hosting. Nunca subir valores reales al repositorio:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_TRUST_HOST` (en Railway: `true`; solo para el proxy controlado)
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_URL`
- `SUPABASE_STORAGE_ADMIN_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SITE_URL`
- `SHOPIFY_STORE_URL`

Las variables con prefijo `NEXT_PUBLIC_` son públicas por diseño. Todas las
demás, especialmente `DATABASE_URL`, `AUTH_*` y `SUPABASE_STORAGE_ADMIN_KEY`,
son server-only.

## Migraciones

Las migraciones se ejecutan como operación controlada antes de promover una
versión. No se ejecutan dentro del contenedor web actual porque la imagen final
contiene únicamente el servidor standalone y no incluye `drizzle-kit`.

Desde un entorno seguro con las variables privadas cargadas:

```bash
npm run db:migrate
npm run db:bootstrap
```

El bootstrap solo se ejecuta una vez para el administrador inicial. Nunca se
ejecuta automáticamente en cada reinicio del servicio web.

## Publicaciones programadas

La programación usa PostgreSQL como fuente de verdad y un proceso ejecutor
independiente. En Railway se configura un servicio cron separado con intervalo
mínimo de cinco minutos y este comando:

```bash
npm run db:publish-scheduled
```

El servicio cron recibe únicamente `DATABASE_URL`, no expone dominio público y
no comparte credenciales OAuth ni claves de Storage. En Latinoamérica Hosting
se usa la tarea programada equivalente. El ejecutor es corto, idempotente,
cierra sus conexiones y registra cada publicación en auditoría.

El cambio de proveedor solo reemplaza la configuración del ejecutor; no cambia
las tablas, acciones, permisos ni reglas de negocio.

## Checklist de staging

1. Conectar el repositorio y confirmar que se detecta `Dockerfile`.
2. Configurar las variables privadas sin pegarlas en logs ni commits.
3. Ejecutar la migración desde un entorno seguro.
4. Confirmar `GET /` y abrir `/admin/login`.
5. Probar login Google, Storage y `/admin/contenido`.
6. Verificar una subida, aprobación y publicación de prueba.
7. Programar una publicación a cinco minutos, verificar el cron y confirmar su
   aparición en `/experiencia`.
8. Configurar el dominio HTTPS y actualizar el callback de Google.
9. Documentar rollback antes de promover a producción.
