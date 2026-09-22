# Plan de cierre por fases — Tueste Experiencia

## Propósito

Este documento convierte el plan maestro y la auditoría de implementación en una secuencia de
trabajo cerrada. Solo puede existir **una fase activa** y ninguna fase siguiente comienza hasta que
la puerta de salida de la fase actual esté en estado `APROBADA`.

El plan parte del estado observado en:

- Worktree: `tueste-app-integrate-tree`.
- Rama: `feat/experiencia-functional-hardening`.
- Commit base registrado por el índice: `5b0607f`.
- Estado inicial: implementación funcional con cambios locales todavía sin commit.

Este documento no autoriza por sí solo despliegues, cobros, cambios de DNS, uso de credenciales de
producción ni merges a ramas protegidas.

## Regla principal

> Si falta un requisito obligatorio, una prueba, una evidencia o una decisión marcada como
> necesaria, la fase no está terminada y no se trabaja en la siguiente.

No se usan porcentajes como criterio de avance. Los únicos estados válidos son:

- `NO INICIADA`: nadie debe implementar trabajo propio de esa fase.
- `EN CURSO`: es la única fase que puede recibir cambios de alcance.
- `BLOQUEADA`: requiere una decisión, acceso o dato externo; no se salta.
- `CANDIDATA`: el trabajo terminó, pero falta ejecutar o revisar la puerta.
- `APROBADA`: todos los checkpoints y la evidencia están completos.
- `REABIERTA`: una regresión invalidó una aprobación anterior.

## Tablero de control

| Fase | Nombre                                                | Estado inicial | Dependencia |
| ---: | ----------------------------------------------------- | -------------- | ----------- |
|    0 | Congelar y asegurar la línea base                     | EN CURSO       | Ninguna     |
|    1 | Configuración y guardas de producción                 | NO INICIADA    | Fase 0      |
|    2 | Solicitudes, seguridad y continuidad de autenticación | NO INICIADA    | Fase 1      |
|    3 | Eventos de extremo a extremo                          | NO INICIADA    | Fase 2      |
|    4 | Comunidad y consentimiento operable                   | NO INICIADA    | Fase 3      |
|    5 | Radio: de oportunidad a activación                    | NO INICIADA    | Fase 4      |
|    6 | Mercado: aprobación y perfil de vendedor              | NO INICIADA    | Fase 5      |
|    7 | Mercado: producto y moderación                        | NO INICIADA    | Fase 6      |
|    8 | Mercado: experiencia pública del comprador            | NO INICIADA    | Fase 7      |
|    9 | Analítica, observabilidad y alertas                   | NO INICIADA    | Fase 8      |
|   10 | QA integral, accesibilidad y regresión visual         | NO INICIADA    | Fase 9      |
|   11 | Shopify y checkout final                              | NO INICIADA    | Fase 10     |
|   12 | Integración, despliegue y cierre                      | NO INICIADA    | Fase 11     |

Al aprobar una fase se debe completar este registro en el PR o bitácora de ejecución:

| Dato              | Valor requerido                               |
| ----------------- | --------------------------------------------- |
| Fase              | Número y nombre                               |
| SHA inicial       | Commit desde el cual comenzó                  |
| SHA final         | Commit exacto candidato a aprobación          |
| Migraciones       | IDs aplicados o `no aplica`                   |
| Pruebas           | Comandos y resultado                          |
| QA manual         | Navegador, viewport y recorrido validado      |
| Evidencia         | Enlaces a capturas, logs o reporte            |
| Riesgos aceptados | Ninguno, o decisión explícita con responsable |
| Aprobación        | Persona, fecha y resultado                    |

## Protocolo obligatorio de cada fase

1. Confirmar worktree, rama y estado antes de tocar archivos.
2. Cambiar únicamente archivos pertenecientes al alcance de la fase activa.
3. Añadir o actualizar pruebas en el mismo cambio que la funcionalidad.
4. Aplicar migraciones únicamente cuando correspondan a esa fase y verificar su historial.
5. Ejecutar las pruebas específicas de la fase.
6. Ejecutar `npm run verify` completo.
7. Realizar el recorrido manual o E2E descrito en la puerta de salida.
8. Revisar que no existan secretos, datos personales de prueba ni archivos accidentales en el diff.
9. Crear un commit de checkpoint identificable.
10. Registrar la evidencia y marcar la puerta como `APROBADA` antes de abrir la fase siguiente.

