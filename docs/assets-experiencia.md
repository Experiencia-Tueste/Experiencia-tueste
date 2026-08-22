# Assets de la experiencia — contrato (integrados)

Los 13 assets locales aprobados **ya existen físicamente y están
integrados** en los catálogos. Los componentes (`ReleaseCard`,
`ProductVisual`, `MercadoVisual`) los muestran con `next/image`; el
fallback editorial SVG se conserva únicamente como respaldo para
elementos futuros sin imagen.

## Regla de oro

> El archivo debe existir físicamente en `public/images/…` **antes** de
> asignar su ruta a los datos. Todos los assets actuales cumplen esta
> regla; las rutas se verifican en las pruebas de contrato.

## Características de los assets integrados

- WebP locales (sin imágenes externas, sin base64, sin data URLs).
- Visuales **editoriales para la demostración**: no son fotografías
  oficiales de fincas reales ni de personas.
- `object-fit: cover` en los componentes; `sizes` responsivos; `alt`
  descriptivo; sin texto incrustado (el texto sigue siendo HTML).

## Mapeo integrado (catálogo → asset)

### 1 · Lanzamientos → `public/images/releases/` (asignado en `RELEASES[].coverImage`)

| Lanzamiento                | Ruta asignada                                      | Proporción |
| -------------------------- | -------------------------------------------------- | ---------- |
| From Coffee to Frequencies | `/images/releases/from-coffee-to-frequencies.webp` | 1:1        |
| Coffee in Frequencies      | `/images/releases/coffee-in-frequencies.webp`      | 1:1        |
| Tueste Selection           | `/images/releases/tueste-selection.webp`           | 1:1        |
| Tostión                    | `/images/releases/tostion.webp`                    | 1:1        |

### 2 · Tienda → `public/images/store/` (asignado en `PRODUCTS[].imageSrc`)

| Producto                                    | Ruta asignada                                     | Proporción |
| ------------------------------------------- | ------------------------------------------------- | ---------- |
| Coffee in Frequencies (Vinilo)              | `/images/store/vinilo-coffee-in-frequencies.webp` | 1:1        |
| Field Tapes (Cassette)                      | `/images/store/cassette-field-tapes.webp`         | 1:1        |
| Taza Cántara                                | `/images/store/taza-cantara.webp`                 | 1:1        |
| Camiseta Origen (bordado TUESTE)            | `/images/store/camiseta-origen.webp`              | 1:1        |
| Print Espectrograma                         | `/images/store/print-espectrograma.webp`          | 1:1        |
| Café del Lote 000 (empaque Café Aures 1840) | `/images/store/cafe-lote-000.webp`                | 1:1        |

> Nota histórica: la ruta antigua `public/images/merch/` ya no se usa;
> la real es `public/images/store/`.

### 3 · Mercado de Origen → `public/images/mercado/` (asignado en `MERCADO_ITEMS[].imageSrc`)

| Ítem            | Ruta asignada                          | Proporción |
| --------------- | -------------------------------------- | ---------- |
| Finca La Aurora | `/images/mercado/finca-la-aurora.webp` | 4:3        |
| Verde Andino    | `/images/mercado/verde-andino.webp`    | 4:3        |
| Molino Cauca    | `/images/mercado/molino-cauca.webp`    | 4:3        |

## Dónde se asignan las rutas

- `src/features/music/index.ts` → `RELEASES[].coverImage`
- `src/features/commerce/index.ts` → `PRODUCTS[].imageSrc`
- `src/features/mercado/index.ts` → `MERCADO_ITEMS[].imageSrc`

Los componentes soportan estas rutas opcionales y pasan automáticamente
del fallback SVG a la imagen local al asignarlas. No hay URLs externas,
base64 ni placeholders.
