/**
 * Feature: gamification
 * ---------------------------------------------------------------------
 * Juego Cosecha Arcade, logros y saldo TuesteX.
 *
 * IMPORTANTE (plan, sección 7 y 8): el saldo NO se guarda como un número
 * que el cliente pueda editar. Se deriva de un libro de movimientos
 * (`tx_ledger`) que solo las operaciones de servidor pueden escribir.
 * La persistencia de puntos NO está implementada todavía; aquí viven el
 * contrato de tipos y la lógica pura (logros, puntaje).
 */

export type TxKind = 'earn' | 'redeem' | 'adjustment' | 'reversal';

export interface TxEntry {
  id: string;
  kind: TxKind;
  amount: number;
  reason: string;
  /** Clave de idempotencia: reintentar no duplica. */
  idempotencyKey: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  tx: number;
  test: (stats: GameStats) => boolean;
}

export interface GameStats {
  score: number;
  level: number;
  catches: number;
  gold: number;
  top3: boolean;
}

export interface GameRun {
  /** La partida solo propone un resultado; el servidor valida. */
  stats: GameStats;
  gameVersion: string;
  submittedAt: string;
}

/** Catálogo de logros (pagan TuesteX). */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'c25', name: 'Primera canasta · 25 cerezas', tx: 10, test: (s) => s.catches >= 25 },
  { id: 'lv3', name: 'Subir al nivel 3', tx: 15, test: (s) => s.level >= 3 },
  { id: 'p120', name: '120 puntos en una partida', tx: 25, test: (s) => s.score >= 120 },
  { id: 'gold5', name: '5 doradas en una partida', tx: 20, test: (s) => s.gold >= 5 },
  { id: 'top3', name: 'Entrar al Top 3 de la cosecha', tx: 30, test: (s) => s.top3 },
];

/** Devuelve los logros ganados en una partida que aún no se tenían. */
export function evaluateAchievements(owned: string[], stats: GameStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !owned.includes(a.id) && a.test(stats));
}

/** Suma TuesteX ganado por una lista de logros. */
export function sumTx(achievements: Achievement[]): number {
  return achievements.reduce((acc, a) => acc + a.tx, 0);
}

/**
 * Proyecta el saldo desde el libro de movimientos.
 * El saldo nunca se persiste como valor editable: se calcula sumando
 * el ledger. Esta función se usará del lado del servidor.
 */
export function balanceFromLedger(entries: TxEntry[]): number {
  return entries.reduce((acc, e) => {
    return e.kind === 'redeem' || e.kind === 'reversal'
      ? acc - Math.abs(e.amount)
      : acc + Math.abs(e.amount);
  }, 0);
}

/** Valida que un resultado de partida sea plausible (antifraude base). */
export function validateGameRun(run: GameRun): boolean {
  if (run.stats.score < 0 || run.stats.score > 99999) return false;
  if (run.stats.level < 1 || run.stats.level > 99) return false;
  if (run.stats.catches < 0 || run.stats.catches > 9999) return false;
  if (run.stats.gold < 0 || run.stats.gold > run.stats.catches) return false;
  return run.gameVersion.length > 0;
}