Si aparece una regresión de una fase aprobada, esa fase pasa a `REABIERTA`; se detiene la fase actual
y se corrige primero la regresión.

---

## Fase 0 — Congelar y asegurar la línea base

### Objetivo

Convertir los cambios acumulados de la sesión en una base revisable, reproducible y recuperable.

### Alcance

- Inventariar el diff actual y separar cualquier cambio ajeno al plan.
- Confirmar que la rama activa es `feat/experiencia-functional-hardening`.
- Confirmar la rama objetivo inmediata antes de abrir PR. La referencia esperada por esta sesión es
  `feat/integrate-tueste-tree`; cualquier destino diferente requiere decisión explícita.
- Revisar los archivos de migración `0014`, `0015` y `0016` y su journal.
- Verificar que las mismas migraciones constan como aplicadas en Supabase.
- Ejecutar la suite completa con una configuración de prueba válida, sin imprimir secretos.
- Revisar que `.env.local`, credenciales y archivos temporales no entren en el commit.
- Crear uno o más commits coherentes para fijar la línea base.

### Checkpoints

- `C0.1` Worktree, rama, base y destino de PR documentados.
- `C0.2` Diff revisado archivo por archivo; no hay cambios inexplicados.
- `C0.3` Migraciones locales y remotas coinciden.
- `C0.4` `npm run verify` pasa sin omitir pruebas.
- `C0.5` El commit no contiene secretos ni `.env.local`.
- `C0.6` Existe un SHA de checkpoint y el worktree queda limpio.

### Puerta de salida G0

`G0` se aprueba únicamente cuando `C0.1` a `C0.6` estén completos. Si el worktree continúa sucio,
si una migración no coincide o si no hay un SHA reproducible, **no se inicia la Fase 1**.

### Evidencia mínima

- Salida de `git status --short --branch`.
- SHA del checkpoint.
- Resultado de `npm run verify`.
- Lista de migraciones verificadas.

---

## Fase 1 — Configuración y guardas de producción

### Objetivo

Conseguir que la aplicación falle de forma segura ante configuración incompleta y que ningún modo
comercial se active por accidente.

### Alcance

- Mantener `CHECKOUT_MODE=disabled` como valor seguro por defecto.
- Validar que URL y clave pública de Supabase estén ambas presentes o ambas ausentes.
- Completar `.env.example` con nombres, finalidad y entorno de cada variable, nunca con secretos.
- Distinguir configuración local, preview y producción.
- Confirmar que `shopify` no se puede activar sin configuración completa.
- Documentar cómo ejecutar migraciones y verificaciones sin mostrar credenciales.
- Revisar y clasificar los avisos de seguridad y rendimiento de Supabase.

### Checkpoints

- `C1.1` Configuración ausente produce degradación segura y comprensible.
- `C1.2` Configuración parcial falla con un mensaje accionable.
- `C1.3` Los cuatro modos de checkout tienen tests de contrato.
- `C1.4` Ningún secreto está expuesto al cliente ni versionado.
- `C1.5` Los avisos de Supabase tienen decisión: corregido, aceptado temporalmente o bloqueante.

### Puerta de salida G1

`G1` requiere pruebas automáticas de las combinaciones válidas e inválidas de entorno, build exitoso
y revisión del bundle cliente. Una variable “puesta a mano” sin prueba repetible no supera la puerta.

---

## Fase 2 — Solicitudes, seguridad y continuidad de autenticación

### Objetivo

Cerrar la infraestructura común de comunidad, eventos, radio y mercado antes de seguir construyendo
flujos encima de ella.

### Alcance

- Conservar schemas especializados y canonicalización del servidor.
- Mantener idempotencia por usuario, tipo y referencia.
- Implementar rate limiting por usuario y por origen apropiado al entorno.
- Responder `429` de forma usable, con política de reintento definida.
- Evitar registrar payloads sensibles en logs.
- Guardar una intención pendiente segura antes del login.
- Restaurar el formulario o la acción después de autenticar, con expiración y protección contra
  manipulación.
- Garantizar transacciones atómicas entre solicitud, cambio de estado y auditoría.
- Añadir pruebas de API y repositorio con una base de datos de prueba.

