import type { Base } from './digits';
import { formatNumeral } from './numeral';
import { int, pick, type Rng } from './random';

export const LEVELS = ['easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

/** Un esercizio: convertire `source`, scritto in base `from`, nella base `to`. */
export interface Exercise {
  level: Level;
  from: Base;
  to: Base;
  value: number;
  source: string;
  /** La risposta attesa, senza zeri iniziali. */
  answer: string;
  /** Vero per le basi diverse da 2, 8, 10 e 16. */
  exotic: boolean;
}

interface Kind {
  from: Base;
  to: Base;
  min: number;
  max: number;
}

const k = (from: Base, to: Base, min: number, max: number): Kind => ({ from, to, min, max });

/** Conversioni e intervalli dei valori per livello (proposta del piano, da calibrare con le classi). */
export const KINDS: Record<Level, readonly Kind[]> = {
  easy: [k(2, 10, 8, 63), k(10, 2, 8, 63), k(2, 16, 16, 63)],
  medium: [
    k(2, 10, 64, 255),
    k(10, 2, 64, 255),
    k(8, 10, 64, 511),
    k(10, 8, 64, 511),
    k(16, 10, 256, 4095),
    k(10, 16, 256, 4095),
    k(2, 8, 64, 4095),
    k(8, 2, 64, 4095),
    k(2, 16, 256, 4095),
    k(16, 2, 256, 4095),
  ],
  hard: [
    k(2, 10, 256, 4095),
    k(10, 2, 256, 4095),
    k(8, 10, 512, 32767),
    k(10, 8, 512, 32767),
    k(16, 10, 4096, 65535),
    k(10, 16, 4096, 65535),
    k(2, 8, 4096, 65535),
    k(8, 2, 4096, 32767),
    k(2, 16, 4096, 65535),
    k(16, 2, 4096, 65535),
    k(8, 16, 512, 65535),
    k(16, 8, 256, 65535),
  ],
};

/** Basi “esotiche”: compaiono solo nel livello difficile, circa una volta su dieci. */
export const EXOTIC_BASES: readonly Base[] = [3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15];
export const EXOTIC_RATE = 0.1;
const EXOTIC_RANGE = { min: 20, max: 999 };

function exoticKind(rng: Rng): Kind {
  const base = pick(rng, EXOTIC_BASES);
  const shape = int(rng, 0, 2);
  if (shape === 0) return k(base, 10, EXOTIC_RANGE.min, EXOTIC_RANGE.max);
  if (shape === 1) return k(10, base, EXOTIC_RANGE.min, EXOTIC_RANGE.max);
  const other = pick(
    rng,
    EXOTIC_BASES.filter((b) => b !== base),
  );
  return k(base, other, EXOTIC_RANGE.min, EXOTIC_RANGE.max);
}

/** Numerali che non allenano niente: una sola cifra, tutte cifre uguali (`1111`, `FF`), o un 1 seguito da zeri. */
function isTrivial(digits: string): boolean {
  return digits.length < 2 || /^(.)\1*$/.test(digits) || /^10+$/.test(digits);
}

export interface GenerateOptions {
  /** L’esercizio precedente: si evita di riproporre subito la stessa conversione. */
  previous?: Pick<Exercise, 'from' | 'to'>;
}

export function generate(level: Level, rng: Rng, options: GenerateOptions = {}): Exercise {
  const exotic = level === 'hard' && rng() < EXOTIC_RATE;
  let kind = exotic ? exoticKind(rng) : pick(rng, KINDS[level]);
  const { previous } = options;
  if (!exotic && previous && kind.from === previous.from && kind.to === previous.to) {
    const others = KINDS[level].filter((c) => c.from !== previous.from || c.to !== previous.to);
    if (others.length > 0) kind = pick(rng, others);
  }
  for (let attempt = 0; ; attempt++) {
    const value = int(rng, kind.min, kind.max);
    const source = formatNumeral(value, kind.from);
    const answer = formatNumeral(value, kind.to);
    if (attempt < 50 && (isTrivial(source) || isTrivial(answer))) continue;
    return { level, from: kind.from, to: kind.to, value, source, answer, exotic };
  }
}
