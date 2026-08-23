# Inventario de CTA — rutas públicas de Tueste

Auditoría de botones, enlaces de acción y CTA. Categorías:

- `navigation` — lleva a una sección o ruta interna.
- `external` — plataforma externa oficial.
- `audio` — reproduce, pausa o cambia una pista.
- `local-ui` — abre/cierra interfaz local (carrito, menú).
- `commercial-intent` — expresa intención comercial sin cobrar.
- `coming-soon` — funcionalidad futura que no debe fingir disponibilidad.

| ID estable                  | Texto visible                     | Ruta/componente                              | Tipo              | Resultado actual                                                         | Resultado esperado |
| --------------------------- | --------------------------------- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------ | ------------------ |
| `nav-portal-experiencia`    | Experiencia Origen Tostado        | `/` (ExperienceCard)                         | navigation        | Link → `/experiencia`                                                    | Correcto           |
| `nav-portal-tienda`         | Entrar a la tienda                | `/` (ShopCard)                               | external          | `<a>` Shopify `_blank noreferrer noopener`                               | Correcto           |
| `nav-portal-tienda-soon`    | Tienda próximamente               | `/` (ShopCard, sin URL)                      | coming-soon       | Texto + aclaración accesible, sin enlace                                 | Correcto           |
| `nav-portal-adoptar`        | Adoptar / Cofundar un árbol       | `/` (TuesteTreeCard)                         | navigation        | Link → `/tueste-tree`                                                    | Correcto           |
| `nav-experiencia-secciones` | Escucha / Origen / …              | `/experiencia` (Navbar/Footer)               | navigation        | Anclas internas                                                          | Correcto           |
| `audio-origen-tarjeta`      | Reproducir/Pausar · Hz            | `/experiencia` (OrigenStep)                  | audio             | `<button>` play/pausa vía reproductor global                             | Correcto           |
| `audio-deck`                | Play / pausa                      | `/experiencia` (Deck)                        | audio             | `<button>` reproductor global                                            | Correcto           |
| `audio-tracklist`           | Pista                             | `/experiencia` (TrackList)                   | audio             | `<button>` seleccionar pista                                             | Correcto           |
| `audio-radio`               | Señal                             | `/experiencia` (RadioDemo)                   | audio             | `<button>` seleccionar canal                                             | Correcto           |
| `ext-spotify`               | Spotify · SEGUIR · GUARDAR        | `/experiencia` (ListeningPlatforms)          | external          | `<a>` oficial `_blank noopener noreferrer`                               | Correcto           |
| `ext-apple`                 | Apple Music · AÑADIR A BIBLIOTECA | `/experiencia` (ListeningPlatforms)          | external          | `<a>` oficial                                                            | Correcto           |
| `ext-youtube`               | YouTube · VISUALIZERS · LIVES     | `/experiencia` (ListeningPlatforms)          | external          | `<a>` oficial                                                            | Correcto           |
| `ext-beatport`              | Beatport · EXTENDED MIXES         | `/experiencia` (ListeningPlatforms)          | external          | `<a>` oficial                                                            | Correcto           |
| `ext-soundcloud`            | SoundCloud · SETS · DEMOS         | `/experiencia` (ListeningPlatforms)          | external          | `<a>` oficial                                                            | Correcto           |
| `release-spotify`           | Escuchar en Spotify               | `/experiencia` (ReleaseCard)                 | external          | `<a>` `_blank noreferrer noopener`                                       | Correcto           |
| `release-compra`            | Compra próximamente               | `/experiencia` (ReleaseCard)                 | coming-soon       | `<button disabled>` + `data-commercial-intent="release-…"`               | Correcto           |
| `merch-agregar`             | Agregar                           | `/experiencia` (Tienda)                      | local-ui          | `<button>` carrito demo + `data-commercial-intent="merch-…"`             | Correcto           |
| `merch-checkout`            | Finalizar compra                  | `/experiencia` (CartDrawer)                  | coming-soon       | Mensaje «próximamente» accesible                                         | Correcto           |
| `market-consulta`           | Consultar disponibilidad          | `/experiencia` (MercadoOrigen)               | commercial-intent | `<button>` aria-live + `data-commercial-intent="availability-…"`         | Correcto           |
| `tt-nav`                    | Sidebar 01–06                     | `/tueste-tree` (TuesteTreeSidebar)           | navigation        | `<a>` anclas internas + `aria-current`                                   | Correcto           |
| `tt-adoptar`                | Adoptar                           | `/tueste-tree` (DashboardNavCards)           | navigation        | Link → `/tueste-tree/adoptar` + `data-commercial-intent="tree-drop-000"` | Correcto           |
| `tt-mi-arbol`               | Elegir mi árbol                   | `/tueste-tree` (DashboardMyTree)             | navigation        | Link → `/tueste-tree/adoptar`                                            | Correcto           |
| `tt-cultivo-sol`            | Elegir árbol 0XX                  | `/tueste-tree` (DashboardCultivo)            | navigation        | Link → `/tueste-tree/adoptar`                                            | Correcto           |
| `tt-adoptar-hero`           | Elegir mi árbol / Ver niveles     | `/tueste-tree/adoptar` (AdoptionHero)        | navigation        | Anclas `#cultivo` / `#modelo`                                            | Correcto           |
| `tt-arbol`                  | Seleccionar árbol 0XX             | `/tueste-tree/adoptar` (TreeGrove)           | local-ui          | `<button>` selección en memoria                                          | Correcto           |
| `tt-nivel`                  | Nivel de cofundación …            | `/tueste-tree/adoptar` (CofoundingLevels)    | commercial-intent | `<button>` + `data-commercial-intent="tree-level-…"`                     | Correcto           |
| `tt-reiniciar`              | Empezar de nuevo                  | `/tueste-tree/adoptar` (CertificadoBitacora) | local-ui          | `<button>` limpia estado local                                           | Correcto           |

## Reglas aplicadas

- `<Link>`/`<a>` para navegación y enlaces externos; `<button type="button">` solo para acciones locales.
- Enlaces externos con `target="_blank"` y `rel="noreferrer noopener"`.
- Sin `href="#"`, sin `javascript:`, sin `window.open`, sin `alert`/`confirm`, sin handlers silenciosos.
- Acciones comerciales con `data-commercial-intent` estable (release/merch/tree/availability).
- Sin pagos, checkout, SDK de Mercado Pago, endpoints, secretos ni variables de pago.
