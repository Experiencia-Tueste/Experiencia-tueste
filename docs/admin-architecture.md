# Arquitectura y plan rector del panel administrativo de Tueste

**Estado:** documento canónico de planificación  
**Versión:** 1.0  
**Fecha:** 2026-08-28  
**Aplicación:** /Users/santiagopalacio/Downloads/tueste/tueste-app-admin

> Este documento es la fuente de verdad para construir el panel. El mockup
> del cliente define el alcance funcional y la experiencia esperada; este
> documento define cómo convertirlo en un sistema real, seguro y mantenible.
> Si una tarea no aparece aquí o no actualiza este documento, no se inicia.

## 1. Objetivo

Construir un panel privado para que el equipo de Tueste pueda operar el
ecosistema completo desde una sola aplicación:

- contenido editorial y lanzamientos;
- Tueste Tree y seguimiento de adopciones;
- finca y comunicaciones de cumplimiento;
- pedidos, tienda y vendedores;
- clientes, leads y servicios B2B;
- Radio Origen;
- comunidad y moderación;
- eventos, boletería, asistentes y backstage;
- analítica operativa;
- usuarios, permisos, auditoría y configuración.

El panel no reemplaza la tienda pública ni duplica sistemas que ya tienen una
fuente de verdad externa.

## 2. Fuente de verdad y límites

### 2.1 Responsabilidades del panel

El panel es la fuente de verdad para:

- identidad, roles, permisos y estado de acceso del equipo;
- decisiones operativas internas;
- contenidos en borrador, revisión y publicación;
- relaciones con clientes y organizaciones B2B;
- lotes, adopciones y actualizaciones de finca cuando el modelo esté aprobado;
- reservas, asistentes, check-in y solicitudes de acceso;
- vendedores, fichas editoriales y leads asignados;
- moderación y trazabilidad de acciones administrativas;
- configuración propia del ecosistema que no pertenezca a otro proveedor.

### 2.2 Responsabilidades de proveedores externos

| Área                                      | Fuente de verdad                               | Uso del panel                                            |
| ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Identidad de acceso                       | Google OAuth + base privada de Tueste          | Google identifica; Tueste autoriza                       |
| Catálogo, carrito y checkout              | Shopify                                        | Consulta, sincronización y enlaces; no duplicar checkout |
| Pagos, envíos, devoluciones y facturación | Shopify o proveedor aprobado                   | Solo lectura operativa hasta definir integración         |
| Archivos multimedia                       | Storage aprobado                               | Metadatos en PostgreSQL y URLs firmadas                  |
| Mensajería                                | WhatsApp/proveedor aprobado                    | Abrir conversaciones y registrar la actividad            |
| Analítica pública                         | Instrumentación del sitio + proveedor aprobado | Mostrar eventos y métricas agregadas                     |
| OAuth de Google                           | Google Cloud                                   | Credenciales server-only; nunca en el navegador          |

Reglas:

1. No se crea una segunda tienda dentro del panel.
2. No se guardan claves de proveedores en tablas de negocio.
3. Una integración se implementa detrás de un adaptador y con pruebas de
   contrato.
4. Los datos externos se identifican mediante un externalId y se sincronizan
   de forma idempotente.
5. Cuando exista una discrepancia entre una proyección local y el proveedor,
   se conserva el dato externo como referencia y se registra la incidencia.

## 3. Alcance funcional del mockup

El mockup del cliente se convierte en estos módulos de producto. Los textos,
arreglos demo, toasts y botones simulados del HTML son referencia visual; no
son datos ni lógica de producción.