### Checkpoints

- `C2.1` Payload inválido, referencia falsa y usuario anónimo se rechazan correctamente.
- `C2.2` Un reintento no crea duplicados.
- `C2.3` El límite de solicitudes produce `429` sin afectar usuarios distintos.
- `C2.4` Login intermedio conserva y recupera la intención una sola vez.
- `C2.5` Una falla de auditoría revierte la mutación completa.
- `C2.6` Existen pruebas API + DB para los cuatro tipos de solicitud.

### Puerta de salida G2

`G2` se aprueba cuando los seis checkpoints pasan en automatización y el recorrido manual
“acción pública → login → retorno → envío → aparición en admin” funciona para los cuatro dominios.
Mientras falle uno, **ningún dominio posterior puede declararse terminado**.

---

## Fase 3 — Eventos de extremo a extremo

### Objetivo

Hacer que publicación, solicitud, confirmación, lista de espera y check-in formen un único flujo
consistente y auditable.

### Alcance

- Mostrar públicamente solo eventos futuros en estados permitidos.
- Verificar capacidad bajo concurrencia con bloqueo transaccional.
- Mantener la solicitud pública como solicitud, no como reserva prometida.
- Añadir una acción administrativa explícita para confirmar la solicitud y crear el asistente, o
  documentar y probar el mecanismo equivalente.
- Evitar doble confirmación del mismo usuario/evento.
- Mantener estados de evento y asistente con transiciones válidas.
- Añadir filtros por fecha, estado y ciudad en el panel.
- Exponer historial auditable y exportación segura de asistentes.
- Añadir test directo de `Eventos` y E2E de reserva/check-in.

### Checkpoints

- `C3.1` Eventos pasados, cerrados y cancelados no aceptan solicitudes.
- `C3.2` Dos solicitudes concurrentes para el último cupo no generan sobrecupo.
- `C3.3` La lista de espera se activa y se comunica correctamente.
- `C3.4` Confirmar una solicitud crea exactamente un asistente y conserva trazabilidad.
- `C3.5` Ticket inválido, cancelado o reutilizado no permite check-in.
- `C3.6` Panel, filtros, historial y exportación respetan permisos.

### Puerta de salida G3

`G3` requiere un E2E completo con evento abierto, último cupo, espera, confirmación y check-in, más
prueba de concurrencia. No se acepta una validación solo visual.

---

## Fase 4 — Comunidad y consentimiento operable

### Objetivo

Tener una lista de comunidad honesta, administrable y compatible con cambios de consentimiento.

### Alcance

- Decidir y documentar la fuente canónica: `engagement_requests` o `community_members`.
- Evitar listas paralelas o duplicadas.
- Usar siempre el correo de la cuenta autenticada.
- Persistir preferencias y versión/fecha del consentimiento.
- Permitir actualizar preferencias y retirar consentimiento.
- Reflejar los cambios en el panel con auditoría.
- Mantener el lenguaje “comunidad y acceso anticipado”; no prometer un canal no implementado.

### Checkpoints

- `C4.1` La fuente canónica está decidida y no existen dos registros activos para la misma persona.
- `C4.2` Alta, actualización y retiro de consentimiento son idempotentes.
- `C4.3` El panel muestra preferencias, estado y trazabilidad.
- `C4.4` Ninguna comunicación se marca como autorizada después de retirar consentimiento.
- `C4.5` El flujo completo tiene tests de componente, API y DB.

### Puerta de salida G4

`G4` exige demostrar alta, cambio de preferencias y baja usando una misma cuenta, sin duplicados y
con historial auditable.

---

## Fase 5 — Radio: de oportunidad a activación

### Objetivo

Conectar el pipeline comercial ya implementado con la operación real de Radio Origen.

### Alcance

- Mantener el pipeline `new → qualified → proposal → won/lost` con transiciones controladas.
- Evitar oportunidades duplicadas para empresa, contacto y plan equivalentes.
- Al ganar una oportunidad, ofrecer una acción administrativa explícita e idempotente para crear o
  vincular `radio_company` y `radio_channel`.
- Conservar referencia entre oportunidad, empresa, canal y plan.
- No activar cobro ni servicio automáticamente sin confirmación administrativa.
- Mantener la demo local claramente diferenciada de un canal desplegado 24/7.
- Probar permisos y auditoría de cada transición.

