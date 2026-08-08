import styles from './SkipLink.module.css';

/**
 * Enlace de salto al contenido principal para navegación por teclado.
 *
 * Oculto visualmente hasta recibir foco; al enfocarse se muestra fijo
 * arriba a la izquierda con alto contraste en ambos modos (día/noche).
 * Va antes del Navbar en el DOM (primer foco del documento); Navbar lo
 * marca inert al abrir el menú móvil para que quede inalcanzable.
 */
export default function SkipLink() {
  return (
    <a id="skip-link" href="#contenido" className={styles.skip}>
      Saltar al contenido principal
    </a>
  );
}
