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

## Contrato de variables por entorno

Configurar en Railway durante staging y, posteriormente, en Latinoamérica
Hosting. Nunca subir valores reales al repositorio. `TUESTE_ENV` distingue
los perfiles y evita que el fallback local se use en un despliegue público:

| Perfil     | `TUESTE_ENV` | `SITE_URL`                                 | Checkout recomendado               |
| ---------- | ------------ | ------------------------------------------ | ---------------------------------- |
| Local      | `local`      | Opcional; fallback `http://localhost:3000` | `disabled`                         |
| Preview    | `preview`    | Obligatoria, pública y HTTPS               | `disabled`                         |
| Producción | `production` | Obligatoria, pública y HTTPS               | `disabled` hasta aprobar proveedor |

En una imagen Docker, pasar `TUESTE_ENV=preview|production` y el `SITE_URL`
correspondiente como argumentos de build además de configurar las variables de
runtime. No se pasan secretos como argumentos de build.

### Variables públicas

Estas variables se inyectan en el bundle del navegador por diseño y no deben
contener secretos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ambas se configuran juntas o ambas se dejan vacías para modo demo.

### Variables server-only

Estas variables no deben llevar prefijo `NEXT_PUBLIC_` ni llegar al bundle:

- `TUESTE_ENV`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_TRUST_HOST` (en Railway: `true`; solo para el proxy controlado)
- `ADMIN_BOOTSTRAP_EMAIL` (solo para el comando explícito de bootstrap)
- `DATABASE_URL`
- `SUPABASE_STORAGE_URL`
- `SUPABASE_STORAGE_ADMIN_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SITE_URL`
- `SHOPIFY_STORE_URL`
- `CHECKOUT_MODE`
- `PAYMENTS_SERVICE_URL`
- `PAYMENTS_JWT_PRIVATE_KEY`
- `PAYMENTS_JWT_KEY_ID`
- `PAYMENTS_JWT_ISSUER`
- `PAYMENTS_JWT_AUDIENCE`
- `PAYMENTS_REQUEST_TIMEOUT_MS`

`CHECKOUT_MODE=disabled` es el valor seguro. `external_shopify` exige
`SHOPIFY_STORE_URL` HTTPS; `mercadopago_legacy` exige el BFF de pagos completo;
`shopify` nativo permanece cerrado hasta una fase posterior con contrato
operativo, credenciales y pruebas propias. Una combinación incompleta debe
fallar y no activar un proveedor parcialmente.

## Migraciones

Las migraciones se ejecutan como operación controlada antes de promover una
versión. No se ejecutan dentro del contenedor web actual porque la imagen final
contiene únicamente el servidor standalone y no incluye `drizzle-kit`.

Desde un entorno seguro con las variables privadas cargadas:

```bash
npm run db:migrate
npm run db:bootstrap
```

Para verificar sin leer ni imprimir credenciales, se puede ejecutar la suite
con las variables públicas deliberadamente vacías:

```bash
NEXT_PUBLIC_SUPABASE_URL='' NEXT_PUBLIC_SUPABASE_ANON_KEY='' npm run verify
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

## Rollback de configuración comercial

Ante cualquier duda sobre proveedor, credenciales o callback, cambiar
`CHECKOUT_MODE` a `disabled`, redeplegar y confirmar que la selección queda
guardada sin iniciar cobros. No se debe activar un modo comercial para “probar”
una variable puesta a mano sin pasar la verificación local y el checkpoint de
la fase.

## Advisories de Supabase

La revisión de advisories y la decisión de cada aviso están registradas en
[`docs/supabase-advisories.md`](supabase-advisories.md). El aviso de seguridad
de contraseñas filtradas bloquea la promoción a producción hasta corregirse o
aceptarse explícitamente por el responsable de Auth.
