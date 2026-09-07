# Fase 3 — Eventos de extremo a extremo

Estado: **CERRADA — G3 APROBADO**
Inicio: 7 de septiembre de 2026
Rama: `feat/experiencia-functional-hardening`
Checkpoint anterior: `1b0dd61`

La fase se abrió después de aprobar G2 y se cerró después de completar la
prueba concurrente y el E2E controlado definidos en la puerta G3. La Fase 4
queda ahora abierta como única fase activa; las fases posteriores siguen
cerradas.

## Trabajo iniciado

- La agenda pública solo devuelve eventos futuros en estado `open` o
  `waitlist`; eventos borrador, cerrados, cancelados y pasados quedan fuera.
- La disponibilidad pública deriva los estados `few` y `wait` desde la
  capacidad ocupada, sin prometer una reserva.
- El panel puede filtrar por estado, ciudad y rango de fechas.
- Una persona con `events.manage` puede confirmar una solicitud pública; la
  operación crea como máximo un asistente por correo/evento, cierra la
  solicitud y escribe auditoría para la solicitud y el asistente en la misma
  transacción.
- La exportación CSV exige `events.export`, es privada y protege valores que
  podrían interpretarse como fórmulas.

## Estado final de checkpoints

| Checkpoint                                   | Estado   | Evidencia pendiente                                             |
| -------------------------------------------- | -------- | --------------------------------------------------------------- |
| C3.1 Visibilidad de eventos operables        | APROBADO | Futuros `open`/`waitlist`; pasados y no operables excluidos     |
| C3.2 Capacidad bajo concurrencia             | APROBADO | Dos sesiones reales, resultado `reserved` + `waitlisted`        |
| C3.3 Lista de espera                         | APROBADO | Capacidad 1 agotada, estado `waitlisted` y mensaje de solicitud |
| C3.4 Confirmación y trazabilidad             | APROBADO | Una solicitud → un asistente, cierre y dos auditorías           |
| C3.5 Ticket y check-in                       | APROBADO | Check-in único; reuso, cancelado e inválido rechazados          |
| C3.6 Panel, filtros, historial y exportación | APROBADO | Tests de permisos/CSV y smoke del panel protegido               |

## Evidencia de salida G3 — 7 de septiembre de 2026

- En Supabase `eekhplpnrskiipdmbnbq`, dos transacciones simultáneas bloquearon
  el mismo evento de capacidad 1. El primer intento obtuvo `reserved`; el
  segundo esperó el commit y obtuvo `waitlisted`, sin sobrecupo.
- El E2E transaccional controlado recorrió solicitud `pending`, confirmación,
  cierre, creación idempotente de un asistente, auditorías y check-in. El
  segundo check-in, un ticket cancelado y uno inexistente afectaron cero filas.
- La comprobación posterior dejó cero eventos, asistentes, solicitudes o
  auditorías sintéticas.
- Verificación local: 102 archivos de prueba, 592 pruebas, lint, formato,
  TypeScript y build exitosos.
- Smoke de aplicación: `/experiencia` respondió 200; `/admin/eventos` exigió
  autenticación y redirigió a `/cuenta/iniciar-sesion`.

Con esta evidencia se aprueba formalmente `G3`. El `fetch origin` de la
apertura no pudo resolver GitHub en el entorno actual; no se cambió de rama ni
se hizo push.
