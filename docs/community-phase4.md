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

## Estado inicial

La entrada pública existente escribe solicitudes en `engagement_requests` y
el panel dispone además de `community_members`. Antes de implementar altas o
actualizaciones se debe resolver C4.1: `engagement_requests` es el candidato
inicial para la fuente de intención, pero no se declarará fuente canónica ni
se crearán sincronizaciones paralelas hasta cerrar la decisión con su modelo
de preferencias y consentimiento.

## Checkpoints

| Checkpoint                                    | Estado    | Evidencia exigida                         |
| --------------------------------------------- | --------- | ----------------------------------------- |
| C4.1 Fuente canónica y ausencia de duplicados | PENDIENTE | Decisión, restricción y prueba por cuenta |
| C4.2 Alta, cambio y retiro idempotentes       | PENDIENTE | Tests API + DB con una misma cuenta       |
| C4.3 Panel, estado y trazabilidad             | PENDIENTE | Recorrido administrativo con auditoría    |
| C4.4 Retiro impide nuevas comunicaciones      | PENDIENTE | Prueba de autorización posterior a baja   |
| C4.5 Flujo completo                           | PENDIENTE | Componentes, API, DB y E2E                |

No se inicia Fase 5 hasta que todos los checkpoints pasen, exista evidencia
reproducible y se cree su checkpoint Git.
