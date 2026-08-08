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
  de verdad para `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Con ambas vacías devuelve `null`
  (modo demo); con configuración parcial o URL inválida lanza un error
  claro. Los clientes de Supabase (`src/lib/supabase/`) consumen
  exclusivamente ese contrato, sin lecturas duplicadas de
  `process.env`.
- CI (`.github/workflows/ci.yml`) valida en cada `push` y `pull_request`
  con la versión de `.nvmrc`, caché de npm y `npm ci`, ejecutando en
  orden: `lint`, `format:check`, `typecheck`, `test` y `build`.

## Instalación

```bash
npm install
```

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

## Seguridad

Cabeceras HTTP base aplicadas a todas las rutas desde `next.config.mjs`
(módulo puro en `src/lib/security/security-headers.mjs`, probado):

- `X-Content-Type-Options: nosniff` — evita que el navegador interprete
  respuestas con un tipo MIME distinto al declarado.
- `Referrer-Policy: strict-origin-when-cross-origin` — limita qué
  información de origen se envía en el encabezado `Referer`.
- `X-Frame-Options: SAMEORIGIN` — bloquea la incrustación de la página
  en iframes de otros orígenes (clickjacking).
- `Permissions-Policy: camera=(), microphone=(), geolocation=(),
payment=(), usb=()` — desactiva permisos sensibles no usados.

Pendientes, a propósito: **Content-Security-Policy** (requiere auditoría
de orígenes; el proyecto carga fuentes externas) y **HSTS** (solo cuando
exista un dominio HTTPS de producción confirmado). No existe monitoreo
externo todavía.