| Módulo               | Ruta propuesta       | Funcionalidad mínima                                       |
| -------------------- | -------------------- | ---------------------------------------------------------- |
| Resumen              | /admin               | KPIs, alertas, actividad reciente y accesos por permiso    |
| Tueste Tree          | /admin/adopciones    | Adoptantes, lotes, árboles, canales y exportación          |
| Cumplimiento y finca | /admin/cumplimiento  | Línea de actualizaciones, envíos y estado por lote         |
| Pedidos y tienda     | /admin/pedidos       | Pedidos Shopify, filtros, sincronización y atención        |
| Mercado y vendedores | /admin/mercado       | Vendedores, productos, stock editorial y consultas         |
| Radio Origen B2B     | /admin/radio         | Empresas, planes, canales y suscripciones                  |
| Tueste Unity         | /admin/unity         | Paquetes, leads, propuestas, seguimiento y cierre          |
| Comunidad / TuesteX  | /admin/comunidad     | Miembros, publicaciones, reportes y moderación             |
| Subastas             | /admin/subastas      | Lotes, ofertas y cierre, solo después de aprobación legal  |
| Backstage            | /admin/backstage     | Solicitudes, aprobación, pases y control de acceso         |
| Contenido            | /admin/contenido     | Entradas, lanzamientos, pistas, activos y estados          |
| Boletería y eventos  | /admin/eventos       | Eventos, reservas, asistentes, QR y check-in               |
| Embudo y analítica   | /admin/analitica     | Eventos ot_*, embudo, fuentes y métricas                   |
| Usuarios y roles     | /admin/usuarios      | Invitaciones, activación, suspensión y asignación de roles |
| Configuración        | /admin/configuracion | Marca, contactos, integraciones y cupones                  |
| Auditoría            | /admin/auditoria     | Historial append-only, filtros y consulta autorizada       |

### 3.1 Funcionalidades del mockup que deben conservarse

#### Resumen

- Árboles adoptados.
- Ingreso del mes y desglose por brazo.
- Leads B2B activos.
- Miembros de comunidad.
- Atención pendiente.
- Actividad reciente.
- Vista específica para vendedor: ventas, comisión, leads, productos y tareas.

#### Tueste Tree y cumplimiento

- Adoptantes recientes, lote, árbol, canal, fecha y estado.
- Registro y exportación de adopciones.
- Copia visible que indique que la adopción es simbólica y no una inversión.
- Actualizaciones de finca en ventanas de 0 a 48 horas, primer mes y trimestre.
- Registro de cuándo una comunicación fue preparada, enviada y por quién.

#### Pedidos, mercado y vendedores

- Pedidos con referencia Tueste y número Shopify.
- Estados Nuevo, Confirmado, Enviado y Entregado.
- Filtros por estado y canal.
- Sincronización explícita con Shopify.
- Vendedores, productos, disponibilidad, stock, fotos y consultas.
- Vista limitada del vendedor a sus propios productos, pedidos, comisión y leads.

#### B2B, Radio y Unity

- Empresas y suscripciones de Radio Origen.
- Planes Signal Base y Signal Pro, cuando estén definidos comercialmente.
- Paquetes de Unity: firma sonora, co-branding cafetero, contenido, playlists
  y música personalizada.
- Leads, cotizaciones, propuestas, actividades, ganados y perdidos.
- Acción para generar propuesta y enlace de contacto por WhatsApp.

#### Comunidad, eventos, backstage y subastas

- Miembros activos y cola de moderación.
- Eventos con fecha, ciudad, capacidad, precio y estado.
- Reservas, asistentes, exportación y check-in.
- QR de check-in vinculado a la activación de la experiencia Tree, si el flujo
  legal y operativo lo aprueba.
- Solicitudes de backstage, aprobación, rechazo, pase y estado del acceso.
- Ofertas y cierre de subastas únicamente cuando existan reglas comerciales,
  pagos, impuestos, términos y revisión legal aprobados.

#### Contenido, usuarios, configuración y analítica

- Entradas editoriales y lanzamientos con portada, pistas y programación.
- Usuarios invitados, activos o suspendidos.
- Permisos efectivos derivados en servidor.
- Nombre público, empresa, NIT, correos y WhatsApp operativo.
- Conexiones con Shopify, analítica y otros proveedores sin exponer secretos.
- Cupones: la fuente de verdad será Shopify si son descuentos de tienda.
- Eventos ot_page_view, ot_play_first, ot_track_change, ot_senal_on,
  ot_senal_channel, ot_carta_barista, ot_brew_start, ot_brew_complete,
  ot_merch_view, ot_add_cart, ot_cart_open, ot_wa_pedido, ot_tree_interest y
  ot_wa_evento, sujetos a consentimiento y política de privacidad.

