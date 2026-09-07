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

Para los avisos de rendimiento se conservan las referencias oficiales del
linter: [claves foráneas sin índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
y [índices sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Regla operativa

Estos avisos no autorizan cambios manuales en producción. Si un cambio de
índices resulta necesario, se genera una migración versionada, se prueba en un
entorno seguro y se vuelve a ejecutar el advisor antes del checkpoint de la
fase correspondiente.
