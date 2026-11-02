import type { Mode } from '@/game/game';

/** Record personali, solo in questo browser: niente account, niente dati personali. */
export interface Record {
  bestScore: number;
  bestStreak: number;
}

export type Records = { [mode in Mode]?: Record };

const KEY = 'binary-records';

export function loadRecords(): Records {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Records) : {};
  } catch {
    return {};
  }
}

/** Salva i risultati della partita e dice quali record sono stati battuti. */
export function saveResult(mode: Mode, score: number, streak: number): { score: boolean; streak: boolean } {
  const records = loadRecords();
  const previous = records[mode] ?? { bestScore: 0, bestStreak: 0 };
  const beaten = { score: score > previous.bestScore, streak: streak > previous.bestStreak };
  records[mode] = {
    bestScore: Math.max(score, previous.bestScore),
    bestStreak: Math.max(streak, previous.bestStreak),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Archiviazione non disponibile: i record valgono solo per questa partita.
  }
  return beaten;
}