## 4. Arquitectura técnica

```text
Navegador del panel
  -> App Router de Next.js
  -> Server Component o Server Action / Route Handler
  -> sesión Auth.js
  -> capacidad y alcance de datos
  -> validación Zod
  -> servicio de dominio
  -> repositorio server-only
  -> PostgreSQL privado + Storage + adaptadores externos
  -> auditoría append-only en la misma transacción
```

### 4.1 Capas y responsabilidades

| Capa          | Ubicación esperada                     | Responsabilidad                                                  |
| ------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Interfaz      | src/app/admin y componentes del módulo | Formularios, tablas, filtros, estados y accesibilidad            |
| Acciones      | actions.ts por módulo                  | Recibir FormData, autorizar, validar y devolver resultado seguro |
| Dominio       | src/features/<dominio>                 | Tipos, schemas, casos de uso, estados y reglas puras             |
| Persistencia  | src/db/schema y repositorios           | Drizzle, consultas, transacciones y mapeo de filas               |
| Integraciones | src/integrations/<proveedor>           | Shopify, Storage, WhatsApp y analítica                           |
| Configuración | src/lib/config                         | Variables públicas y server-only con contrato único              |
| Seguridad     | src/lib/auth y src/lib/security        | Sesión, capacidades, headers, límites y errores                  |

Principios obligatorios:

1. El servidor es la autoridad. Ocultar un botón no es autorización.
2. Cada mutación sigue el orden sesión → capacidad → alcance → Zod →
   transacción → auditoría → respuesta.
3. Un componente cliente nunca importa un módulo server-only.
4. Las acciones devuelven errores seguros y estructurados, sin secretos,
   SQL, tokens ni mensajes de drivers.
5. Los servicios de dominio no conocen detalles de React.
6. Los repositorios no deciden permisos; reciben un actor ya autorizado y un
   alcance explícito.
7. Las lecturas grandes usan paginación, filtros y ordenamiento server-side.
8. Las mutaciones destructivas se reemplazan por archivado o suspensión,
   salvo una excepción documentada y auditada.

## 5. Identidad, roles y autorización

### 5.1 Autenticación

- Google OAuth/OIDC mediante Auth.js.
- Google únicamente confirma la identidad.
- El acceso requiere usuario persistente activo y rol persistente.
- Fallos de sesión, base de datos o configuración cierran el acceso.
- La sesión no contiene permisos como autoridad definitiva; se resuelven en
  el servidor desde la identidad persistida.

### 5.2 Roles canónicos

Se conserva el modelo granular actual y se añade el alcance comercial
necesario para vendedores:

| Rol persistente | Equivalencia en el mockup | Uso                                                             |
| --------------- | ------------------------- | --------------------------------------------------------------- |
| owner           | Admin principal           | Todo el sistema, seguridad, configuración y usuarios            |
| admin           | Admin                     | Operación completa sin administrar owners ni políticas críticas |
| editor          | Equipo editorial          | Contenido, lanzamientos y activos                               |
| operador        | Equipo operativo          | CRM, Tree, pedidos y eventos asignados                          |
| moderador       | Equipo de comunidad       | Moderación y miembros                                           |
| lector          | Consulta                  | Lectura explícitamente asignada                                 |
| vendedor        | Vendedor                  | Solo tienda, pedidos, comisión y leads propios                  |

El rol vendedor requiere una migración posterior porque el esquema actual
declara seis roles. Además del rol, cada vendedor tendrá una relación explícita
con una entidad Vendor. Nunca se filtrarán sus datos únicamente en el cliente.

“Equipo” es una etiqueta de negocio, no un permiso amplio automático. Una
persona del equipo recibe uno o varios roles según su trabajo real; las
capacidades efectivas son la unión de sus roles.

