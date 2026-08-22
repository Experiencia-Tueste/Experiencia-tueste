# Tueste · Origen Tostado

Página pública de Tueste: café colombiano traducido en música, frecuencias y
experiencias inmersivas. Implementación por fases del mockup de referencia
(`../plan master/origen-tostado.html`), con arquitectura profesional y
accesibilidad.

## Requisitos

- Node.js `>=20.9.0` (engine de Next.js instalado)
- npm `>=10`

## Reproducibilidad

- `.nvmrc` fija la versión de Node (línea 20 estable). Desde una
  instalación limpia: `nvm install` (instala la versión del `.nvmrc`) y
  luego `nvm use` (la activa en el shell).
- Las variables de entorno se documentan en `.env.example` (solo las
  públicas de Supabase, sin valores reales). Copia a `.env.local`
  cuando actives la persistencia; el modo demo funciona sin ellas.
- Contrato de configuración: `src/lib/config/env.ts` es la única fuente
  de verdad para `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SHOPIFY_STORE_URL`. Con las dos
  primeras vacías devuelve `null` (modo demo); con configuración parcial
  o URL inválida lanza un error claro. Los clientes de Supabase
  (`src/lib/supabase/`) consumen exclusivamente ese contrato, sin
  lecturas duplicadas de `process.env`.
- `SHOPIFY_STORE_URL` es la URL pública de la tienda Tueste Co para el
  portal de entrada. Debe ser una URL absoluta `https://`; si está vacía
  o ausente, la tarjeta Tienda muestra «Tienda próximamente» (sin enlace
  roto). La URL final será la de Shopify cuando se active la tienda.
- CI (`.github/workflows/ci.yml`) valida en cada `push` y `pull_request`
  con la versión de `.nvmrc`, caché de npm y `npm ci`, ejecutando en
  orden: `lint`, `format:check`, `typecheck`, `test` y `build`.

## Instalación

```bash
npm install
```

## Contenedor de producción (ECS Fargate)

La salida es `standalone` de Next.js (compatible con SSR, autenticación
y Route Handlers futuros; no se usa `output: 'export'`).

```bash
docker build --build-arg SITE_URL=https://staging.ejemplo.com -t tueste-web .
docker run --rm -p 3000:3000 tueste-web
```

- `SITE_URL` es pública y se usa durante el build para canonical y
  metadata; se pasa como build arg (no secreto) con fallback demo si
  no se entrega. Los secretos **no** se pasan como build args ni por
  `--env-file`: ECS/Fargate los recibirá únicamente mediante IAM +
  AWS Secrets Manager en una fase posterior.
- La imagen multi-stage instala con `npm ci`, compila y copia solo
  `public`, `.next/static` y el servidor standalone; corre como usuario
  no-root en el puerto `3000`.
- El health check inicial de AWS puede usar `GET /` (no se crea un
  endpoint artificial para ello todavía).

## Comandos

| Comando                | Descripción                                          |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Next.js)                     |
| `npm run build`        | Build de producción (prerenderizado estático)        |
| `npm run start`        | Sirve el build de producción                         |
| `npm test`             | Ejecuta los tests unitarios (Vitest)                 |
| `npm run test:watch`   | Tests en modo watch                                  |
| `npm run typecheck`    | TypeScript sin emitir (`tsc --noEmit`)               |
| `npm run lint`         | ESLint (flat config, reglas Next/TS/Core Web Vitals) |
| `npm run lint:fix`     | ESLint con correcciones automáticas                  |
| `npm run format:check` | Verifica el formato con Prettier                     |
| `npm run format`       | Aplica el formato con Prettier                       |

## Estructura

- `src/features/` — lógica pura y contratos tipados por dominio
  (audio, barista, commerce, community, mercado, radio, site…), con sus
  tests en `__tests__/`. Sin efectos: el navegador presenta, el servidor
  decide.
- `src/components/` — componentes de presentación con CSS Modules:
  `home/` (secciones públicas de la página) y `brand/` (íconos de marca).
- `src/lib/` — utilidades compartidas (audio, validación con Zod,
  contrato de configuración pública en `config/env.ts`, cliente Supabase
  sin uso activo).
- `src/styles/` — tokens globales de diseño (colores, tipografías,
  espacios, modo día/noche, `prefers-reduced-motion`).

