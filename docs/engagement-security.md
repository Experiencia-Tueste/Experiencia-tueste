# Solicitudes públicas — política de seguridad de Fase 2

## Rate limiting

`POST /api/engagements` usa buckets persistidos en
`private.request_rate_limit_buckets`, por lo que el límite no depende de la
memoria de una sola instancia:

- por origen confiable del proxy: 20 solicitudes cada 10 minutos;
- por usuario autenticado: 8 solicitudes cada 10 minutos;
- respuesta `429` con `Retry-After` en segundos y mensaje visible para la
  interfaz;
- si el bucket o la base no están disponibles, la ruta falla cerrado con
  `503` y no intenta escribir la solicitud.

El origen se obtiene de `x-real-ip`, el único header de IP de cliente que
Railway documenta y garantiza como no falsificable
(docs.railway.com/networking/public-networking/specs-and-limits). Railway no
documenta ningún contrato sobre `x-forwarded-for` — ni que lo sobreescribe, ni
que lo agrega, ni que lo pasa intacto — por lo que no se usa como fuente ni
como respaldo: si hubiera más de un proxy en el medio, tomar un hop de XFF
podría colapsar a todo el tráfico anónimo en el mismo valor y dejar que un
solo cliente abusivo bloquee a los demás. Si `x-real-ip` no está presente (por
ejemplo, en desarrollo local sin el proxy de Railway por delante) el origen
cae a `'unknown'`, que agrupa ese tráfico en un único balde. No se deben
aceptar estos valores como identidad ni registrar en logs. La tabla y los
buckets no se exponen a `anon` ni `authenticated`.

## Continuidad después del login

Cuando una persona no autenticada envía un payload válido:

1. el servidor valida el schema especializado;
2. guarda el payload en `private.pending_engagement_intents` durante 10 minutos;
3. devuelve `401` y una cookie opaca `HttpOnly`, `SameSite=Lax`, con `Secure`
   bajo HTTPS;
4. después del login por contraseña, OAuth o confirmación de correo, el
   servidor consume la intención y elimina la cookie;
5. la intención se consume como máximo una vez y la creación de la solicitud
   ocurre en la misma transacción que marca el consumo.

Solo se persiste el hash SHA-256 del token. Un token vencido, alterado o ya
consumido no produce una solicitud. Si la transacción falla, la cookie se
conserva hasta su expiración para permitir un reintento.

## Datos y logs

La ruta no registra payloads, contraseñas, tokens, cookies ni identificadores
de origen. Las acciones administrativas que cambian estado mantienen su
mutación y auditoría dentro de la misma transacción existente.

La migración `drizzle/0017_fixed_jean_grey.sql` debe aplicarse mediante el
procedimiento controlado de migraciones antes de desplegar esta ruta. No se
ejecuta DDL manual en producción.

## Evidencia remota y aprobación G2

El 7 de septiembre de 2026 se aplicó `drizzle/0017_fixed_jean_grey.sql` al
proyecto Supabase `eekhplpnrskiipdmbnbq` mediante el procedimiento controlado.
Supabase la registró como `20260907051511 / request_security_phase_2`.

La prueba controlada se ejecutó dentro de una transacción usando únicamente
claves sintéticas y verificó:

- existencia de las dos tablas, sus índices y los `REVOKE` para `anon` y
  `authenticated`;
- consumo único de una intención pendiente y rechazo de una intención
  expirada;
- incremento atómico del bucket, incluido el tope configurado;
- rollback de una inserción después de una excepción controlada.

La operación terminó correctamente y la comprobación posterior confirmó cero
filas sintéticas residuales en ambas tablas. La verificación local de Fase 2
queda respaldada por 99 archivos de prueba, 586 pruebas y build de Next.js
exitoso.

Con esta evidencia se aprueba formalmente `G2` el 7 de septiembre de 2026.
La Fase 3 no se inicia automáticamente: la siguiente fase requiere su propia
apertura y checkpoint. El advisor de Supabase mantiene el warning externo de
protección contra contraseñas filtradas, documentado en
`docs/supabase-advisories.md`; no fue causado por esta migración y permanece
pendiente de habilitar el plan Pro o superior.
