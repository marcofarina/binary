import type { Level } from '@/engine';

/** Punti base di una risposta giusta, per livello. */
export const BASE_POINTS: Record<Level, number> = { easy: 10, medium: 20, hard: 40 };

/** Soglie della streak: dalla quinta risposta giusta di fila ×2, dalla decima ×3, dalla ventesima ×5. */
export const MULTIPLIERS: readonly { from: number; factor: number }[] = [
  { from: 20, factor: 5 },
  { from: 10, factor: 3 },
  { from: 5, factor: 2 },
];

/** Moltiplicatore per una streak di `streak` risposte giuste (compresa quella appena data). */
export function multiplier(streak: number): number {
  return MULTIPLIERS.find((m) => streak >= m.from)?.factor ?? 1;
}

export function points(level: Level, streak: number): number {
  return BASE_POINTS[level] * multiplier(streak);
}

/** Traguardi della streak che meritano una festa. */
export const MILESTONES: readonly number[] = [5, 10, 20, 50, 100];
