# Fase 8 — Mercado: experiencia pública del comprador

Estado: **LISTA PARA APROBACIÓN — G8**
Fecha de inicio: 7 de septiembre de 2026
Rama: `feat/experiencia-functional-hardening`
Checkpoint de entrada: `408b800` — G7 aprobado
Checkpoint Git de salida: `aa6e921`

## Objetivo cerrado

Reemplazar el catálogo demostrativo del recorrido público por una proyección
real, trazable y gobernada desde `market_listings`, sin convertir la consulta de
disponibilidad en checkout, pedido o cobro.

## Alcance implementado

- Solo se proyectan publicaciones `published`, con vendedor `active` y
  `inventory > 0`.
- La consulta pública usa la misma publicación canónica de la base de datos;
  `itemSlug` enviado por el navegador no decide el producto.
- Categoría y origen tienen filtros locales sobre la proyección ya gobernada.
  La disponibilidad se aplica como guardia obligatoria en el repositorio, por
  lo que agotados, pausados, archivados o vendedores inactivos no llegan al
  navegador.
- El detalle mantiene una URL reproducible `?mercado=<listingId>` y muestra
  vendedor, atributos, precio, inventario, entrega y trazabilidad.
- Las imágenes se firman desde Storage solo al construir la proyección pública;
  la ruta interna nunca se expone.
- Se conserva la solicitud comercial revisable: no hay carrito de mercado,
  checkout, pago ni cobro.

## Checkpoints técnicos

| Checkpoint                                   | Estado                | Evidencia                                                                                                                                                         |
| -------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C8.1 Solo vendedores y productos publicables | APROBADO TÉCNICAMENTE | Repositorio con `published`, vendedor `active` e inventario positivo; test de proyección pública.                                                                 |
| C8.2 Filtros y detalle reproducible          | APROBADO TÉCNICAMENTE | E2E local mostró dos publicaciones, filtró Quindío a una y abrió el detalle con URL estable.                                                                      |
| C8.3 Referencia manipulada                   | APROBADO TÉCNICAMENTE | Tests rechazan slug ajeno, listing no publicado y referencia sin formato UUID antes de crear solicitud.                                                           |
| C8.4 Pausa y visibilidad                     | APROBADO TÉCNICAMENTE | Panel local pausó B: catálogo público pasó de 2 a 1; después B se restauró y volvió a aparecer.                                                                   |
| C8.5 Consulta sin compra                     | APROBADO TÉCNICAMENTE | Botón conserva intención `availability`; servicio canoniza listing y no crea pedido ni cobro. La sesión local sin cliente autenticado activa la guardia de login. |

## Evidencia de salida G8

- E2E de lectura: `published → encontrar → filtrar → abrir` completado con
  `Café E2E Fase 7 A` y `Café E2E Fase 7 B`.
- E2E de moderación: B pasó a `paused`, desapareció de `/experiencia`, y
  regresó a `published` tras la prueba.
- El detalle A se verificó en
  `/experiencia?mercado=a1ff2bc8-f6f6-4d9f-add5-003dc7be6d7e`.
- El intento de consulta en la sesión local quedó protegido por la exigencia
  de autenticación; no se creó compra, pedido ni cobro. La canonicalización
  autenticada está cubierta por el test de servicio.
- Los registros sintéticos de Fase 7 se conservan como evidencia controlada.

## Condiciones de salida

Antes de cerrar G8 deben estar verdes la suite completa, lint, formato,
TypeScript, build, `npm run verify`, `git diff --check`, la auditoría remota de
las publicaciones y el checkpoint Git. No se avanza a Fase 9 sin aprobación
formal de G8.

La evidencia técnica y el checkpoint Git ya están completos. G8 queda lista
para aprobación formal del usuario; Fase 9 permanece cerrada.

## Reapertura

Si una publicación pausada vuelve a ser visible, un detalle muestra datos que
no coinciden con la base, o una referencia manipulada crea una solicitud, se
reabre Fase 8 y se bloquea el paso a catálogo público ampliado.
