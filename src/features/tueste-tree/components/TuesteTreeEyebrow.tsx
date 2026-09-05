import styles from '../tueste-tree.module.css';

export interface TuesteTreeEyebrowProps {
  /** Texto de la etiqueta (monoespaciada, mayúsculas). */
  children: string;
}

/**
 * Etiqueta editorial de Tueste Tree (kicker monoespaciado), reutilizable
 * en ambas rutas para mantener jerarquía y atmósfera coherentes.
 */
export default function TuesteTreeEyebrow({ children }: TuesteTreeEyebrowProps) {
  return <p className={styles.kicker}>{children}</p>;
}