### Checkpoints

- `C5.1` Todas las etapas válidas e inválidas tienen tests.
- `C5.2` Repetir una solicitud no crea una segunda oportunidad.
- `C5.3` Convertir una oportunidad ganada crea o vincula una sola empresa y un solo canal.
- `C5.4` Una oportunidad perdida no puede activar servicio.
- `C5.5` Demo, solicitud y activación usan mensajes comerciales veraces.

### Puerta de salida G5

`G5` requiere un E2E desde “Solicitar plan” hasta canal administrativo creado, incluyendo el caso
duplicado y el caso perdido. La existencia del pipeline por sí sola no supera esta puerta.

---

## Fase 6 — Mercado: aprobación y perfil de vendedor

### Objetivo

Convertir una solicitud aprobada en una identidad de vendedor operable, sin cobrar todavía.

### Alcance

- Mantener estados `submitted → review → approved/rejected`.
- Definir transiciones permitidas y motivos obligatorios.
- Evitar solicitudes duplicadas por usuario o marca.
- Al aprobar, crear o vincular de forma idempotente:
  - perfil `vendor`;
  - membresía del usuario;
  - datos básicos de marca, responsable, región y contacto.
- Conservar el vínculo entre solicitud y vendedor.
- Mantener la frase: “USD 10/mes al ser aprobado. Enviar solicitud no genera cobro”.
- Dejar la facturación de suscripción explícitamente fuera de esta fase.

### Checkpoints

- `C6.1` Las transiciones y permisos están probados.
- `C6.2` Aprobar dos veces no duplica vendedor ni membresía.
- `C6.3` Rechazar no crea acceso de vendedor.
- `C6.4` El usuario aprobado puede entrar solo al alcance de su vendedor.
- `C6.5` Solicitud, vendedor y auditoría quedan relacionados.

### Puerta de salida G6

`G6` exige un E2E con una solicitud aprobada y otra rechazada, verificando RBAC, idempotencia y que
no se haya creado ningún cobro.

---

## Fase 7 — Mercado: producto y moderación

### Objetivo

Permitir que un vendedor administre productos completos y que Tueste controle su publicación.

### Alcance

- Modelo de producto con marca, categoría, variedad, proceso, origen, presentación, peso, precio,
  inventario, imágenes, entrega y trazabilidad necesaria.
- Estados mínimos: `draft`, `review`, `published`, `paused`, `archived`.
- El vendedor puede crear y editar únicamente sus borradores.
- Después de enviar a revisión, los cambios sensibles requieren volver a moderación.
- Solo un administrador autorizado publica, pausa o archiva.
- Carga de imágenes validada por tipo, tamaño, propiedad y ruta.
- Todas las mutaciones relevantes quedan auditadas.

### Checkpoints

- `C7.1` Migración, constraints e índices revisados y aplicados.
- `C7.2` Un vendedor no puede leer ni modificar productos de otro vendedor.
- `C7.3` Un borrador incompleto no puede enviarse a revisión.
- `C7.4` Solo un producto aprobado puede quedar publicado.
- `C7.5` Inventario y precio rechazan valores inválidos.
- `C7.6` Imágenes inválidas o ajenas se rechazan.

### Puerta de salida G7

`G7` requiere un E2E con dos vendedores distintos, moderación administrativa y prueba explícita de
aislamiento entre vendedores.

---

## Fase 8 — Mercado: experiencia pública del comprador

### Objetivo

Reemplazar el catálogo demostrativo por una proyección pública real y trazable.

### Alcance

- Leer únicamente productos `published` con vendedor activo.
- Eliminar o aislar los `MERCADO_ITEMS` de demostración del flujo productivo.
- Añadir filtros útiles por categoría, origen y disponibilidad.
- Crear detalle de producto con vendedor, atributos, precio, inventario visible y trazabilidad.
- Mantener “Consultar disponibilidad” como solicitud; no implementar checkout de marketplace ni
  pagos divididos.
- Canonicalizar la referencia desde la base de datos, no desde valores enviados por el navegador.
- Ocultar inmediatamente productos pausados, archivados o sin inventario según la política definida.

### Checkpoints

