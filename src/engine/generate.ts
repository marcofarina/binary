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

/** Conversioni e intervalli dei valori per livello. Coppie decise da Marco il 2 novembre 2026: facile solo decimale con binario e ottale; intermedio aggiunge l’esadecimale e i passaggi diretti dal binario; difficile aggiunge ottale ↔ esadecimale e le basi esotiche. Intervalli da calibrare con le classi. */
export const KINDS: Record<Level, readonly Kind[]> = {
  easy: [k(2, 10, 8, 63), k(10, 2, 8, 63), k(8, 10, 8, 63), k(10, 8, 8, 63)],
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
  /**
   * Solo una conversione (allenamento). Se il livello non la prevede, si usa l’intervallo del livello più vicino
   * che la prevede; `'exotic'` chiede le basi esotiche a qualunque livello.
   */
  only?: Pick<Exercise, 'from' | 'to'> | 'exotic';
}

/** Le conversioni proposte in allenamento: tutte quelle dei livelli, senza ripetizioni. */
export const PRACTICE_PAIRS: readonly Pick<Exercise, 'from' | 'to'>[] = LEVELS.flatMap((level) => KINDS[level])
  .map(({ from, to }) => ({ from, to }))
  .filter((pair, i, all) => all.findIndex((p) => p.from === pair.from && p.to === pair.to) === i);

function kindFor(level: Level, pair: Pick<Exercise, 'from' | 'to'>): Kind {
  const order = [...LEVELS].sort(
    (a, b) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(level)) - Math.abs(LEVELS.indexOf(b) - LEVELS.indexOf(level)),
  );
  for (const candidate of order) {
    const kind = KINDS[candidate].find((c) => c.from === pair.from && c.to === pair.to);
    if (kind) return kind;
  }
  throw new RangeError(`Conversione non prevista: ${pair.from} → ${pair.to}.`);
}

export function generate(level: Level, rng: Rng, options: GenerateOptions = {}): Exercise {
  const { previous, only } = options;
  const exotic = only === 'exotic' || (only === undefined && level === 'hard' && rng() < EXOTIC_RATE);
  let kind = exotic ? exoticKind(rng) : only ? kindFor(level, only) : pick(rng, KINDS[level]);
  if (!exotic && !only && previous && kind.from === previous.from && kind.to === previous.to) {
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
