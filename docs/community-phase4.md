# Fase 4 — Comunidad y consentimiento operable

Estado: **EN CURSO**
Inicio: 7 de septiembre de 2026
Rama: `feat/experiencia-functional-hardening`
Checkpoint anterior: G3 aprobado en `948a27a`

Esta es la única fase activa. Las fases 5 y posteriores permanecen cerradas
hasta aprobar G4.

## Objetivo

Tener una lista de comunidad honesta, administrable y compatible con cambios
de consentimiento.

## Alcance de la fase

- decidir y documentar una única fuente canónica;
- evitar duplicados activos por persona;
- usar el correo verificado de la cuenta autenticada;
- persistir preferencias y versión/fecha del consentimiento;
- permitir actualizar preferencias y retirar consentimiento;
- reflejar cambios en el panel con auditoría;
- conservar el lenguaje de comunidad y acceso anticipado, sin prometer un
  canal todavía no implementado.

## Decisión C4.1 — fuente canónica

La fuente canónica del estado actual de comunidad es
`private.community_members`, identificada por `requester_user_id` de la cuenta
Tueste autenticada. La restricción única de esa columna impide dos filas para
una misma cuenta; `email` solo es un snapshot del correo verificado y no es la
identidad.

`private.engagement_requests` conserva la solicitud de entrada, con una
restricción idempotente por cuenta y referencia, y `source_request_id` enlaza
la solicitud con la fila canónica. No se consulta como lista paralela de
miembros ni se permite crear miembros manuales desde el panel.

El estado vigente (`active`/`withdrawn`), preferencias, versión del texto de
consentimiento y fechas viven en `community_members`. Cada alta, cambio,
retiro o restauración agrega un registro append-only en
`community_consent_events`. Los registros legacy sin cuenta se migran a
`withdrawn` y no autorizan comunicaciones.

Estado de la decisión: **IMPLEMENTADA Y VERIFICADA**.

Evidencia C4.1: migración local `drizzle/0018_community_consent.sql`, aplicada
en Supabase como `20260907054750 / community_consent_phase_4`; el índice único
`community_members_requester_user_unique` rechazó una segunda fila sintética
para la misma cuenta. El proyecto quedó con cero filas sintéticas después de
la prueba.

## Checkpoints

| Checkpoint                                    | Estado    | Evidencia exigida                         |
| --------------------------------------------- | --------- | ----------------------------------------- |
| C4.1 Fuente canónica y ausencia de duplicados | APROBABLE | Decisión, restricción y prueba por cuenta |
| C4.2 Alta, cambio y retiro idempotentes       | APROBABLE | Tests API + DB con una misma cuenta       |
| C4.3 Panel, estado y trazabilidad             | APROBABLE | Panel compilado con estado y eventos      |
| C4.4 Retiro impide nuevas comunicaciones      | APROBABLE | Política + prueba DB después de baja      |
| C4.5 Flujo completo                           | PENDIENTE | Falta E2E autenticado del panel           |

## Evidencia de implementación y verificación

- El CTA público consulta `/api/community/consent` sin filtrar datos y usa el
  correo que devuelve la sesión verificada; permite guardar preferencias,
  retirar consentimiento y volver a activarlo.
- `GET`, `PUT` y `DELETE /api/community/consent` requieren sesión autenticada.
  La API valida que el consentimiento sea explícito y devuelve 401/400 sin
  escribir cuando no corresponde.
- El panel ya no ofrece ingreso manual de miembros. Muestra preferencias,
  estado, fecha de consentimiento, fecha de retiro y último evento.
- La prueba controlada remota ejecutó `granted`, `preferences_updated`,
  `withdrawn` y `restored`; durante `withdrawn` la elegibilidad de
  comunicación fue falsa. La limpieza final dejó cero registros sintéticos.
- Verificación local: `npm run format:check`, `npm run lint`,
  `npm run typecheck` y `npm test` pasan; la suite quedó en 103 archivos y
  598 pruebas. El build completo pasa en modo demo con ambas variables
  públicas de Supabase vacías y enumera `/api/community/consent`.
- Smoke HTTP en modo demo: `/experiencia` respondió 200 y
  `/api/community/consent` respondió 401 JSON sin sesión.

## Puerta G4

G4 queda **PENDIENTE DE APROBACIÓN FORMAL**: C4.1–C4.4 tienen evidencia
reproducible, pero C4.5 aún requiere un recorrido autenticado del panel
administrativo con una cuenta de prueba autorizada. No se abre Fase 5.

La guarda de Supabase Auth sobre contraseñas filtradas sigue abierta por la
limitación del plan Free y permanece documentada en
`docs/supabase-advisories.md`; no es una regresión de esta fase.

No se inicia Fase 5 hasta que todos los checkpoints pasen, exista evidencia
reproducible y se cree su checkpoint Git.