### 5.3 Capacidades objetivo

Las capacidades se mantienen como fuente única en código y se amplían por
dominio:

| Familia    | Capacidades objetivo                                        |
| ---------- | ----------------------------------------------------------- |
| Plataforma | admin.access, users.manage, config.manage, audit.read       |
| Contenido  | content.read, content.edit, content.review, content.publish |
| CRM        | crm.read, crm.manage, crm.export                            |
| Pedidos    | orders.read, orders.manage, orders.sync                     |
| Vendedores | market.read, market.manage, market.self                     |
| Tree       | tree.read, tree.update, tree.export                         |
| Eventos    | events.read, events.manage, events.checkin, events.export   |
| B2B        | unity.read, unity.manage, radio.read, radio.manage          |
| Comunidad  | community.read, community.moderate                          |
| Backstage  | backstage.read, backstage.manage                            |
| Subastas   | auctions.read, auctions.manage                              |
| Analítica  | analytics.read, analytics.export                            |

La lista se implementará solo cuando el módulo correspondiente entre en una
fase. No se agregan capacidades sin una pantalla, una acción y una prueba que
las utilicen.

### 5.4 Alcance por registro

La capacidad no siempre significa acceso global:

- vendedor solo consulta registros con su vendorId;
- operador puede limitarse a eventos, lotes o leads asignados;
- moderador no ve datos comerciales innecesarios;
- exportaciones verifican capacidad y alcance antes de generar el archivo;
- el filtro por usuario se aplica en el repositorio o consulta SQL, nunca
  después de traer todos los datos al navegador.

## 6. Modelo de datos por dominio

Todas las tablas de administración viven en el schema privado private. Los
nombres siguientes son el mapa conceptual; cada grupo se convierte en una
migración versionada solo al comenzar su fase.

### 6.1 Identidad y auditoría

- AdminUser: email normalizado, nombre, estado, fechas de acceso.
- AdminRole: clave, nombre y descripción.
- AdminUserRole: relación usuario-rol.
- AuditLog: actor, acción, objeto, razón, metadata segura y fecha.

La auditoría es append-only. Toda mutación relevante registra actor, objetivo,
resultado y razón; los fallos de proveedor registran una incidencia segura sin
guardar secretos.

### 6.2 Contenido y multimedia

- Asset: clave de Storage, nombre, MIME, tamaño, alt text, estado y actor.
- ContentEntry: título, slug, cuerpo, versión, estado y fechas editoriales.
- Release: álbum, EP, single o lanzamiento con estado y portada.
- Track: pista, orden, duración, frecuencia y asset de audio.
- ContentSchedule: programación de publicación, zona horaria y estado.

Estados base:

- contenido: draft → review → published → archived;
- asset: pending → approved → archived.

### 6.3 Tueste Tree y finca

- Farm y FarmLot: finca, lote, cosecha y datos de referencia.
- TreeSlot: identificador simbólico del árbol o unidad adoptable.
- Adoption: adoptante, lote, canal, fecha, estado y comprobantes.
- FarmUpdate: actualización por ventana y lote.
- ComplianceDelivery: comunicación, destinatario, fecha, estado y actor.
- Certificate: certificado o evidencia editorial vinculada a una adopción.

El sistema no crea instrumentos financieros ni promete rentabilidad.

### 6.4 CRM, Unity y Radio

- Organization: empresa, datos comerciales y estado.
- Contact: persona, organización, canales y consentimiento.
- Lead: origen, responsable, etapa, prioridad y siguiente actividad.
- Activity: llamada, WhatsApp, nota, tarea o cambio de etapa.
- Proposal: versión, paquete, monto si aplica, estado y aprobación.
- UnityPackage: paquete comercial versionado.
- RadioChannel: canal y programación.
- RadioPlan: plan comercial.
- RadioSubscription: organización, plan, estado y fechas.

