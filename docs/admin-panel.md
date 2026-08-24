# Panel administrativo de Tueste — contrato de Fase 0

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

El acceso inicial será por **allowlist de correos corporativos aprobados**. Un
inicio de sesión válido de Google que no esté en la allowlist no otorga entrada
al panel.

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

### Fase 1.1 — Fundación segura (Google OAuth, allowlist y sesiones, sin persistencia)

**Estado: implementada localmente en `feat/admin-foundation` (commit pendiente).**

- Auth.js (v5) con Google OAuth/OIDC; Google solo identifica, Tueste decide
  permisos.
- Allowlist server-side de correos (`ADMIN_ALLOWED_EMAILS`, CSV normalizada);
  validada en el login y de nuevo al consultar la sesión.
- Protección real de `/admin` con `requireAdmin()`; login, acceso denegado y
  logout; panel mínimo protegido.
- Roles y capacidades puras (`permissions.ts`) sin base de datos.
- **El rol temporal de esta fase es `admin`, asignado en servidor** a los
  correos permitidos; en la Fase 1.2 el rol vendrá de la base de datos.
- `-`/`admin/login` se resuelven dinámicamente por request (`force-dynamic`):
  un build sin credenciales no congela redirects ni estados de configuración.
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

- Auth.js (v5) con Google OAuth/OIDC; Google solo identifica, Tueste decide
  permisos.
- Allowlist server-side de correos (`ADMIN_ALLOWED_EMAILS`, CSV normalizada);
  validada en el login y de nuevo al consultar la sesión.
- Protección real de `/admin` con `requireAdmin()`; login, acceso denegado y
  logout; panel mínimo protegido.
- Roles y capacidades puras (`permissions.ts`) sin base de datos.
- **El rol temporal de esta fase es `admin`, asignado en servidor** a los
  correos permitidos; en la Fase 1.2 el rol vendrá de la base de datos.
- Configuración manual futura en Google Cloud (no realizada todavía):
  - redirect URI local: `http://localhost:3000/api/auth/callback/google`
  - redirect URI de producción futura:
    `https://admin.tueste.shop/api/auth/callback/google`
- Sin `User`, `Role`, `Permission` ni `AuditLog` persistentes todavía.

**Criterio de salida:** nadie entra al panel sin Google + allowlist; la app
falla cerrada si falta configuración; sin base de datos ni auditoría
persistente.

### Fase 1.2 — RBAC persistente

- PostgreSQL con `User`, `Role`, `Permission` y `AuditLog`.
- El rol deja de ser temporal: `getCurrentAdmin()` consulta la base de datos.
- Auditoría inmutable de acciones y pruebas de autorización de servidor.

### Fase 2 — Contenido y activos

- Biblioteca de medios con metadatos, borrador/revisión/publicación y uso de
  assets en secciones públicas.
- Gestión de lanzamientos/pistas y enlaces externos con preview solo cuando el
  proveedor lo permita.

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

## 10. Criterios de salida de Fase 0

- Shopify queda aislado (fuera del alcance transaccional del panel).
- **No hay auth, base de datos, endpoints ni pagos implementados.**
- Roles, entidades, límites y dependencias están definidos antes de crear
  tablas o rutas.
- Google es proveedor de identidad inicial; los permisos pertenecen a Tueste.
- La siguiente fase es exclusivamente la **fundación segura** (Fase 1).
- El panel se desarrollará en `feat/admin-foundation`, luego PR a `develop` y
  finalmente PR de `develop` a `main`, con `npm run verify` documentado antes
  de cada merge mientras GitHub Actions siga desactivado.