## Calidad

- ESLint con configuración flat (`eslint.config.mjs`): reglas de
  Next.js, TypeScript y Core Web Vitals, más integración con Prettier.
- Prettier: comillas simples, trailing commas y ancho de línea de 100
  (`.prettierrc.json`).
- `.editorconfig`: UTF-8, LF, indentación de 2 espacios y newline final.
- Accesibilidad: enlace de salto al contenido (`SkipLink`) para
  navegación por teclado, visible solo al recibir foco y con destino en
  `<main>`. Va antes del Navbar (primer foco del documento) y Navbar lo
  desactiva temporalmente (`inert`) mientras el menú móvil está abierto.
- Pruebas de accesibilidad de teclado (Vitest + Testing Library en
  jsdom): orden de foco del SkipLink y aislamiento del menú móvil.
- Estados de error y 404 locales (`error.tsx`, `global-error.tsx` y
  `not-found.tsx`), sin monitoreo externo todavía.

## Verificación local

Mientras GitHub Actions está desactivado por el bloqueo de facturación
de la cuenta, la calidad se valida localmente (detalles en
[`docs/ci-local.md`](docs/ci-local.md)):

```bash
npm run verify
```

## Seguridad

Cabeceras HTTP base aplicadas a todas las rutas desde `next.config.mjs`
(módulo puro en `src/lib/security/security-headers.mjs`, probado):

- `X-Content-Type-Options: nosniff` — evita que el navegador interprete
  respuestas con un tipo MIME distinto al declarado.
- `Referrer-Policy: strict-origin-when-cross-origin` — limita qué
  información de origen se envía en el encabezado `Referer`.
- `X-Frame-Options: DENY` — bloquea la incrustación de la página en
  iframes ajenos (clickjacking); la CSP lo refuerza con
  `frame-ancestors 'none'`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(),
payment=(), usb=()` — desactiva permisos sensibles no usados.
- `Cross-Origin-Opener-Policy: same-origin` y
  `Cross-Origin-Resource-Policy: same-origin` — aislamiento de contexto
  y de recursos entre orígenes.
- `Content-Security-Policy-Report-Only` — CSP realista y centralizada
  (sin comodines) derivada de los orígenes activos (self + Google
  Fonts). Se promueve a `Content-Security-Policy` en staging tras
  verificar la experiencia; el paso exacto está documentado en
  `security-headers.mjs`.

Pendiente, a propósito: **HSTS** (solo cuando exista un dominio HTTPS
de producción confirmado en AWS). No existe monitoreo externo todavía.

### Contrato obligatorio para futuros Route Handlers y Server Actions

Cuando existan endpoints propios (hoy no hay ninguno), cada handler
deberá cumplir, sin excepciones:

1. Validar todo el input con Zod (entrada, cuerpo y parámetros).
2. Exigir autenticación y autorización DENTRO del handler; nunca
   confiar solo en middleware o proxy.
3. Responder `401` sin sesión válida y `403` sin permiso.
4. Limitar tamaño y tipo de payload (p. ej. JSON ≤ 1 MB; multimedia
   con tope explícito **a validar en staging**).
5. CORS cerrado por origen y método; nunca `Access-Control-Allow-Origin: *`.
6. Responder `429` ante abuso (el rate limiting real de perímetro vive
   en CloudFront + AWS WAF; no usar limitadores locales en memoria).
7. Aplicar timeout a integraciones externas (p. ej. 5 s inicial, **a
   validar en staging**).
8. No registrar secretos, tokens, cookies ni payload sensible en logs.

### Preparación para AWS

Arquitectura prevista (Route 53 → CloudFront + AWS WAF + Shield
Standard → ALB privado → ECS Fargate con Next.js → Secrets Manager +
CloudWatch):

- **Secrets Manager** guardará los secretos reales (nada de secretos en
  variables `NEXT_PUBLIC_*` ni en el repositorio).
- **GitHub Actions** usará OIDC federado, sin access keys permanentes.
- **AWS WAF** aplicará rate limits y reglas administradas; CloudFront
  absorberá y cacheará las rutas estáticas.
- **HSTS** se habilitará solo al confirmar el dominio HTTPS propio.
- Antes de producción habrá **staging** y **pruebas de carga**.