Los números telefónicos y correos se tratan como datos personales; se
minimizan en listados, se restringen por rol y no se exponen en logs.

### 6.5 Pedidos, tienda y vendedores

- Vendor: vendedor, estado, datos operativos y configuración de comisión.
- VendorMembership: relación usuario-vendedor.
- Listing: ficha editorial, referencia externa, disponibilidad y estado.
- OrderSnapshot: proyección mínima de Shopify con externalId y timestamps.
- OrderAssignment: vendedor o miembro responsable, si aplica.
- ProductMedia: relación de fichas con assets aprobados.
- AvailabilityInquiry: consulta de disponibilidad o interés.

Shopify conserva catálogo, inventario transaccional, pagos y fulfillment. El
panel puede administrar metadatos internos y visualizar una proyección, pero no
inventará un segundo stock ni marcará como pagado un pedido localmente.

### 6.6 Eventos, boletería y backstage

- Event: título, tipo, fecha, ciudad, capacidad, precio de referencia y estado.
- TicketType: categoría, cupo y reglas.
- Reservation: contacto, ticket, estado y externalId si existe.
- Attendee: asistente, consentimiento y estado de asistencia.
- Checkin: evento, asistente, fecha, actor y método.
- BackstageRequest: solicitud, rango, estado y motivo.
- AccessPass: pase, evento, asistente, expiración y estado.

Estados mínimos:

- evento: draft → published → closed → completed/cancelled;
- solicitud: pending → approved/rejected/revoked;
- asistencia: reserved → checked_in/no_show/cancelled.

### 6.7 Comunidad, subastas y analítica

- CommunityMember: perfil administrativo mínimo, estado y nivel.
- CommunityPost y CommunityComment: contenido y estados de moderación.
- ModerationCase: reporte, decisión, moderador y razón.
- Auction y AuctionLot: lote, reglas, inicio, cierre y estado.
- Bid: oferta, actor, valor y timestamps, con idempotencia.
- AnalyticsEvent: nombre, fecha, sesión anónima, ruta y metadata permitida.
- AnalyticsDailyMetric: agregados para dashboard sin datos personales crudos.

Subastas permanecen bloqueadas hasta aprobar legal, pagos, impuestos,
términos, anti-fraude y política de disputas.

### 6.8 Configuración

- OrganizationSettings: marca, nombre público, NIT, contactos y WhatsApp.
- IntegrationSettings: proveedor, estado, última sincronización y referencia;
  nunca secretos en texto plano.
- CouponReference: referencia a descuento de Shopify y estado de lectura.
- FeatureFlag: activación progresiva de módulos, con auditoría.

Los cupones de tienda no se duplican. Si se habilita creación desde el panel,
será una acción explícita del adaptador Shopify con permiso, confirmación y
auditoría.

## 7. Contrato común de los módulos

Cada módulo se implementa como una rebanada vertical completa:

1. Definir entidades, estados, invariantes y fuente de verdad.
2. Crear schemas Zod de entrada y salida.
3. Crear migración Drizzle revisable.
4. Crear repositorio server-only con consultas paginadas.
5. Crear servicio de dominio con autorización y transacciones.
6. Crear acciones o Route Handlers con errores seguros.
7. Registrar auditoría en mutaciones.
8. Crear interfaz con estados vacío, carga, error, éxito y sin permiso.
9. Añadir pruebas unitarias, de repositorio, autorización y flujo.
10. Probar manualmente el flujo con cada rol afectado.

Una acción mutadora debe devolver un resultado equivalente a:

- éxito: identificador y mensaje seguro;
- validación: errores por campo;
- no autenticado: redirección o 401;
- sin permiso: 403;
- registro inexistente: 404;
- conflicto de estado o externalId: 409;
- proveedor no disponible: error operativo genérico y auditoría de incidencia.

## 8. UI y experiencia

El shell del panel debe ser único para todas las rutas:

