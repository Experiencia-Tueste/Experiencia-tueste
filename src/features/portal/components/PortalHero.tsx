import { PORTAL_KICKER, PORTAL_SUBTITLE, PORTAL_TITLE_1 } from '../data/portal';
import SunGlyph from './SunGlyph';
import styles from './PortalHero.module.css';

/**
 * Hero editorial del portal: kicker mono, titular serif amplio,
 * subtítulo y divisor decorativo línea → sol → línea (SVG local,
 * sin raster).
 */
export default function PortalHero() {
  return (
    <section className={styles.hero} aria-labelledby="portal-title">
      <p className={styles.kicker}>{PORTAL_KICKER}</p>
      <h1 id="portal-title" className={styles.title}>
        {PORTAL_TITLE_1}
      </h1>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.line} />
        <SunGlyph size={20} className={styles.dividerSun} />
        <span className={styles.line} />
      </div>
      <p className={styles.subtitle}>{PORTAL_SUBTITLE}</p>
    </section>
  );
}
