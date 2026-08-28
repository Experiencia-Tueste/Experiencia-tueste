# Panel administrativo de Tueste — historial y estado de implementación

> El plan rector actual está en
> [docs/admin-architecture.md](./admin-architecture.md). Este documento
> conserva el contrato y el historial de las fases ya implementadas; no debe
> usarse para decidir nuevas funcionalidades si contradice el documento
> rector.

## Estado actual (una sola fuente de verdad)

- **RBAC persistente implementado**: acceso por usuario `active` con rol
  en PostgreSQL; capacidades por rol (y unión si hay varios roles).
- **Fase 2 parcialmente implementada**: contratos Zod, repositorio y
  servicio de contenido, ruta `/admin/contenido` (listado y transiciones
  con auditoría append-only en transacciones).
- **Migración de contenido (`0001_blue_tarantula.sql`) generada y
  revisada**; se aplica manualmente con `npm run db:migrate` cuando se
  confirme.
- **Pendiente todavía**: Storage real (URLs firmadas), biblioteca
  multimedia completa, editor de contenido completo y gestión de pistas.

## 1. Propósito y alcance

El panel es una aplicación **privada para el equipo Tueste**, no una nueva
tienda. Durante desarrollo vivirá bajo `/admin`; en producción se contempla
`admin.tueste.shop`, con autenticación obligatoria.

Este documento convierte el mockup editorial de José en una base técnica para
un panel interno. Define qué puede administrar el equipo, qué datos necesita
cada módulo y el orden seguro para construirlo. No habilita pagos ni duplica
operaciones de Shopify.

## 2. Qué administra el panel

- **Contenido**: contenido editorial, álbumes, pistas, activos multimedia y sus
  enlaces externos.
- **CRM B2B**: contactos, organizaciones, solicitudes por WhatsApp, reservas y
  seguimiento comercial.
- **Eventos**: cupos de referencia, reservas, asistentes y comunicación
  operativa.
- **Tueste Tree**: lotes, árboles, actualizaciones de cultivo, certificados y
  solicitudes de adopción cuando el modelo legal esté aprobado.
- **Mercado de Origen**: vendedores, fichas editoriales, disponibilidad e
  inquiries; sin checkout.
- **Radio Origen**: canales, programación y estado de suscripciones cuando el
  servicio entre en operación.
- **Comunidad y analítica**: moderación de comunidad y vista de métricas
  operativas.

## 3. Qué queda explícitamente en Shopify

- Catálogo comercial, inventario, carrito, checkout, pagos, envíos,
  devoluciones y órdenes de **Shopify**.
- Shopify sigue siendo la **fuente de verdad** de Tienda Tueste Co.
- El panel solo podrá mostrar en el futuro un enlace o resumen de lectura,
  nunca duplicar la operación ni escribir en Shopify.

Fuera del panel en esta etapa:

- Cobros reales, Mercado Pago, facturación, retiros o subastas reales.
- Declaraciones de participación financiera, equity, retorno o inversión en
  Tueste Tree. Hasta contar con revisión legal, Tree se expresa como adopción
  simbólica y experiencia de comunidad.
- Roles elegidos únicamente en el navegador, datos demo como fuente de verdad
  o acciones que dependan de `localStorage`.

## 4. Autenticación y autorización

### Propuesta: Google OAuth/OIDC con Auth.js

La primera integración será **Google OAuth/OIDC mediante Auth.js**, pero Google
solamente identifica a la persona. **Tueste decide los permisos** en su propia
base de datos, verificados del lado del servidor en cada Route Handler y Server
Action.

El acceso lo decide el **RBAC persistente**: un usuario debe existir en
`private.admin_users` con estado `active` y al menos un rol. (La allowlist
`ADMIN_ALLOWED_EMAILS` fue una etapa intermedia de la Fase 1.1 y ya no se
consulta.)

### Variables futuras (sin valores; nunca con prefijo `NEXT_PUBLIC_`)