- navegación lateral basada en capacidades;
- identidad del usuario y cierre de sesión;
- breadcrumbs o título consistente;
- tarjetas KPI reutilizables;
- tablas con filtros, paginación y estados;
- formularios con validación accesible;
- confirmación para acciones irreversibles o externas;
- feedback no destructivo y mensajes en español;
- diseño responsive para operación desde portátil y móvil;
- foco visible, labels, navegación por teclado y contraste suficiente.

El mockup puede orientar tipografía, color, jerarquía y copy, pero no autoriza
a mantener datos ficticios, roles simulados ni acciones que solo disparen un
toast.

## 9. Seguridad, privacidad y operación

- Variables secretas solo server-side; nunca prefijo NEXT_PUBLIC_.
- PostgreSQL administrativo en private, sin exposición Data API pública.
- Consultas parametrizadas mediante Drizzle.
- Validación de MIME, tamaño, nombre y contenido antes de aceptar archivos.
- URLs firmadas con expiración corta.
- Protección CSRF integrada en las mutaciones de la aplicación.
- Rate limit por sesión/IP para login, exportaciones y endpoints sensibles.
- Paginación obligatoria en listados y límites de payload.
- Logs sin contraseñas, tokens, URLs de conexión, cookies ni PII innecesaria.
- Exportaciones auditadas y, cuando sea necesario, con expiración.
- Backups y recuperación definidos antes de producción.
- Cambios de esquema únicamente mediante migraciones versionadas.

## 10. Roadmap fijo

El orden siguiente es el orden de implementación. Una fase no se considera
terminada por tener una pantalla; debe cumplir su puerta de salida.

### Fase 0 — Arquitectura y contrato

**Estado:** este documento.

Entregables:

- alcance del mockup inventariado;
- fuentes de verdad y límites;
- roles, capacidades y scopes;
- dominios y entidades;
- roadmap y criterios de terminado.

Puerta de salida: no se empieza un módulo sin registrar su entidad, permisos,
fuente de verdad, estados y criterio de aceptación.

### Fase 1 — Fundación segura

**Estado:** implementada en gran parte.

Incluye:

- Google OAuth con Auth.js;
- usuario persistente activo;
- RBAC server-side;
- PostgreSQL privado con Drizzle;
- bootstrap idempotente;
- auditoría append-only;
- fallo cerrado;
- headers y límites base;
- npm run verify limpio.

Pendientes de consolidación:

- documentar la migración de vendedor;
- evitar que existan capacidades declaradas pero no usadas;
- completar pantalla de usuarios y pantalla de auditoría.

### Fase 2 — Shell y plataforma administrativa

**Estado:** implementada la base del shell; dominios operativos todavía
pendientes.

Entregables:

- layout interno reutilizable;
- menú por capacidades;
- dashboard sin datos ficticios;
- navegación de todas las rutas del panel;
- estados de carga, error, vacío y acceso denegado;
- componentes de tabla, formulario, modal de confirmación y feedback;
- convenciones de paginación y filtros.

Puerta de salida: cada rol ve únicamente módulos permitidos y ninguna ruta
protegida depende de un chequeo solo visual.

Implementado en esta entrega:

- shell común en AdminShell;
- navegación canónica filtrada por capacidades;
- capacidades objetivo registradas en el contrato de permisos;
- rutas protegidas para todos los módulos del mockup;
- estado vacío honesto para módulos sin persistencia;
- pruebas de navegación por capacidades;
- lint, formato, typecheck, 60 archivos de pruebas, 405 tests y build
  verificados.

La fase se cierra completamente cuando el dashboard y los componentes
reutilizables de tabla, filtros, formularios, carga y error estén conectados a
los primeros dominios reales.

### Fase 3 — Contenido, lanzamientos y Storage

Entregables:

- terminar entradas y lanzamientos;
- editor de contenido;
- gestión de pistas;
- biblioteca de assets;
- Storage real y URLs firmadas;
- revisión, publicación, archivado y programación;
- conexión con la superficie pública sin deploy manual.

Puerta de salida: un editor prepara contenido, un admin publica y cada cambio
queda auditado; no hay arrays demo.

