# Mapa de Origen (territorio)

Estado: **Fase 29.1 completada**. La implementación actual es una demostración editorial provisional: incluye dos mini-mapas interactivos, sin coordenadas exactas ni datos privados.

## Implementación actual

La sección Origen usa **MapLibre GL JS**, ya instalado como dependencia de producción. MapLibre incluye sus propios tipos de TypeScript; no se mantiene un paquete de tipos independiente.

```text
src/features/origen-map/
├── components/
│   ├── OrigenMapPreview.tsx          — mini-mapa cliente con carga dinámica
│   ├── OrigenMapPreview.module.css   — capas y etiqueta editorial
│   ├── OrigenMapFallback.tsx         — contenido textual accesible
│   └── OrigenMapFallback.module.css  — fallback visible durante carga/error
├── data/puntos.ts                    — dos puntos locales tipados
├── config.ts                          — estilo y límites de cámara
├── types.ts                           — contrato de puntos provisionales
└── __tests__/                        — pruebas de mapa y contrato de datos
```

Los dos puntos vigentes son:

1. **Finca Tres Esquinas**: referencia editorial de ubicación `aproximada`.
2. **Guardianes del origen**: demostración `ilustrativa`, con estado `proximamente`.

No representan ubicaciones exactas, confirmadas ni físicas de personas. Los datos son módulos locales de compilación: no hay endpoint propio, API, base de datos, autenticación ni solicitud de coordenadas al navegador.

## Carga, accesibilidad y fallos

- MapLibre se importa dinámicamente dentro de `useEffect`; no se carga ni se ejecuta WebGL durante SSR.
- Si WebGL2 no está disponible, MapLibre no se importa y el fallback textual permanece visible.
- El fallback se mantiene sobre el canvas hasta el evento `load`. Al cargar, se oculta visualmente y aparece la etiqueta editorial sobre el mapa.
- Un error de estilo o tiles antes de `load` conserva el fallback y elimina esa instancia defectuosa. Un error de tile posterior a `load` no destruye un mapa que ya es usable.
- La región del mapa tiene nombre accesible y no está dentro de un ancestro `aria-hidden`. La descripción textual sigue disponible sin WebGL.
- No hay animaciones de cámara cuando el usuario solicita `prefers-reduced-motion`.

## Tiles temporales y red

El proveedor temporal es **MapTiler**, a través de sus tiles ráster de calles
renderizados en un estilo mínimo de MapLibre:

```text
https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=NEXT_PUBLIC_MAPTILER_KEY
```

`NEXT_PUBLIC_MAPTILER_KEY` es una clave de navegador visible por diseño, no un secreto. Se configura solo en `.env.local` o en el entorno de despliegue y debe limitarse por dominio/referer en MapTiler. Si falta, MapLibre no se importa y el fallback editorial queda visible.

Las únicas llamadas externas introducidas por esta fase se limitan a `https://api.maptiler.com`. La atribución de MapLibre, MapTiler y OpenStreetMap permanece visible. El mapa conserva pan y zoom sobre los tiles ráster.

La CSP `Content-Security-Policy-Report-Only` ya contempla el proveedor de tiles en `connect-src` e `img-src`, además de `worker-src blob:` y `child-src blob:` requeridos por los workers de MapLibre.

**MapTiler sigue siendo una decisión provisional de visualización.** Antes del lanzamiento se confirmarán capacidad, coste, términos y restricciones por dominio. No se deben introducir claves privadas, de servidor o credenciales AWS en el repositorio ni en el bundle.

## Política de privacidad geográfica

1. No publicar coordenadas exactas, linderos, direcciones, contactos ni información operativa sin autorización explícita del cliente.
2. Mantener los puntos actuales como `aproximada` o `ilustrativa`.
3. Separar cualquier dato futuro interno de los datos editoriales públicos.
4. Solicitar aprobación del cliente antes de añadir un punto, ruta o material asociado que pueda revelar una ubicación sensible.

## Verificación de Fase 29.1

- [x] `maplibre-gl` instalado, con sus tipos incluidos.
- [x] Dos mini-mapas interactivos provisionales con fallback textual.
- [x] MapTiler temporal con clave pública restringida por dominio.
- [x] CSP Report-Only preparada para tiles y workers de MapLibre.
- [x] WebGL ausente, carga, error previo/posterior a `load`, desmontaje y accesibilidad cubiertos por pruebas.
- [x] Sin secretos, endpoints propios, APIs, persistencia ni coordenadas exactas.
