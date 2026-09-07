# Fase 9 — Analítica, observabilidad y alertas

Estado: **EN CURSO**
Fecha de inicio: 7 de septiembre de 2026
Rama: `feat/experiencia-functional-hardening`
Checkpoint de entrada: `89e636a` — G8 aprobado
Migración remota: `20260907133636` — `analytics_observability`

## Objetivo

Medir el embudo público y detectar fallas operativas con señales first-party,
sin enviar datos personales innecesarios ni activar proveedores externos sin
consentimiento y política aprobados.

## Alcance permitido

- Contrato versionado de diez eventos públicos del recorrido Tueste.
- Propiedades estrictas, tipadas y sin correo, teléfono, nombre o texto libre.
- Envío best-effort a una ruta interna y deduplicación por `eventId`.
- Persistencia privada en Supabase con RLS habilitado y sin grants públicos.
- Registro correlacionable de errores operativos sin payload ni mensaje sensible.
- Panel mínimo de conversión y salud para administradores con capacidad
  `analytics.read`.
- Proveedores externos desactivados hasta que exista decisión documentada de
  consentimiento, política aplicable, responsable y configuración por entorno.

## Checkpoints

| Checkpoint                     | Estado                | Criterio                                                                                 |
| ------------------------------ | --------------------- | ---------------------------------------------------------------------------------------- |
| C9.1 Diccionario versionado    | APROBADO TÉCNICAMENTE | `event-contract.ts` define versión, propietario y propiedades permitidas.                |
| C9.2 Evento único y sin PII    | APROBADO TÉCNICAMENTE | Schema estricto, deduplicación cliente/DB y tests de contrato verdes.                    |
| C9.3 Errores en observabilidad | APROBADO TÉCNICAMENTE | `operational_errors`, RLS, correlación de API y probe remoto controlado verificados.     |
| C9.4 Tablero mínimo            | EN VALIDACIÓN MANUAL  | Panel existente ampliado con señales públicas y salud; falta revisar el recorrido admin. |
| C9.5 Alertas operables         | PENDIENTE             | Deben quedar umbral, destino, responsable y procedimiento antes de G9.                   |

## Puerta G9

G9 solo podrá solicitar aprobación después de ejecutar pruebas de contrato,
aplicar y verificar la migración, recorrer los eventos en navegador y provocar
un error controlado comprobando su correlación en el panel o consulta privada.
Ver llamadas en consola no es evidencia suficiente.

## Evidencia acumulada

- `npm test -- --run src/features/analytics/__tests__` pasó con 5 pruebas;
  el contrato de API, el rechazo de PII y la deduplicación están cubiertos.
- `npm run verify` pasó con 110 archivos de prueba y 625 pruebas, además de
  lint, formato, TypeScript y build; `git diff --check` también pasó.
- Supabase remoto confirmó las dos tablas privadas, RLS activo y los cuatro
  índices esperados. El probe con un `eventId` repetido insertó 1 evento en el
  primer intento y 0 en el segundo; el error controlado quedó persistido.
- El navegador local generó `product_added` desde el botón real de Tienda y la
  consulta privada confirmó la propiedad permitida `{ productId, quantity }`,
  sin datos personales.

## Decisión de privacidad

La implementación de esta fase es first-party y no usa cookies, localStorage,
IP, proveedores de publicidad ni payloads de formularios. La integración de
Google Analytics, PostHog, Sentry u otro tercero queda fuera hasta contar con
consentimiento explícito y configuración separada para local, preview y
producción.

## Reapertura

Si una propiedad nueva permite PII, un reintento cuenta dos veces, una tabla se
expone por Data API/RLS, un error guarda payload sensible o una alerta no tiene
responsable y procedimiento, se reabre Fase 9 y se detiene la siguiente fase.
