import { type Base, createRng, type Exercise, generate, type GenerateOptions, type Level, LEVELS } from '@/engine';

/** Livello di una scheda: uno solo, oppure progressivo (un terzo facile, un terzo intermedio, un terzo difficile). */
export type SheetLevel = Level | 'progressive';
/** Conversione di una scheda: tutte quelle del livello, una coppia `da-a` oppure le basi esotiche. */
export type SheetChoice = 'all' | `${number}-${number}` | 'exotic';

export interface SheetSettings {
  level: SheetLevel;
  choice: SheetChoice;
  count: number;
  seed: number;
}

export const SHEET_COUNTS = [6, 8, 10, 12, 16, 20] as const;

/** Il livello dell’esercizio `i` su `count`. */
export function levelAt(level: SheetLevel, i: number, count: number): Level {
  if (level !== 'progressive') return level;
  return LEVELS[Math.min(LEVELS.length - 1, Math.floor((i * LEVELS.length) / count))] ?? 'easy';
}

function onlyOf(choice: SheetChoice): GenerateOptions['only'] {
  if (choice === 'all') return undefined;
  if (choice === 'exotic') return 'exotic';
  const [from, to] = choice.split('-').map(Number) as [Base, Base];
  return { from, to };
}

/** La scheda dipende solo dalle impostazioni: con lo stesso codice si rigenera identica, soluzioni comprese. */
export function buildSheet({ level, choice, count, seed }: SheetSettings): Exercise[] {
  const rng = createRng(seed);
  const only = onlyOf(choice);
  const exercises: Exercise[] = [];
  for (let i = 0; i < count; i++) {
    const previous = exercises.at(-1);
    const options: GenerateOptions = {};
    if (previous) options.previous = previous;
    if (only) options.only = only;
    exercises.push(generate(levelAt(level, i, count), rng, options));
  }
  return exercises;
}
