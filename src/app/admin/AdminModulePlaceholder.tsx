import styles from './Admin.module.css';

type AdminModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  capability: string;
};

/**
 * Estado honesto para módulos cuya persistencia todavía no se implementa.
 * No contiene datos del mockup ni acciones simuladas.
 */
export function AdminModulePlaceholder({
  eyebrow,
  title,
  description,
  capability,
}: AdminModulePlaceholderProps) {
  return (
    <>
      <header className={styles.contentHeader}>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.text}>{description}</p>
      </header>

      <section className={styles.placeholder} aria-labelledby="module-status-title">
        <span className={styles.badge}>CONTRATO RESERVADO</span>
        <h2 id="module-status-title" className={styles.statusTitle}>
          Módulo preparado para implementación
        </h2>
        <p className={styles.text}>
          La ruta, el acceso y la navegación ya están conectados al plan rector. La persistencia,
          las acciones y los datos reales se incorporarán en su fase correspondiente.
        </p>
        <dl className={styles.placeholderMeta}>
          <div>
            <dt>Capacidad de lectura</dt>
            <dd>{capability}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>Sin datos demo</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
