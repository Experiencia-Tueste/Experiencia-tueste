'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/home/ThemeToggle';
import { SIDEBAR_GROUPS } from '../data/content';
import styles from '../tueste-tree.module.css';

export interface TuesteTreeSidebarProps {
  /** Ruta activa (Panel de adopción o Adoptar). */
  active: 'dashboard' | 'adoptar';
}

type SidebarItem = {
  id: string;
  href: string;
};

const DASHBOARD_LINKS: SidebarItem[] = SIDEBAR_GROUPS.reduce<SidebarItem[]>(
  (items, group) => [...items, ...group.items],
  [],
);

function getAnchorId(href: string) {
  return href.split('#')[1] ?? '';
}

function getObservedElement(item: SidebarItem) {
  const anchor = document.getElementById(getAnchorId(item.href));

  // Las secciones largas deben permanecer activas mientras el lector las
  // recorre. Inquietudes es un bloque interno y conserva su propio punto.
  return item.id === 'inquietudes' ? anchor : anchor?.closest('section');
}

/**
 * Sidebar de aplicación editorial (patrón del mockup de José):
 * - Escritorio: columna fija/sticky de 246 px con marca, navegación
 *   interna, indicador de la sección visible, ThemeToggle y legal compacto.
 * - Móvil/tablet: se convierte en cabecera compacta accesible (sin
 *   overflow horizontal).
 *
 * La primera pintura es determinista para conservar la misma salida en
 * SSR y cliente; IntersectionObserver solo ajusta el ítem tras hidratar.
 */
export default function TuesteTreeSidebar({ active }: TuesteTreeSidebarProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(
    active === 'dashboard' ? 'mi-arbol' : null,
  );

  useEffect(() => {
    const Observer = window.IntersectionObserver;
    if (active !== 'dashboard' || typeof Observer !== 'function') {
      return;
    }

    const entriesById = new Map<string, IntersectionObserverEntry>();
    const targets = DASHBOARD_LINKS.map((item) => ({
      id: item.id,
      element: getObservedElement(item),
    })).filter(
      (target): target is { id: string; element: HTMLElement } =>
        target.element instanceof HTMLElement,
    );

    const updateFromHash = () => {
      const item = DASHBOARD_LINKS.find(
        (candidate) => getAnchorId(candidate.href) === location.hash.slice(1),
      );
      if (item) {
        setActiveItemId(item.id);
      }
    };

    const observer = new Observer(
      (entries) => {
        for (const entry of entries) {
          const target = targets.find((candidate) => candidate.element === entry.target);
          if (target) {
            entriesById.set(target.id, entry);
          }
        }

        const visibleEntry = [...entriesById.entries()]
          .filter(([, entry]) => entry.isIntersecting)
          .sort(([, first], [, second]) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveItemId(visibleEntry[0]);
        }
      },
      { rootMargin: '-18% 0px -58% 0px', threshold: [0, 0.12, 0.45] },
    );

    for (const target of targets) {
      observer.observe(target.element);
    }

    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', updateFromHash);
    };
  }, [active]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <Link href="/" className={styles.brand} aria-label="Tueste, volver al inicio">
          <Image
            src="/images/tueste-tree/sol-crema.png"
            alt=""
            width={43}
            height={43}
            className={styles.sidebarSun}
            priority
          />
          <span className={styles.sidebarWordmark}>
            <Image
              src="/images/tueste-tree/ot-2.png"
              alt="Logo de Tueste"
              width={116}
              height={37}
              priority
            />
            <span>Tree</span>
          </span>
        </Link>
        <p className={styles.sidebarSub}>
          <i aria-hidden="true" />
          Lote 000 · Founders
        </p>
      </div>

      <nav className={styles.sidebarNav} aria-label="Navegación de Tueste Tree">
        <Link
          href={active === 'adoptar' ? '/tueste-tree/adoptar' : '/tueste-tree'}
          className={styles.sidebarPanelLink}
          aria-current="page"
        >
          {active === 'adoptar' ? 'Adoptar' : 'Panel de adopción'}
        </Link>
        {SIDEBAR_GROUPS.map((group) => (
          <section className={styles.sidebarGroup} key={group.label} aria-label={group.label}>
            <p className={styles.sidebarGroupTitle}>{group.label}</p>
            <ul className={styles.sidebarLinks}>
              {group.items.map((item) => {
                const esActivo = active === 'dashboard' && item.id === activeItemId;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`${styles.sidebarLink}${esActivo ? ` ${styles.sidebarLinkActive}` : ''}`}
                      aria-current={esActivo ? 'location' : undefined}
                      onClick={() => setActiveItemId(item.id)}
                    >
                      <span
                        className={`${styles.sidebarLinkDot} ${styles[`sidebarLinkDot${item.tone[0].toUpperCase()}${item.tone.slice(1)}`]}`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className={styles.sidebarFoot}>
        <a className={styles.sidebarFrequency} href="/experiencia#escucha">
          <span className={styles.audioBars} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Frecuencia
        </a>
        <div className={styles.sidebarControls}>
          <span className={styles.sidebarLanguage} aria-label="Idioma actual: español">
            ES <span aria-hidden="true">/</span> EN
          </span>
          <ThemeToggle />
        </div>
        <p className={styles.sidebarLegal}>
          Tueste Tree · contenido informativo y demostrativo. Sin oferta pública.
        </p>
      </div>
    </aside>
  );
}
