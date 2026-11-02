/**
 * Generatore pseudocasuale con seme (mulberry32), lo stesso di Enigma: dallo stesso seme nasce sempre la stessa
 * sequenza di esercizi, così un docente può dare a tutta la classe lo stesso codice sfida.
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Intero tra `min` e `max` compresi. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[int(rng, 0, items.length - 1)];
  if (item === undefined) throw new RangeError('Nessun elemento da scegliere.');
  return item;
}

/** Copia mescolata (Fisher–Yates). */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** Semi da 1 a 999 999: abbastanza per non ripetersi in una classe, corti da dettare. */
export const MAX_SEED = 999_999;

export function isSeed(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_SEED;
}