```text
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

### Roles iniciales y responsabilidades

| Rol         | Alcance                                                                               | No puede hacer                                                       |
| ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `owner`     | Configuración sensible, usuarios, roles, auditoría y todos los módulos.               | Borrar trazas de auditoría.                                          |
| `admin`     | Operación completa de módulos autorizados y publicación de contenido.                 | Administrar owners o cambiar políticas de seguridad.                 |
| `editor`    | Crear, editar y preparar contenido, lanzamientos, eventos y activos.                  | Publicar sin aprobación, ver datos sensibles o administrar usuarios. |
| `operador`  | Atender solicitudes, actualizar Tree/mercado/radio y consultar operaciones asignadas. | Cambiar roles, configuración global o pagos.                         |
| `moderador` | Revisar y moderar comunidad.                                                          | Gestionar datos comerciales, roles o configuración.                  |
| `lector`    | Consulta de métricas y datos explícitamente asignados.                                | Crear, editar o borrar información.                                  |

### Permisos por capacidad

Los permisos se modelarán como **capacidades** (`content.publish`,
`tree.update`, `events.manage`, etc.), no solo como condicionales de rol en la
interfaz. La interfaz oculta acciones no autorizadas, pero **el servidor es la
autoridad final**: toda mutación valida la capacidad antes de ejecutarse.

## 5. Modelo de dominios

| Dominio     | Entidades principales                                          | Estado/lifecycle mínimo                                      |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Identidad   | `User`, `Role`, `Permission`, `AuditLog`                       | invitado → activo → suspendido                               |
| Contenido   | `Asset`, `ContentEntry`, `Release`, `Track`                    | borrador → revisión → publicado → archivado                  |
| B2B         | `Contact`, `Organization`, `Inquiry`, `Activity`               | nuevo → contactado → calificado → propuesta → ganado/perdido |
| Eventos     | `Event`, `Reservation`, `Attendance`                           | borrador → publicado → cerrado → realizado/cancelado         |
| Tueste Tree | `TreeLot`, `TreeSlot`, `Adoption`, `FarmUpdate`, `Certificate` | planeado → disponible → reservado → confirmado → acompañado  |
| Mercado     | `Vendor`, `Listing`, `AvailabilityInquiry`                     | borrador → visible → pausado → archivado                     |
| Radio       | `RadioChannel`, `Schedule`, `RadioSubscription`                | borrador → activo → pausado → cancelado                      |
| Comunidad   | `Post`, `Comment`, `ModerationCase`                            | visible → reportado → moderado → archivado                   |

Todas las fechas que cambien estado, el actor que lo hizo y la razón relevante
generarán una entrada inmutable en `AuditLog`.

## 6. Restricciones legales y de negocio

- **Tueste Tree no debe prometer equity, retorno, inversión ni participación
  financiera sin aprobación legal.** En esta fase se trata como adopción
  simbólica y experiencia de comunidad; el copy y los flujos finales dependen
  de revisión legal/comercial.
- **Pagos, facturación, subastas y Mercado Pago quedan fuera** hasta que el
  modelo comercial/legal esté definido y aprobado.
- Shopify sigue fuera del alcance transaccional del panel (ver sección 3).

## 7. Arquitectura propuesta

```text
Navegador admin
  → Auth.js + Google OAuth/OIDC
  → Server Components / Route Handlers / Server Actions
  → validación Zod + autorización por capacidad + auditoría
  → PostgreSQL (datos y auditoría) y almacenamiento de medios
  → adaptadores futuros: WhatsApp, Shopify (lectura), Mercado Pago, analítica
