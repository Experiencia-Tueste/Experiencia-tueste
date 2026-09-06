import Link from 'next/link';
import styles from '../tueste-tree.module.css';

/** Tarjetas de navegación compactas del panel (rutas/anclas internas). */
const NAV_CARDS = [
  {
    id: 'adoptar',
    num: '01',
    label: 'Elige tu árbol',
    sub: 'Un sol libre en el cultivo',
    href: '/tueste-tree/adoptar',
  },
  {
    id: 'mi-arbol',
    num: '02',
    label: 'Ponle nombre y nivel',
    sub: 'El certificado toma forma',
    href: '/tueste-tree#mi-arbol',
  },
  {
    id: 'cultivo',
    num: '03',
    label: 'Confirma y recibe',
    sub: 'Café, frecuencia y comunidad',
    href: '/tueste-tree#cultivo-dash',
  },
] as const;

/**
 * Tarjetas de navegación del panel (patrón de la referencia): tres
 * accesos compactos y reales, sin enlaces externos.
 */
export default function DashboardNavCards() {
  return (
    <nav className={styles.navCards} aria-label="Accesos del panel de adopción">
      {NAV_CARDS.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className={styles.navCard}
          data-commercial-intent={card.id === 'adoptar' ? 'tree-drop-000' : undefined}
        >
          <span className={styles.navCardNum} aria-hidden="true">
            {card.num}
          </span>
          <strong className={styles.navCardLabel}>{card.label}</strong>
          <span className={styles.navCardSub}>{card.sub}</span>
          <span className={styles.navCardArrow} aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </nav>
  );
}
