import { describe, expect, it } from 'vitest';
import {
  balanceFromLedger,
  evaluateAchievements,
  sumTx,
  validateGameRun,
  type TxEntry,
} from '../index';

describe('feature gamification', () => {
  it('evalúa logros ganados en una partida', () => {
    const won = evaluateAchievements([], {
      score: 130,
      level: 3,
      catches: 30,
      gold: 6,
      top3: true,
    });
    expect(won.map((a) => a.id)).toEqual(['c25', 'lv3', 'p120', 'gold5', 'top3']);
  });

  it('no repite logros ya ganados', () => {
    const won = evaluateAchievements(['c25', 'p120'], {
      score: 130,
      level: 3,
      catches: 30,
      gold: 6,
      top3: true,
    });
    expect(won.map((a) => a.id)).toEqual(['lv3', 'gold5', 'top3']);
  });

  it('suma TuesteX de los logros', () => {
    const won = evaluateAchievements([], {
      score: 130,
      level: 3,
      catches: 30,
      gold: 6,
      top3: true,
    });
    expect(sumTx(won)).toBe(10 + 15 + 25 + 20 + 30);
  });

  it('proyecta el saldo desde el ledger', () => {
    const entries: TxEntry[] = [
      { id: '1', kind: 'earn', amount: 25, reason: 'logro', idempotencyKey: 'a', createdAt: '' },
      { id: '2', kind: 'earn', amount: 15, reason: 'logro', idempotencyKey: 'b', createdAt: '' },
      { id: '3', kind: 'redeem', amount: 30, reason: 'canje', idempotencyKey: 'c', createdAt: '' },
    ];
    expect(balanceFromLedger(entries)).toBe(10);
  });

  it('rechaza resultados de partida inválidos', () => {
    expect(
      validateGameRun({
        stats: { score: 130, level: 3, catches: 30, gold: 6, top3: true },
        gameVersion: '1.0',
        submittedAt: '',
      }),
    ).toBe(true);
    expect(
      validateGameRun({
        stats: { score: -5, level: 3, catches: 30, gold: 6, top3: true },
        gameVersion: '1.0',
        submittedAt: '',
      }),
    ).toBe(false);
    expect(
      validateGameRun({
        stats: { score: 130, level: 3, catches: 30, gold: 40, top3: true },
        gameVersion: '1.0',
        submittedAt: '',
      }),
    ).toBe(false);
  });
});