```

Principios obligatorios:

1. La aplicación pública nunca importa componentes ni secretos del panel.
2. Cada mutación ocurre en servidor, valida su entrada con **Zod**, comprueba
   una **capacidad** y registra **auditoría** antes de responder.
3. Las integraciones viven detrás de **adaptadores por proveedor**; no se
   llama a Shopify, Mercado Pago o WhatsApp desde componentes cliente.
4. Las cargas de archivos se realizan con **URL firmada** y validación de
   **MIME, tamaño** y proceso de moderación antes de publicar.
5. Los secretos se inyectan por el hosting, exclusivamente server-side;
   `.env.local` queda ignorado y `.env.example` solo documenta claves vacías.
6. El **rate limiting** será de perímetro en producción. Los endpoints del
   panel también aplicarán límites por sesión/IP y **payload acotado** cuando
   existan.

## 8. Rutas futuras del panel

```text
/admin             resumen y alertas operativas
/admin/contenido   contenido, música y biblioteca de medios
/admin/contactos   CRM B2B y solicitudes
/admin/eventos     eventos, reservas y asistentes
/admin/tree        lotes, adopciones y actualizaciones
/admin/mercado     vendedores y disponibilidad
/admin/radio       señales y suscripciones B2B
/admin/comunidad   moderación
/admin/usuarios    usuarios y roles (owner solamente)
/admin/auditoria   trazabilidad (owner/admin autorizado)
```

Cada ruta se protege en el servidor. No habrá endpoints públicos para datos de
administración.

## 9. Roadmap por fases

| Prioridad | Módulo                                   | Resultado de negocio                              | Dependencias                                   |
| --------- | ---------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| 1         | **Fundación segura**                     | Acceso privado, roles, auditoría y shell interno. | Google OAuth, base de datos.                   |
| 2         | **Contenido y activos**                  | Equipo puede actualizar la web sin deploy.        | Assets, revisión editorial.                    |
| 3         | **CRM B2B y eventos**                    | Ninguna conversación o reserva se pierde.         | Contactos, actividades, notificaciones.        |
| 4         | **Tueste Tree operativo**                | Seguimiento editorial de lotes/adopciones.        | Validación legal y modelo de datos.            |
| 5         | **Mercado y Radio**                      | Operación de vendedores y canales B2B.            | CRM y políticas comerciales.                   |
| 6         | **Comunidad y analítica**                | Moderación y decisiones de contenido.             | Eventos de producto y consentimiento.          |
| 7         | **Mercado Pago y pagos**                 | Cobros.                                           | Flujos aprobados, webhooks y legal.            |
| 8         | **Subastas, TuesteX y automatizaciones** | Experiencias especiales.                          | Auditoría, pagos y reglas de negocio cerradas. |

### Fase 1.1 — Fundación segura (HISTORIAL)

> **Historial:** la Fase 1.1 fue la primera capa (Google OAuth + allowlist
> temporal). Desde la Fase 1.2 el acceso lo decide el RBAC persistente; la
> allowlist quedó retirada. El contenido siguiente se conserva como registro
> histórico.

**Estado en su momento:** implementada localmente en `feat/admin-foundation`,
pendiente configurar el OAuth Client real en Google Cloud y colocar las
variables server-side en el hosting.

- Auth.js (v5) con Google OAuth/OIDC; Google solo identifica, Tueste decide
  permisos.
- Allowlist server-side de correos (`ADMIN_ALLOWED_EMAILS`, CSV normalizada);
  validada en el login y de nuevo al consultar la sesión.
- Protección real de `/admin` con `requireAdmin()`; login, acceso denegado y
  logout; panel mínimo protegido.
- Roles y capacidades puras (`permissions.ts`) sin base de datos.
- **El rol temporal de esta fase es `admin`, asignado en servidor** a los
  correos permitidos; en la Fase 1.2 el rol vendrá de la base de datos.
- `/admin` y `/admin/login` se resuelven dinámicamente por request
  (`force-dynamic`): un build sin credenciales no congela redirects ni
  estados de configuración.
- Sin `User`, `Role`, `Permission` ni `AuditLog` persistentes todavía.

**Pendiente (no se hace en esta fase):**

- El equipo debe crear/configurar el **OAuth Client en Google Cloud** y
  colocar las variables server-side en el hosting. No crear credenciales ni
  configurar Google Cloud ahora.
- URLs de callback futuras:
  - local: `http://localhost:3000/api/auth/callback/google`
  - producción futura: `https://admin.tueste.shop/api/auth/callback/google`

**El panel NO está listo para producción**: falta la Fase 1.2 (PostgreSQL,
RBAC persistente y auditoría).

**Criterio de salida:** nadie entra al panel sin Google + allowlist; la app
falla cerrada si falta configuración; sin base de datos ni auditoría
persistente.

