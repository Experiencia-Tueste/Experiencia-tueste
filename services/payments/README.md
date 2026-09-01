# Tueste Payments

Servicio privado Spring Boot que crea órdenes de Mercado Pago y procesa sus webhooks. Next.js conserva el catálogo y la sesión del cliente; Spring conserva las credenciales del proveedor y valida JWT internos RS256.

## Fronteras de seguridad

- `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` existen únicamente en este servicio.
- El navegador nunca define precios ni marca una orden como pagada.
- Next.js recalcula el carrito, persiste el snapshot y firma un JWT de 90 segundos.
- Spring valida firma, issuer, audience, `jti`, `sub` y `order_id`; cada `jti` solo se consume una vez.
- Solo un webhook válido seguido de `GET /v1/orders/{id}` actualiza el estado definitivo.
- No se almacenan números de tarjeta, CVV ni payloads completos del proveedor.
- En pruebas, `MP_TEST_PAYER_EMAIL` permite usar un pagador sintético de Mercado Pago sin
  reemplazar la identidad real del cliente en Tueste. La variable debe eliminarse en producción.

## Claves entre servicios

Genera un par RSA sin subirlo al repositorio:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out payments-private.pem
openssl pkey -in payments-private.pem -pubout -out payments-public.pem
```

Configura `PAYMENTS_JWT_PRIVATE_KEY` en el servicio Next.js y `PAYMENTS_JWT_PUBLIC_KEY` en este servicio. En Railway, usa `payments.railway.internal` para `PAYMENTS_SERVICE_URL`; solo el webhook necesita dominio público.

## Railway

1. Crea un segundo servicio desde el mismo repositorio con root directory `services/payments`.
2. Añade las variables descritas en `.env.example`.
3. Expón el puerto `8080` y genera un dominio público para `/webhooks/mercadopago`.
4. Registra esa URL como webhook de tipo `order` en Mercado Pago.
5. En el servicio Next.js configura `PAYMENTS_SERVICE_URL=http://<servicio>.railway.internal:8080`.

Antes de desplegar, aplica la migración Drizzle `0011` desde el proyecto Next.js.

## Verificación local

```bash
mvn test
```
