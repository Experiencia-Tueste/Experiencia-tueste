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

El origen se obtiene de `x-forwarded-for` o `x-real-ip`. El proveedor debe
limpiar y establecer esos headers; no se deben aceptar como identidad ni
registrar en logs. La tabla y los buckets no se exponen a `anon` ni
`authenticated`.

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