- `C8.1` Solo aparecen vendedores y productos publicables.
- `C8.2` Filtros y detalle funcionan con URLs reproducibles.
- `C8.3` Una referencia manipulada no produce una solicitud válida.
- `C8.4` Pausar un producto modifica la vista pública conforme a la política.
- `C8.5` La consulta llega al vendedor correcto sin crear compra ni cobro.

### Puerta de salida G8

`G8` requiere un E2E “publicar → encontrar → filtrar → abrir → consultar disponibilidad” y otro
“pausar → desaparecer/bloquear”, usando datos de prueba persistidos.

---

## Fase 9 — Analítica, observabilidad y alertas

### Objetivo

Poder medir el embudo y detectar fallas sin capturar datos personales innecesarios.

### Alcance

- Definir un diccionario estable de eventos, al menos:
  - `cart_opened`;
  - `product_added`;
  - `checkout_started`;
  - `audio_started`;
  - `radio_demo_started`;
  - `event_request_submitted`;
  - `community_joined`;
  - `radio_request_submitted`;
  - `seller_application_submitted`;
  - `market_availability_requested`.
- Definir propiedades permitidas y prohibir email, teléfono, nombre y texto libre.
- Evitar doble conteo por re-render o reintento.
- Registrar errores operativos con correlación, sin payload sensible.
- Crear métricas y alertas para errores de checkout, solicitudes y audio.
- Validar consentimiento y política aplicable antes de activar proveedores externos.

### Checkpoints

- `C9.1` Diccionario versionado con propietario de cada evento.
- `C9.2` Tests garantizan evento único y ausencia de PII.
- `C9.3` Los principales errores de API aparecen en observabilidad.
- `C9.4` Existe un tablero mínimo de conversión y salud.
- `C9.5` Las alertas tienen umbral, destino y procedimiento de respuesta.

### Puerta de salida G9

`G9` exige recorrer los flujos principales y verificar eventos, propiedades y errores en un entorno
de prueba. Ver llamadas en consola no cuenta como observabilidad aprobada.

---

## Fase 10 — QA integral, accesibilidad y regresión visual

### Objetivo

Probar la experiencia completa como sistema antes de conectar el checkout definitivo.

### Alcance

- Completar pruebas unitarias, componentes, integración, API + DB y E2E.
- Ejecutar recorridos de carrito, audio, Barista, eventos, comunidad, Radio y Mercado.
- Validar teclado, foco, lector de pantalla, contraste y reduced motion.
- Probar al menos viewport móvil, tablet y escritorio.
- Establecer capturas de regresión visual para las secciones críticas.
- Probar estados loading, vacío, error, offline, sesión expirada y reintento.
- Revisar rendimiento y estabilidad básica de la página pública.
- Clasificar defectos como P0, P1, P2 o P3.

### Checkpoints

- `C10.1` `npm run verify` pasa desde un checkout limpio.
- `C10.2` Todos los journeys obligatorios pasan en E2E.
- `C10.3` No hay fallas críticas de accesibilidad.
- `C10.4` La regresión visual está revisada y aprobada.
- `C10.5` No existen defectos P0 o P1 abiertos.
- `C10.6` Todo P2/P3 diferido tiene responsable y decisión explícita.

### Puerta de salida G10

`G10` solo se aprueba con cero P0/P1, suite verde, evidencia visual revisada y reporte de
accesibilidad. Un build exitoso por sí solo no habilita Shopify.

---

## Fase 11 — Shopify y checkout final

### Objetivo

Activar Shopify únicamente cuando la experiencia y la operación comercial estén listas.

### Prerrequisitos de entrada

La fase permanece `BLOQUEADA` hasta disponer de:

- productos y variantes definitivos;
- inventario y moneda;
- impuestos y zonas de envío;
- políticas de compra, cambios, privacidad y términos;
- URLs de retorno y cancelación;
- cuenta y credenciales de prueba autorizadas;
- decisión sobre el retiro de Mercado Pago público.

### Alcance

- Implementar el gateway Shopify real sin acoplar la UI al proveedor.
- Mapear cada producto/variante local con su identificador canónico en Shopify.
- Crear checkout alojado con cantidades verificadas en servidor.
- Manejar carrito vacío, producto inexistente, inventario insuficiente, error del proveedor,
  cancelación y retorno.