Estado de implementación:

- entradas editoriales conectadas a PostgreSQL privado, con edición de título,
  slug y cuerpo;
- creación, revisión, publicación y archivado de entradas auditadas;
- lanzamientos conectados a PostgreSQL privado, con portada opcional y pistas;
- creación, revisión, publicación y archivado de lanzamientos auditados;
- biblioteca de assets conectada a PostgreSQL privado;
- registro, aprobación y archivado de assets auditados;
- integración Supabase Storage aislada en `src/integrations/storage`, con
  proveedor server-only, generación de claves estables y URLs firmadas;
- subida directa de archivos desde el panel mediante token firmado temporal;
- Storage queda opcional hasta configurar `SUPABASE_STORAGE_URL`,
  `SUPABASE_STORAGE_ADMIN_KEY` y `SUPABASE_STORAGE_BUCKET` en el entorno
  privado.

Pendiente de esta fase:

- crear el bucket privado y configurar credenciales de Storage en el entorno;
- programación temporal de publicación;
- conexión de la superficie pública a los contenidos publicados.

### Fase 4 — Usuarios, configuración y auditoría visible

Entregables:

- invitar usuario;
- activar, suspender y reactivar;
- asignar múltiples roles;
- crear relación vendedor-usuario;
- gestionar capacidades por rol sin permisos arbitrarios en navegador;
- consultar auditoría con filtros;
- configuración de marca y contactos;
- referencias de integraciones y cupones.

Puerta de salida: se puede operar el equipo sin bootstrap manual y cada acción
administrativa sensible tiene trazabilidad.

### Fase 5 — CRM, Unity, pedidos y vendedores

Entregables:

- organizaciones, contactos, leads y actividades;
- paquetes y propuestas de Unity;
- enlaces de WhatsApp con registro de actividad;
- proyección de pedidos Shopify;
- filtros, estados y sincronización idempotente;
- vendedores, fichas, stock editorial y assets;
- vista global para admin y vista propia para vendedor.

Puerta de salida: los datos de Shopify no se contradicen, los vendedores no
pueden consultar registros ajenos y los leads tienen responsable y siguiente
acción.

### Fase 6 — Tueste Tree, cumplimiento, eventos y backstage

Entregables:

- lotes, slots y adopciones simbólicas;
- actualizaciones y comunicaciones de finca;
- eventos, tipos de entrada, reservas y asistentes;
- QR/check-in;
- solicitudes y pases backstage;
- exportaciones auditadas;
- copias legales aprobadas.

Puerta de salida: un operador puede seguir una adopción o evento de principio
a fin sin inventar datos financieros ni depender de memoria o hojas externas.

### Fase 7 — Mercado ampliado, Radio y comunidad

Entregables:

- flujo de consultas de Mercado;
- planes, canales y suscripciones de Radio;
- miembros, publicaciones, reportes y moderación;
- métricas operativas de estos módulos;
- permisos específicos por dominio.

Puerta de salida: cada módulo tiene ciclo de estados, responsables,
auditoría y pruebas de alcance.

### Fase 8 — Analítica y dashboard ejecutivo

Entregables:

- recepción de eventos ot_* con contrato;
- consentimiento y minimización;
- embudo y fuentes;
- métricas agregadas por periodo;
- dashboard conectado a consultas reales;
- exportaciones autorizadas.

Puerta de salida: los KPIs del resumen se calculan desde datos reales y se
puede explicar de dónde sale cada número.

### Fase 9 — Subastas y automatizaciones especiales

**Condicionada:** no comienza por calendario; comienza solo con aprobación.

Requisitos previos:

- términos legales;
- reglas de oferta y cierre;
- proveedor de pagos;
- impuestos y facturación;
- prevención de fraude;
- disputas y reembolsos;
- webhooks e idempotencia;
- revisión de seguridad.

Sin estos requisitos, Subastas permanece como consulta o prototipo no
operativo.

### Fase 10 — Producción

Entregables:

