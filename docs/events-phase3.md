# Fase 3 — Eventos de extremo a extremo

Estado: **EN CURSO**  
Inicio: 7 de septiembre de 2026  
Rama: `feat/experiencia-functional-hardening`  
Checkpoint anterior: `1b0dd61`

La fase se abrió después de aprobar G2. La Fase 4 y las posteriores siguen
cerradas; no se autoriza iniciar otra fase hasta cerrar G3 con la evidencia
definida en el plan archivado.

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

## Estado de checkpoints

| Checkpoint                                   | Estado      | Evidencia pendiente                             |
| -------------------------------------------- | ----------- | ----------------------------------------------- |
| C3.1 Visibilidad de eventos operables        | EN PROGRESO | Prueba E2E con estados y fechas reales          |
| C3.2 Capacidad bajo concurrencia             | EN PROGRESO | Prueba concurrente contra base controlada       |
| C3.3 Lista de espera                         | EN PROGRESO | Recorrido último cupo → espera → comunicación   |
| C3.4 Confirmación y trazabilidad             | EN PROGRESO | E2E solicitud → asistente → auditoría           |
| C3.5 Ticket y check-in                       | EN PROGRESO | E2E de ticket inválido, cancelado y reutilizado |
| C3.6 Panel, filtros, historial y exportación | EN PROGRESO | Verificación de permisos y descarga             |

La implementación local tiene pruebas unitarias de contratos, disponibilidad,
confirmación idempotente y exportación. Esto no equivale todavía a G3: falta
el recorrido E2E completo y la prueba de concurrencia. El `fetch origin` de la
apertura no pudo resolver GitHub en el entorno actual; no se cambió de rama ni
se hizo push.
