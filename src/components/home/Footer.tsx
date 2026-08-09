import Sun from '../brand/Sun';
import {
  FOOTER_CIERRE,
  FOOTER_COPYRIGHT,
  FOOTER_GROUPS,
  FOOTER_PALETA,
  getSection,
} from '@/features/site';
import styles from './Footer.module.css';

/**
 * Footer público que cierra la experiencia: bloque de marca con el sol
 * Tueste (SVG propio, sin base64), descripción editorial, tres columnas
 * de navegación semántica (nav con aria-label) y barra inferior con el
 * cierre «Donde el café se escucha». Los grupos referencian secciones
 * del contrato de features/site por id (sin duplicar hashes ni labels):
 * solo hashes internos permitidos, sin enlaces externos, redes,
 * WhatsApp, correo ni enlaces vacíos.
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Sun size={48} />
          </span>
          <p>
            <b>Origen Tostado</b> traduce el café colombiano en música, frecuencias y experiencias
            inmersivas. Un proyecto sonoro del ecosistema Tueste.
          </p>
        </div>

        <nav className={styles.cols} aria-label="Navegación del pie de página">
          {FOOTER_GROUPS.map((col) => (
            <div className={styles.col} key={col.titulo}>
              <h2>{col.titulo}</h2>
              <ul>
                {col.sectionIds.map((id) => {
                  const seccion = getSection(id);
                  if (!seccion) return null;
                  return (
                    <li key={id}>
                      <a href={seccion.id}>{seccion.label}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.bar}>
        <span>{FOOTER_COPYRIGHT}</span>
        <span className={styles.eco}>
          {FOOTER_PALETA.map((c) => (
            <i key={c} style={{ background: c }} aria-hidden="true" />
          ))}
          {FOOTER_CIERRE}
        </span>
      </div>
    </footer>
  );
}