### Fase 1.2.0 — contrato de persistencia preparado (HISTORIAL)

> **Historial:** esta fase definió los contratos puros antes de que
> existiera PostgreSQL. Desde la Fase 1.2 el RBAC es persistente y la
> migración de identidad está aplicada; el contenido siguiente se conserva
> como registro histórico.

Contratos puros y testeables en `src/features/admin/` (sin base de datos):

- `identity.ts` — `AdminUser` / `AdminRole` persistentes y validación Zod.
- `audit.ts` — `AuditLogEntry` y validación de metadata serializable.
- `repository.ts` — puerto `AdminIdentityRepository` (solo interfaz).

Estado real:

- **PostgreSQL será necesario antes de activar RBAC persistente.**
- La implementación futura tendrá tablas conceptuales: `User`, `Role`,
  `UserRole`, `AuditLog`.
- **Google sigue siendo identidad, no autoridad de permisos**: el servidor
  consultará roles/capacidades persistentes en cada operación.
- `AuditLog` será **append-only**: nunca editable desde la interfaz.
- La selección de proveedor PostgreSQL y ORM queda **pendiente** y no se tomó
  en esta fase (puede ser AWS RDS, Supabase PostgreSQL, Neon u otro).
- **No hay base de datos, datos reales, migraciones ni auditoría guardada
  aún.** No afirmar que la persistencia está implementada.

### Fase 1.2.2 — migración segura de identidad (aplicada)

- Migración versionada **aplicada** (`drizzle/0000_lean_malice.sql`) con
  schema `private`, CHECK constraints, UUIDs por servidor, defaults `now()`
  y revocación de acceso a `PUBLIC`/`anon`/`authenticated`.
- Cliente PostgreSQL server-only (`src/db/client.ts`, `getDb()` perezoso).
- Las cuatro tablas quedaron creadas en Supabase: `private.admin_users`,
  `private.admin_roles`, `private.admin_user_roles`, `private.audit_logs`.
- Detalles en `docs/database-admin.md`.

### Fase 1.2.1 — esquema declarativo de identidad (HISTORIAL)

> **Historial:** esta fase declaró el esquema antes de la conexión. Desde
> la Fase 1.2.2 existen cliente PostgreSQL, migraciones y las cuatro
> tablas creadas en Supabase; el contenido siguiente se conserva como
> registro histórico.

- El esquema futuro está **declarado en código** (Drizzle ORM) en
  `src/db/schema/admin-identity.ts`, dentro del schema `private`:
  `admin_users`, `admin_roles`, `admin_user_roles`, `audit_logs`.
- **Todavía no existe una conexión de base de datos.**
- **No se han creado tablas ni migraciones.**
- Semilla pura de los seis roles en `src/db/admin-identity-seed.ts`.
- **Siguiente fase (1.2.2):** configurar `DATABASE_URL` únicamente en
  `.env.local`, generar una migración revisable y aplicarla de forma
  explícita.
- Supabase se usará como PostgreSQL administrado; **Auth.js + Google
  continúa siendo la autenticación** (sin Supabase Auth).

### Fase 1.2.3 — cierre del contrato de persistencia (HISTORIAL)

> **Historial:** esta fase cerró el contrato puro antes de implementar la
> persistencia. Desde la Fase 1.2 el RBAC es persistente (migración de
> identidad aplicada); el contenido siguiente se conserva como registro.

- Los contratos de **identidad, RBAC, auditoría y repositorio están
  listos** (puros, TypeScript/Zod, sin red ni infraestructura).
- **Aún no hay persistencia real**: sin base de datos, sin migraciones,
  sin datos guardados.
- **Siguiente paso aprobado:** PostgreSQL administrado en **Supabase** +
  **Drizzle ORM** + migraciones. Supabase se usará como PostgreSQL y, en
  el futuro, Storage; **no se usará Supabase Auth**.
- Google OAuth seguirá siendo manejado por **Auth.js**.
- Arquitectura futura de tablas: `users`, `roles`, `user_roles`,
  `audit_logs`, `auth_accounts`, `auth_sessions`.
