import { describe, expect, it } from 'vitest';
import { exerciseKey } from '@/engine';
import { buildSheet, levelAt } from './worksheet';

describe('schede', () => {
  it('lo stesso codice dà la stessa scheda', () => {
    const settings = { level: 'progressive', choice: 'all', count: 12, seed: 4242 } as const;
    expect(buildSheet(settings)).toEqual(buildSheet(settings));
    expect(buildSheet({ ...settings, seed: 4243 })).not.toEqual(buildSheet(settings));
  });

  it('una scheda progressiva va dal facile al difficile', () => {
    const levels = Array.from({ length: 12 }, (_, i) => levelAt('progressive', i, 12));
    expect(levels.slice(0, 4).every((l) => l === 'easy')).toBe(true);
    expect(levels.slice(4, 8).every((l) => l === 'medium')).toBe(true);
    expect(levels.slice(8).every((l) => l === 'hard')).toBe(true);
    expect(buildSheet({ level: 'progressive', choice: 'all', count: 12, seed: 7 }).map((e) => e.level)).toEqual(levels);
  });

  it('rispetta la conversione scelta', () => {
    const sheet = buildSheet({ level: 'medium', choice: '8-2', count: 10, seed: 99 });
    expect(sheet).toHaveLength(10);
    for (const ex of sheet) expect([ex.from, ex.to]).toEqual([8, 2]);
    for (const ex of buildSheet({ level: 'easy', choice: 'exotic', count: 6, seed: 5 })) expect(ex.exotic).toBe(true);
  });

  it('nessun esercizio compare due volte nella stessa scheda', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const choice of ['all', '2-10', 'exotic'] as const) {
        const sheet = buildSheet({ level: 'easy', choice, count: 20, seed });
        expect(new Set(sheet.map(exerciseKey)).size).toBe(sheet.length);
      }
    }
  });
});