- Validar webhooks necesarios con firma e idempotencia.
- Mantener `disabled` como fallback operacional.
- Desactivar el gateway público legado solo cuando la migración esté confirmada.

### Checkpoints

- `C11.1` Catálogo local y Shopify tienen mapeo completo y verificable.
- `C11.2` El precio y el inventario usados para cobrar provienen del servidor/proveedor.
- `C11.3` Checkout exitoso, cancelado y fallido tienen E2E.
- `C11.4` Webhooks duplicados no duplican órdenes ni efectos.
- `C11.5` Existe rollback documentado a `CHECKOUT_MODE=disabled`.
- `C11.6` No quedan dos gateways públicos activos por accidente.

### Puerta de salida G11

`G11` requiere compra de prueba completa, conciliación del resultado, validación de webhooks y un
ensayo de rollback. Sin políticas o datos comerciales definitivos, la puerta no puede aprobarse.

---

## Fase 12 — Integración, despliegue y cierre

### Objetivo

Promover el trabajo con trazabilidad y sin mezclar cambios no aprobados.

### Alcance

- Confirmar que el worktree esté limpio y que cada puerta tenga evidencia.
- Actualizar la rama remota mediante `fetch`; no usar `pull` como atajo.
- Revisar la divergencia respecto de la rama objetivo antes de integrar.
- Abrir PR desde `feat/experiencia-functional-hardening` hacia la rama objetivo acordada.
- No fusionar directamente `mockups` ni hacer push directo a `main`.
- Registrar en el PR fecha, SHA y resultado de `npm run verify`.
- Resolver checks y revisión en la rama feature.
- Promover posteriormente hacia `develop` y `main` solo mediante PR aprobado.
- Verificar el SHA desplegado, health checks, journeys críticos y rollback.
- Rotar todas las credenciales temporales antes del lanzamiento real.

### Checkpoints

- `C12.1` Todas las puertas `G0` a `G11` están aprobadas.
- `C12.2` PR contiene únicamente el alcance revisado y no tiene secretos.
- `C12.3` Checks locales/remotos y revisión están aprobados.
- `C12.4` El despliegue corresponde al SHA aprobado.
- `C12.5` Smoke tests de producción pasan.
- `C12.6` Rollback y rotación de credenciales están completados o calendarizados antes de abrir
  tráfico real.

### Puerta de salida G12

`G12` se aprueba cuando el SHA correcto está desplegado, los smoke tests pasan y existe evidencia de
rollback. Solo entonces el plan se marca como `CERRADO`.

---

## Recorridos obligatorios acumulativos

Una fase no puede romper los recorridos aprobados anteriormente. Desde la Fase 3, cada puerta debe
repetir también los recorridos acumulados aplicables:

1. Abrir tienda, añadir producto, cambiar cantidad, recargar y recuperar carrito.
2. Reproducir audio, cambiar señal, recorrer cola, manejar error y retry.
3. Completar Barista, recibir recomendación, ajustar receta y usar temporizador.
4. Solicitar evento después de login, confirmar cupo y hacer check-in.
5. Unirse a comunidad, cambiar preferencias y retirar consentimiento.
6. Solicitar Radio, mover pipeline y convertir oportunidad ganada.
7. Solicitar vendedor, aprobar, crear producto, moderar y publicar.
8. Encontrar producto público y solicitar disponibilidad.
9. Iniciar checkout Shopify, completar/cancelar y reconciliar resultado.

## Regla de bloqueo y decisiones

Una dependencia externa no se resuelve inventando valores. Si faltan políticas, catálogo, precios,
credenciales, propietario de una alerta o decisión comercial:

1. marcar la fase `BLOQUEADA`;
2. registrar exactamente qué falta;
3. identificar quién puede decidirlo;
4. continuar solo con trabajo interno de la misma fase que no dependa de esa decisión;
5. no abrir la fase siguiente.

## Definición global de terminado

El plan completo solo está terminado cuando:

- todas las puertas `G0` a `G12` están `APROBADAS`;
- no existen defectos P0/P1;
- migraciones locales y remotas coinciden;
- el repositorio y el despliegue apuntan a SHAs identificados;
- no hay secretos versionados;
- la operación puede desactivar checkout y revertir despliegue;
- las credenciales temporales fueron rotadas antes del lanzamiento;
- producto, ingeniería y operación aceptaron la evidencia final.
