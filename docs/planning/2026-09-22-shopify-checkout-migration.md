# Migración de checkout: Mercado Pago → Shopify (redirect)

Estado: **planeado, no aprobado para ejecución** — pendiente del barrido de todo el
proyecto `tueste` antes de tocar código. Ver contexto en la sesión de Claude Code
del 2026-09-22.

## Contexto / decisión

- Mercado Pago no convenció como proveedor final. La decisión tomada es procesar
  todos los pagos (suscripciones, adopción de árbol, música/radio, productos) a
  través de **Shopify**, ya existe una tienda real conectada a la cuenta.
- `tueste-app` (Next.js) se mantiene como capa de experiencia: catálogo,
  suscripciones, el árbol, la música — nada de eso se muda a Shopify como
  contenido, solo el cobro en sí.
- El servicio `services/payments` (Spring Boot, hoy integrado con Mercado Pago)
  se **recicla**, no se reescribe desde cero: la arquitectura (dominio de
  checkout, manejo de webhooks, reconciliación de órdenes, tests) se considera
  sólida. Solo cambia el cliente del proveedor de pago.
- Checkout UX: **Opción A — redirect al checkout hosteado por Shopify**
  (no carrito custom con Storefront API). Se eligió por velocidad de entrega:
  Shopify maneja impuestos, antifraude, métodos de pago y PCI compliance sin
  desarrollo adicional. La alternativa de carrito propio se descartó porque el
  paso de tarjeta igual termina en una página de Shopify salvo plan Plus con
  checkout extensible.

## Tareas

1. **Cauto** — `ShopifyClient.java` reemplaza `MercadoPagoClient.java`: crea la
   orden/checkout en Shopify (Draft Order o Cart API) y devuelve la URL de
   redirect.
2. **Cauto** — `WebhookSignatureService` pasa a verificar HMAC de Shopify en vez
   de la firma de Mercado Pago; `MercadoPagoWebhookController` →
   `ShopifyWebhookController`, escuchando `orders/paid`.
3. **Teo** — mapear las entidades internas de tueste (tier de suscripción,
   adopción de árbol, compra de música) a productos/variantes reales de la
   tienda Shopify. Pendiente: IDs/nombres de esos productos en Shopify.
4. **Teo** — actualizar el botón de compra y `src/app/cuenta/pagos/resultado/page.tsx`
   para redirigir al checkout de Shopify y manejar el retorno.
5. **Mila** — ajustar copy/UX del momento de redirect ("vas a completar tu
   compra en Shopify").
6. **Rocha** — variables nuevas en Railway (Admin API token, webhook secret) de
   Shopify. **Pausa obligatoria antes de aplicar** — es secreto de producción.
7. **Elena** — ADR documentando el cambio de proveedor de pago, y actualización
   del checkpoint en `docs/supabase-advisories.md` (o el que resulte del
   barrido de documentación).
8. Dar de baja el código de Mercado Pago (`MercadoPagoClient`,
   `MercadoPagoException`, tests asociados) una vez Shopify esté confirmado en
   producción. **Pausa obligatoria antes de borrar.**

## Bloqueos conocidos, no relacionados a este plan

- El advisory de Supabase Auth (`auth_leaked_password_protection`) sigue
  bloqueado por plan Free — requiere Pro+. No se resuelve con este cambio.
- El conector de Shopify de la cuenta claude.ai (para inspección conversacional
  del catálogo) estaba roto al momento de este planning (`Incompatible auth
  server: does not support dynamic client registration`). No bloquea el
  trabajo real de Cauto/Teo, que usa credenciales propias de la Admin API.

## Por qué está en pausa

El usuario identificó que el proyecto `tueste` tiene documentación y
configuración dispersa entre ramas (`feat/admin-foundation`,
`feat/integrate-tueste-tree`, `feat/hosted-radio-audio`, etc.), carpetas sueltas
fuera de git, y plannings viejos de iteraciones con distintas IAs/herramientas.
Antes de desplegar sobre una base a medias, se decidió hacer un barrido de todo
el proyecto y centralizar documentación (posiblemente en Notion) antes de
retomar este plan.
