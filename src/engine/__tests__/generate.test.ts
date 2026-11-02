import { describe, expect, it } from 'vitest';
import { EXOTIC_BASES, generate, KINDS, LEVELS } from '../generate';
import { formatNumeral } from '../numeral';
import { createRng } from '../random';

const STANDARD = [2, 8, 10, 16];

describe('generatore', () => {
  it('dallo stesso seme nasce la stessa sequenza', () => {
    const run = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 20 }, () => generate('hard', rng));
    };
    expect(run(4827)).toEqual(run(4827));
    expect(run(4827)).not.toEqual(run(4828));
  });

  it('rispetta conversioni e intervalli di ogni livello', () => {
    const rng = createRng(1);
    for (const level of LEVELS) {
      for (let i = 0; i < 500; i++) {
        const ex = generate(level, rng);
        expect(ex.source).toBe(formatNumeral(ex.value, ex.from));
        expect(ex.answer).toBe(formatNumeral(ex.value, ex.to));
        if (ex.exotic) continue;
        const kind = KINDS[level].find((k) => k.from === ex.from && k.to === ex.to);
        expect(kind, `${level}: ${ex.from} → ${ex.to}`).toBeDefined();
        expect(ex.value).toBeGreaterThanOrEqual(kind?.min ?? 0);
        expect(ex.value).toBeLessThanOrEqual(kind?.max ?? 0);
      }
    }
  });

  it('evita i numerali banali', () => {
    const rng = createRng(2);
    for (let i = 0; i < 1000; i++) {
      const ex = generate('easy', rng);
      expect(ex.source).not.toMatch(/^(.)\1*$|^10+$/);
      expect(ex.answer).not.toMatch(/^(.)\1*$|^10+$/);
    }
  });

  it('propone le basi esotiche solo nel difficile, circa una volta su dieci', () => {
    const rng = createRng(3);
    for (const level of ['easy', 'medium'] as const) {
      for (let i = 0; i < 500; i++) expect(generate(level, rng).exotic).toBe(false);
    }
    const hard = Array.from({ length: 4000 }, () => generate('hard', rng));
    const exotic = hard.filter((ex) => ex.exotic);
    expect(exotic.length / hard.length).toBeGreaterThan(0.07);
    expect(exotic.length / hard.length).toBeLessThan(0.13);
    for (const ex of exotic) {
      expect(EXOTIC_BASES.includes(ex.from) || EXOTIC_BASES.includes(ex.to)).toBe(true);
      expect(ex.from === 10 || ex.to === 10 || (!STANDARD.includes(ex.from) && !STANDARD.includes(ex.to))).toBe(true);
    }
  });

  it('non ripropone subito la stessa conversione', () => {
    const rng = createRng(5);
    let previous = generate('medium', rng);
    for (let i = 0; i < 300; i++) {
      const next = generate('medium', rng, { previous });
      expect([next.from, next.to]).not.toEqual([previous.from, previous.to]);
      previous = next;
    }
  });
});