- variables del hosting configuradas;
- dominio y callback de Google;
- migraciones aplicadas y verificadas;
- Storage e integraciones con credenciales seguras;
- backup y recuperación probados;
- observabilidad y alertas;
- revisión de permisos con matriz de roles;
- prueba smoke de cada ruta;
- despliegue controlado y rollback documentado.

## 11. Criterios de terminado globales

El panel se considera terminado para una fase únicamente cuando:

- la función está conectada a persistencia real;
- no utiliza datos demo como fuente de verdad;
- tiene autorización server-side y, cuando aplica, scope por registro;
- valida entradas con Zod;
- registra auditoría en mutaciones relevantes;
- maneja estados vacío, error, carga, éxito y conflicto;
- tiene pruebas de negocio y permisos;
- tiene migración revisada;
- pasa lint, formato, typecheck, tests y build;
- la documentación de la fase está actualizada;
- se probó con los roles afectados;
- no introduce secretos ni dependencias innecesarias.

## 12. Reglas contra código innecesario

Antes de implementar cualquier tarea se debe responder:

1. ¿Qué módulo y requisito de este documento satisface?
2. ¿Qué entidad o fuente de verdad usa?
3. ¿Qué capacidad y scope necesita?
4. ¿Qué mutación, auditoría y prueba agrega?
5. ¿Reutiliza una abstracción existente?
6. ¿Qué parte del mockup reemplaza?
7. ¿Qué dependencia externa introduce y por qué?

No se acepta:

- copiar el HTML del mockup como sistema de producción;
- duplicar tipos, validaciones, roles o clientes de base de datos;
- crear una ruta sin servicio y prueba de autorización;
- agregar una tabla sin estado, índice, relación y migración justificada;
- meter lógica de negocio dentro de componentes visuales;
- integrar un proveedor antes de definir su adaptador y fuente de verdad;
- crear un KPI que no tenga consulta reproducible;
- añadir una capacidad que ninguna acción comprueba;
- mantener un botón que solo cambia un arreglo en memoria;
- crear pagos, subastas o promesas financieras sin aprobación formal.

## 13. Estado actual y siguiente trabajo aprobado

### Ya existe

- autenticación Google;
- RBAC persistente y bootstrap del primer administrador;
- cliente PostgreSQL server-only;
- tablas de identidad y auditoría;
- contratos de auditoría;
- contratos y persistencia inicial de contenido;
- ruta protegida /admin/contenido;
- pruebas de autorización, contenido, auditoría y build.

### Parcial

- dashboard con identidad y estado de fundación;
- shell y navegación por capacidades;
- programación de contenido;
- configuración operativa de Storage;
- documentación de integración.

### Pendiente

- matriz completa de capacidades;
- migración y relación del rol vendedor;
- layout compartido;
- usuarios y auditoría visible;
- módulos operativos del mockup;
- adaptador Shopify;
- conexión pública de contenido publicado;
- eventos, comunidad, Radio, Unity, backstage y analítica;
- subastas y pagos condicionados;
- preparación de producción.

### Próxima entrega, sin ampliar alcance

La siguiente entrega debe cerrar los pendientes de **Fase 3** antes de saltar a
otros módulos, con este orden:

1. mantener configurado el bucket privado de Storage para staging;
2. completar programación temporal de publicación;
3. conectar la superficie pública a contenido publicado;
4. conservar /admin/contenido como primera rebanada vertical de referencia.

No se implementarán todavía pagos, subastas operativas ni integraciones que no
tengan contrato y credenciales aprobadas.

## 14. Documentos relacionados

- [Estado histórico y contrato inicial del panel](./admin-panel.md)
- [Base de datos administrativa](./database-admin.md)
- [Guía de CI local](./ci-local.md)

Cuando otro documento contradiga este plan, primero se actualiza este archivo
y luego se ajusta el documento secundario. Este archivo no debe convertirse en
un registro de decisiones contradictorias: las decisiones superadas se
resumen aquí con su estado actual y se eliminan las instrucciones obsoletas de
los documentos operativos.
