import { PORTAL_FOOTER_TAG } from '../data/portal';
import SunGlyph from './SunGlyph';
import styles from './PortalFooter.module.css';

/**
 * Pie breve del portal: línea fina · cierre editorial · línea fina, y
 * un sol decorativo pequeño debajo (SVG local). No reutiliza el Footer
 * de la experiencia (sus anclas pertenecen a /experiencia).
 */
export default function PortalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.tagRow}>
        <span className={styles.line} aria-hidden="true" />
        <p className={styles.tag}>{PORTAL_FOOTER_TAG}</p>
        <span className={styles.line} aria-hidden="true" />
      </div>
      <SunGlyph size={20} className={styles.sun} />
    </footer>
  );
}
