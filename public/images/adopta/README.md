# Biblioteca visual del mockup Adopta

Estas imágenes fueron creadas para el mockup editorial de `/adopta`. Todas están optimizadas en WebP y deben cargarse con `next/image` desde `/images/adopta/...`.

## Hero

| Archivo                            | Uso                          | Texto alternativo sugerido                                 |
| ---------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `adopta-hero-cafeto-joven-v1.webp` | Imagen principal de apertura | Cafeto joven creciendo en una finca de montaña al amanecer |

## Una forma de estar cerca del origen

| Archivo                          | Tarjeta           | Texto alternativo sugerido                               |
| -------------------------------- | ----------------- | -------------------------------------------------------- |
| `vinculo-semilla-v1.webp`        | La semilla        | Semilla de café germinando en suelo húmedo               |
| `vinculo-arbol-joven-v1.webp`    | El crecimiento    | Cafeto joven cuidado por manos de una persona productora |
| `vinculo-arbol-guardian-v1.webp` | El árbol guardián | Cafeto adulto cargado de cerezas maduras en la montaña   |

## Del silencio de la semilla a tu taza

Usar una imagen por etapa del carrusel o línea de tiempo. No mezclar el orden.

| Orden | Archivo                     | Etapa       | Texto alternativo sugerido                                |
| ----- | --------------------------- | ----------- | --------------------------------------------------------- |
| 1     | `ciclo-germinacion-v1.webp` | Germinación | Brote de café emergiendo de la semilla                    |
| 2     | `ciclo-floracion-v1.webp`   | Floración   | Flores blancas abiertas en una rama de cafeto             |
| 3     | `ciclo-cereza-v1.webp`      | Cereza      | Cerezas rojas maduras en una rama de café                 |
| 4     | `ciclo-cosecha-v1.webp`     | Cosecha     | Recolección manual de cerezas maduras de café             |
| 5     | `ciclo-taza-v1.webp`        | Taza        | Café servido junto a granos tostados y paisaje de montaña |

## Memorias para volver al origen

| Archivo                    | Memoria              | Texto alternativo sugerido                                |
| -------------------------- | -------------------- | --------------------------------------------------------- |
| `memoria-bitacora-v1.webp` | Bitácora del árbol   | Cuaderno de campo junto a hojas y cerezas de café         |
| `memoria-carta-v1.webp`    | Carta desde la finca | Manos sosteniendo una carta junto a una rama de café      |
| `memoria-cafe-v1.webp`     | Café de la cosecha   | Taza de café junto a cerezas y granos del origen          |
| `memoria-ritual-v1.webp`   | Visita o ritual      | Sendero entre cafetales de montaña durante la hora dorada |

## Reglas de uso

- No aplicar filtros que vuelvan las fotografías naranjas o excesivamente saturadas.
- Mantener el tratamiento oscuro de Tueste mediante overlays CSS, sin editar destructivamente los archivos.
- Usar `object-fit: cover` y definir `sizes` responsivos en `next/image`.
- Evitar texto incrustado sobre las fotografías; el contenido editorial debe seguir siendo HTML accesible.
- Son imágenes generadas para un mockup. No deben presentarse como registro documental de Finca Tres Esquinas ni de personas reales sin aprobación explícita del cliente.
- Antes de producción, José debe aprobarlas o sustituirlas por fotografías reales/licenciadas del proyecto.
- El mapa de “El origen se cuida también al nombrarlo” es interactivo y no utiliza una imagen de esta carpeta.
