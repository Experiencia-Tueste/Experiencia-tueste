import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@/components/home/ThemeToggle';
import TuesteTreeIdentity from './TuesteTreeIdentity';
import styles from '../tueste-tree.module.css';

/**
 * Cabecera propia del ritual de adopción.
 *
 * La referencia de José no reutiliza la barra lateral del panel: esta
 * composición horizontal deja que el hero y el vitral respiren a todo el
 * ancho de la página. Los controles que no forman parte del alcance actual
 * se presentan como indicadores; el control de tema sí conserva su acción
 * real compartida con el resto de la aplicación.
 */
export default function TuesteTreeTopbar() {
  return (
    <header className={styles.adoptTopbar}>
      <Link href="/" className={styles.adoptBrand} aria-label="Tueste, volver al inicio">
        <Image
          src="/images/tueste-tree/logo-tueste.png"
          alt="Tueste"
          width={122}
          height={42}
          className={styles.adoptBrandImage}
          priority
        />
        <span className={styles.adoptBrandMeta}>Tree · Lote 000</span>
      </Link>

      <div className={styles.adoptTopbarTools} aria-label="Controles de Tueste Tree">
        <TuesteTreeIdentity returnTo="/tueste-tree/adoptar" />
        <Link
          href="/experiencia#escucha"
          className={styles.adoptAudioLink}
          aria-label="Ir a la escucha de Origen Tostado"
        >
          <span className={styles.audioBars} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Escucha</span>
        </Link>
        <span className={styles.adoptLanguage} aria-label="Idioma actual: español">
          ES
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
