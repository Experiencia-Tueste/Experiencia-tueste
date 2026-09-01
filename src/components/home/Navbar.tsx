'use client';

import { useEffect, useRef, useState } from 'react';
import { SECTION_IDS, sectionsIn } from '@/features/site';
import PortalAuthNav from '@/features/portal/components/PortalAuthNav';
import Sun from '../brand/Sun';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.css';

/**
 * Enlaces de navegación derivados del contrato de features/site
 * (PUBLIC_SECTIONS): desktop usa las secciones con disponibilidad
 * «desktop» y el menú móvil las de «mobile», con su numeración.
 */
const NAV_LINKS = sectionsIn('desktop').map((s) => ({ href: s.id, label: s.label }));

const MENU_LINKS = sectionsIn('mobile').map((s) => ({
  href: s.id,
  num: s.num ?? '',
  label: s.label,
}));

const CONTENIDO_ID = 'contenido-principal';
const SKIP_LINK_ID = 'skip-link';

/**
 * Navbar fija con marca, enlaces, CTA, toggle día/noche y menú móvil
 * accesible: role="dialog" + aria-modal mientras está abierto, contenido
 * principal y SkipLink inert (el salto al contenido queda inalcanzable),
 * focus trap simple (Tab/Shift+Tab), cierre con Escape y devolución de
 * foco al botón hamburguesa.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Contenido principal y SkipLink inert mientras el menú está abierto:
  // el foco queda dentro del diálogo y el salto no es alcanzable.
  useEffect(() => {
    const contenido = document.getElementById(CONTENIDO_ID);
    const skipLink = document.getElementById(SKIP_LINK_ID);
    if (menuOpen) {
      contenido?.setAttribute('inert', '');
      skipLink?.setAttribute('inert', '');
    } else {
      contenido?.removeAttribute('inert');
      skipLink?.removeAttribute('inert');
    }
  }, [menuOpen]);

  // Cierre con Escape, devolución de foco al botón y focus trap.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !menuRef.current) return;
      const focusables = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Al abrir, mueve el foco al primer enlace del menú.
  useEffect(() => {
    if (!menuOpen) return;
    const first = menuRef.current?.querySelector<HTMLAnchorElement>('a');
    first?.focus();
  }, [menuOpen]);

  // Bloqueo de scroll de fondo mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className={`${styles.nav}${scrolled ? ` ${styles.scrolled}` : ''}`}>
        <a href="#top" className={styles.brand} aria-label="Tueste, ir al inicio">
          <Sun size={30} />
          <span className={styles.wordmark}>
            {/* eslint-disable-next-line @next/next/no-img-element -- wordmark local estático del kit oficial; next/image transformaría el src y rompería el test de lockup. */}
            <img
              className={styles.wordmarkNight}
              src="/brand/wordmark-crema.png"
              alt=""
              width={760}
              height={239}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- wordmark local estático del kit oficial; next/image transformaría el src y rompería el test de lockup. */}
            <img
              className={styles.wordmarkDay}
              src="/brand/wordmark-carbon.png"
              alt=""
              width={760}
              height={239}
            />
          </span>
        </a>

        <div className={styles.navlinks}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
          <a href={SECTION_IDS.escucha} className={styles.navcta}>
            <span className={styles.eq} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            Reproducir
          </a>
        </div>

        <PortalAuthNav authenticatedOnly />
        <ThemeToggle />

        <button
          ref={burgerRef}
          type="button"
          className={styles.burger}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="mmenu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div
        ref={menuRef}
        id="mmenu"
        className={`${styles.mmenu}${menuOpen ? ` ${styles.mmenuOpen}` : ''}`}
        role={menuOpen ? 'dialog' : undefined}
        aria-modal={menuOpen ? 'true' : undefined}
        aria-label="Menú de navegación"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className={styles.mmLinks}>
          {MENU_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={closeMenu}>
              <i>{l.num}</i>
              {l.label}
            </a>
          ))}
        </div>
        <a href={SECTION_IDS.escucha} className={styles.mmCta} onClick={closeMenu}>
          ▶ Entrar a la escucha
        </a>
      </div>
    </>
  );
}
