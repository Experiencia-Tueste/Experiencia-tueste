# Fase 7 — Mercado: producto y moderación

Estado: **LISTA PARA APROBACIÓN — G7**
Fecha de evidencia: 7 de septiembre de 2026
Rama: `feat/experiencia-functional-hardening`
Checkpoint anterior: `fe9c6ca`

## Implementación cerrada

- `market_listings` ahora conserva marca, variedad, proceso, origen,
  presentación, peso, imagen, entrega y trazabilidad.
- La migración `0021_huge_molecule_man.sql` agrega los campos y las guardas
  de peso e imagen en `private.market_listings`.
- El vendedor crea y edita únicamente sus borradores. El `vendorId` usado al
  crear se toma de la sesión, no del formulario.
- El envío a revisión exige un producto completo; publicar también valida el
  contrato completo y solo está disponible con `market.manage`.
- Las imágenes aceptan únicamente JPG, JPEG, PNG o WEBP, hasta 5 MB, bajo la
  ruta `vendors/<vendorId>/...`; la operación queda validada por tamaño,
  extensión y propiedad de ruta.
- Creación, edición y cambios de estado escriben auditoría.

## Checkpoints

| Checkpoint | Estado | Evidencia |
| --- | --- | --- |
| C7.1 Migración, constraints e índices | APROBADO TÉCNICAMENTE | Migración aplicada en Supabase; columnas y checks verificados por SQL; índice vendor/estado existente revisado. |
| C7.2 Aislamiento entre vendedores | APROBADO TÉCNICAMENTE | Test de workspace filtra lectura al vendor de sesión; test de servicio rechaza edición de publicación ajena. |
| C7.3 Borrador incompleto | APROBADO TÉCNICAMENTE | Test de servicio bloquea el envío a revisión cuando falta variedad. |
| C7.4 Publicación moderada | APROBADO TÉCNICAMENTE | Test bloquea publicar un producto incompleto; E2E remoto deja solo productos completos en `published`. |
| C7.5 Inventario y precio | APROBADO TÉCNICAMENTE | Constraints existentes y validación de esquema; consulta remota: cero valores numéricos inválidos. |
| C7.6 Imágenes | APROBADO TÉCNICAMENTE | Tests para ruta ajena, GIF y tamaño mayor de 5 MB; E2E usa rutas válidas por vendedor. |

## Evidencia de salida G7

- En la pestaña local `/admin/mercado`, con owner autenticado, se crearon dos
  publicaciones completas para vendedores distintos:
  `Café E2E Fase 7 A` y `Café E2E Fase 7 B`.
- La publicación A recorrió creación de borrador → envío a revisión desde el
  flujo de vendedor → publicación administrativa.
- La publicación B recorrió creación de borrador → envío a revisión por
  moderación → publicación administrativa.
- Supabase remoto confirmó ambas publicaciones en `published`, con
  `vendor_id` distintos, inventarios 12 y 8, precios positivos y rutas de
  imagen bajo el vendor correspondiente.
- La auditoría remota confirmó 2 `market.listing_created` y 4
  `market.listing_status_changed` para las dos publicaciones.
- Consultas remotas confirmaron cero publicaciones publicadas incompletas y
  cero valores inválidos de inventario, precio, peso o tamaño de imagen.
- Verificación local: 106 archivos de prueba, 614 pruebas, lint, formato,
  TypeScript, build de producción y `git diff --check` exitosos.

## Advisory conocido

El advisor de seguridad de Supabase mantiene únicamente el warning previo
`auth_leaked_password_protection` (protección contra contraseñas filtradas
desactivada). No fue introducido por esta fase y sigue documentado para
habilitarlo cuando corresponda al plan de Supabase.

El E2E deja los registros sintéticos identificados en Supabase como evidencia;
no se eliminan sin una solicitud explícita.

G7 queda lista para aprobación formal y el checkpoint Git se crea en este
estado. No se hizo push ni se mezclaron ramas.
