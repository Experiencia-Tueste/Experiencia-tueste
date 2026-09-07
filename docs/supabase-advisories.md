# Advisories de Supabase — revisión de Fase 1

Proyecto revisado: `eekhplpnrskiipdmbnbq`.

La revisión se realizó con los Supabase Advisors el 7 de septiembre de 2026.
No se aplicaron migraciones ni cambios de esquema como parte de esta revisión.

## Decisiones

| Tipo        | Hallazgo                                                                                | Decisión                       | Condición de cierre                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seguridad   | `auth_leaked_password_protection` — protección contra contraseñas filtradas desactivada | **Bloqueante para producción** | Activar la opción en Supabase Auth y volver a ejecutar el advisor de seguridad, o registrar una aceptación explícita del responsable de seguridad antes de promover. |
| Rendimiento | 26 claves foráneas sin índice de cobertura (`unindexed_foreign_keys`)                   | **Aceptado temporalmente**     | Medir consultas de las fases de eventos, mercado y pagos; crear una migración correctiva solo con evidencia de beneficio.                                            |
| Rendimiento | 59 índices sin uso (`unused_index`)                                                     | **Aceptado temporalmente**     | No eliminar índices basándose solo en el advisor; revisar después de tráfico representativo y explicar cada eliminación en una migración.                            |

El aviso de seguridad se corrige desde la configuración de Auth, no con una
migración SQL. Referencia oficial:
[protección contra contraseñas filtradas en Supabase Auth](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Intento de corrección — 7 de septiembre de 2026

Se abrió `Authentication → Attack Protection → Email` y se confirmó que
`Prevent use of leaked passwords` aparece desactivado. El panel informa que la
función solo está disponible en el plan Pro o superior; el proyecto
`eekhplpnrskiipdmbnbq` aparece actualmente en el plan Free. El toggle no se
puede guardar y el advisor de seguridad continúa reportando
`auth_leaked_password_protection` como `WARN`.

**Estado:** bloqueante externo, no corregible desde el código. Para cerrarlo
hay dos opciones: actualizar el proyecto al plan Pro+ y activar la protección,
o aceptar formalmente el riesgo residual sin promover a producción mientras
permanezca desactivada.

> **Pendiente para plan Pro+:** al actualizar el proyecto, activar
> `Authentication → Attack Protection → Prevent use of leaked passwords`,
> guardar el cambio y volver a ejecutar el advisor de seguridad. No eliminar
> esta tarea ni considerar cerrado el advisory mientras el advisor siga
> reportando `auth_leaked_password_protection`.

## Limitación por licencia Pro+

No fue posible completar la corrección del advisory porque el proyecto está
en el plan Free. La interfaz de Supabase permite ver el control, pero impide
guardarlo mientras `Prevent use of leaked passwords` requiere Pro o superior.
Por ese motivo no se pudo habilitar la protección, cerrar el warning ni
demostrar una nueva ejecución del advisor sin el hallazgo. Una migración SQL o
un cambio en la aplicación no sustituye esta configuración gestionada por
Supabase Auth.

La tarea queda diferida hasta contratar Pro+: actualizar el plan, activar el
control, guardar, ejecutar nuevamente el advisor de seguridad y adjuntar el
resultado al checkpoint correspondiente. Mientras tanto, el warning se acepta
como limitación externa documentada y sigue bloqueando la promoción a
producción.

## Aprobación de G1

El responsable del proyecto aprobó en este hilo el checkpoint de Fase 1 el 7
de septiembre de 2026 y autorizó continuar con la Fase 2. La aprobación no
autoriza promover a producción: esa promoción continúa condicionada a activar
la protección de contraseñas filtradas en un plan Pro+ o a una aceptación de
riesgo separada y explícita.

El checkpoint G2 también queda aprobado el 7 de septiembre de 2026. La
migración remota `request_security_phase_2` y la prueba controlada de sus
tablas están documentadas en `docs/engagement-security.md`; esta aprobación no
cierra ni elimina el advisory bloqueado por licencia.

Para los avisos de rendimiento se conservan las referencias oficiales del
linter: [claves foráneas sin índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
y [índices sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Regla operativa

Estos avisos no autorizan cambios manuales en producción. Si un cambio de
índices resulta necesario, se genera una migración versionada, se prueba en un
entorno seguro y se vuelve a ejecutar el advisor antes del checkpoint de la
fase correspondiente.
