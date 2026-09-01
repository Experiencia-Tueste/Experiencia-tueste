import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

import styles from './AdminUi.module.css';

export function ModuleHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className={styles.moduleHeader}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {aside ? <div className={styles.headerAside}>{aside}</div> : null}
    </header>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <section className={styles.stats}>{children}</section>;
}

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <article className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

export function Panel({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
      <header className={styles.panelHeader}>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const positive = [
    'active',
    'fulfilled',
    'published',
    'won',
    'approved',
    'issued',
    'paid',
  ].includes(status);
  const danger = ['cancelled', 'archived', 'lost', 'revoked', 'failed'].includes(status);
  return (
    <span
      className={`${styles.status} ${positive ? styles.positive : ''} ${danger ? styles.danger : ''}`}
    >
      {status}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.empty}>
      <span aria-hidden="true">✦</span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className={styles.cardGrid}>{children}</div>;
}

export function RecordCard({ children }: { children: ReactNode }) {
  return <article className={styles.recordCard}>{children}</article>;
}

export function PrimaryButton({ children = 'Guardar' }: { children?: ReactNode }) {
  return <button className={styles.primaryButton}>{children}</button>;
}

export function GhostButton({ children = 'Actualizar' }: { children?: ReactNode }) {
  return <button className={styles.ghostButton}>{children}</button>;
}

export function currency(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function dateTime(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export { styles as adminUiStyles };