- La base funcional del admin **no avanzará** hasta tener base de datos,
  credenciales y RBAC persistente (Fase 1.2 siguiente).

### Fase 1.2 — RBAC persistente (implementada)

- `getCurrentAdmin()` consulta el usuario y sus roles en PostgreSQL
  (`DrizzleAdminIdentityRepository`): acceso solo con estado `active` y al
  menos un rol persistido. **La allowlist temporal de ADMIN_ALLOWED_EMAILS
  dejó de decidir el acceso** (Auth.js solo identifica; los permisos viven
  en la base).
- Auditoría append-only implementada: `appendAudit` valida razón y metadata
  con los contratos antes de insertar.
- Bootstrap idempotente de roles y primer admin: `db:bootstrap` con
  `ADMIN_BOOTSTRAP_EMAIL` (documentado en `docs/database-admin.md`).
- Fallo cerrado: usuario inexistente, suspendido, sin rol o error de acceso
  ⇒ sin permisos.

### Fase 2 — Contenido y activos (parcialmente implementada)

- **Modelo nuevo** en schema `private`: `assets`, `content_entries`,
  `releases`, `tracks` con ciclos de estado (contenido:
  draft → review → published → archived; activos:
  pending → approved → archived) y actores/fechas en cambios importantes.
- **Migración `0001_blue_tarantula.sql` generada y revisada** — queda
  **pendiente de aplicar** manualmente con `npm run db:migrate`.
- **Repositorios server-only** (`src/db/admin-content-repository.ts`) y
  **servicio** (`src/features/admin/content-service.ts`): sesión → 401,
  capacidad → 403, validación Zod y auditoría append-only con razón
  obligatoria en transiciones.
- **Ruta protegida** `/admin/contenido`: listado, estados, acciones según
  capacidades y mensajes de error reales.
- **Capacidades**: `content.read` (lectura), `content.edit` (crear/editar/
  preparar/revisar/archivar), `content.publish` (publicar; solo
  owner/admin). Los usuarios con varios roles suman capacidades (unión).
- **Almacenamiento**: contrato provider-neutral (`storage-contract.ts`);
  sin subidas reales ni URLs firmadas hasta configurar credenciales de
  Storage (documentado en `docs/database-admin.md`).

**Pendiente de la Fase 2 (fase parcial):** Storage real con URLs firmadas,
editor completo de contenido, biblioteca multimedia (assets) con su flujo
pendiente → approved → archived, gestión de pistas y publicación pública.

### Fase 3 — CRM B2B, solicitudes y eventos

- Contactos, organizaciones, solicitudes provenientes de formularios/WhatsApp
  y agenda de actividades.
- Eventos, reservas y estados operativos; sin pago todavía.

### Fase 4 — Tueste Tree operativo

- Lotes, slots, actualizaciones desde finca y certificados de demostración.
- El copy y los flujos finales dependen de aprobación legal/comercial.

### Fases 5 a 8

Radio/Mercado, comunidad/analítica, pagos con Mercado Pago y por último
subastas/TuesteX se toman en el orden de la tabla anterior.

## 10. Criterios de salida de Fase 0 (HISTORIAL)

> **Historial:** criterios definidos antes de la fundación segura (Fase 1.1)
> y del RBAC persistente (Fase 1.2), ambos implementados desde entonces.
> El contenido siguiente se conserva como registro histórico.

- Shopify queda aislado (fuera del alcance transaccional del panel).
- **No hay auth, base de datos, endpoints ni pagos implementados.**
- Roles, entidades, límites y dependencias están definidos antes de crear
  tablas o rutas.
- Google es proveedor de identidad inicial; los permisos pertenecen a Tueste.
- Antecedente histórico: esta Fase 0 definió que el siguiente paso era la
  fundación segura. Ese trabajo ya existe como Fase 1.1 (implementada
  localmente); el siguiente trabajo real pendiente es activar el **RBAC
  persistente con PostgreSQL** después de decidir el proveedor.
- El panel se desarrollará en `feat/admin-foundation`, luego PR a `develop` y
  finalmente PR de `develop` a `main`, con `npm run verify` documentado antes
  de cada merge mientras GitHub Actions siga desactivado.
