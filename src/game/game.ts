import { createRng, type Exercise, exerciseKey, generate, type Level, LEVELS, type Rng } from '@/engine';
import { MILESTONES, multiplier, points } from './scoring';

/*
 * Logica della sfida, pura e serializzabile: lo stato contiene tutto, gli eventi dicono all’interfaccia che cosa
 * festeggiare. Ogni esercizio nasce da (seme, numero del turno), così uno stesso codice sfida dà a tutta la classe
 * la stessa sequenza finché le risposte coincidono. Un esercizio già proposto nella partita non torna mai: lo stato
 * tiene le chiavi di tutti quelli visti, più quelli delle partite precedenti che l’interfaccia passa a `createGame`.
 */

export type Mode = 'endless' | 'lives';

/** Risposte giuste di fila per salire di livello nella modalità endless. */
export const LEVEL_UP_AFTER = 3;
/** Vite della modalità a vite. */
export const LIVES = 3;

export interface GameState {
  mode: Mode;
  seed: number;
  /** Numero del turno, da 0. */
  round: number;
  level: Level;
  /** Risposte giuste di fila nel livello corrente (endless). */
  levelProgress: number;
  streak: number;
  bestStreak: number;
  score: number;
  correct: number;
  wrong: number;
  lives: number;
  /** Il livello più alto raggiunto. */
  maxLevel: Level;
  exercise: Exercise;
  /** Chiavi (`exerciseKey`) degli esercizi da non riproporre: quelli della partita, compreso il corrente, e lo storico. */
  seen: readonly string[];
  over: boolean;
}

export type GameEvent =
  | { type: 'correct'; points: number; multiplier: number; streak: number }
  | { type: 'multiplierUp'; multiplier: number }
  | { type: 'milestone'; streak: number }
  | { type: 'levelUp'; level: Level }
  | { type: 'wrong' }
  | { type: 'streakBroken'; streak: number }
  | { type: 'levelDown'; level: Level }
  | { type: 'lifeLost'; lives: number }
  | { type: 'gameOver' };

/** Seme del turno: mescola seme e turno, così i turni sono indipendenti tra loro. */
function roundRng(seed: number, round: number): Rng {
  return createRng(Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(round + 1, 0xc2b2ae35));
}

/** Nella modalità a vite la difficoltà è mista e cresce piano: prima facili, poi tutto, poi soprattutto difficili. */
function mixedLevel(rng: Rng, round: number): Level {
  const weights: readonly [number, number, number] = round < 3 ? [2, 1, 0] : round < 10 ? [1, 2, 1] : [1, 1, 2];
  let r = rng() * (weights[0] + weights[1] + weights[2]);
  for (const [i, level] of LEVELS.entries()) {
    r -= weights[i] ?? 0;
    if (r < 0) return level;
  }
  return 'hard';
}

function exerciseFor(
  mode: Mode,
  seed: number,
  round: number,
  level: Level,
  seen: readonly string[],
  previous?: Exercise,
): Exercise {
  const rng = roundRng(seed, round);
  const actual = mode === 'lives' ? mixedLevel(rng, round) : level;
  return generate(actual, rng, previous ? { previous, seen: new Set(seen) } : { seen: new Set(seen) });
}

const rank = (level: Level) => LEVELS.indexOf(level);

/**
 * Nuova partita. `history` sono le chiavi di esercizi già visti in partite precedenti: non verranno riproposti. Con un
 * codice sfida nuovo l’interfaccia non passa storico, così tutta la classe parte dalla stessa sequenza.
 */
export function createGame(mode: Mode, seed: number, history: readonly string[] = []): GameState {
  const level: Level = 'easy';
  const exercise = exerciseFor(mode, seed, 0, level, history);
  return {
    mode,
    seed,
    round: 0,
    level: mode === 'lives' ? exercise.level : level,
    levelProgress: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    lives: mode === 'lives' ? LIVES : 0,
    maxLevel: mode === 'lives' ? exercise.level : level,
    exercise,
    seen: [...history, exerciseKey(exercise)],
    over: false,
  };
}

export interface Step {
  state: GameState;
  events: GameEvent[];
}

/** Registra l’esito della risposta al turno corrente. Il prossimo esercizio arriva con `nextRound`. */
export function answer(state: GameState, outcome: 'correct' | 'wrong'): Step {
  if (state.over) return { state, events: [] };
  const events: GameEvent[] = [];
  const level = state.exercise.level;

  if (outcome === 'correct') {
    const streak = state.streak + 1;
    const gained = points(level, streak);
    events.push({ type: 'correct', points: gained, multiplier: multiplier(streak), streak });
    if (multiplier(streak) > multiplier(state.streak))
      events.push({ type: 'multiplierUp', multiplier: multiplier(streak) });
    if (MILESTONES.includes(streak)) events.push({ type: 'milestone', streak });

    let nextLevel = state.level;
    let progress = state.levelProgress + 1;
    if (state.mode === 'endless' && progress >= LEVEL_UP_AFTER && rank(state.level) < LEVELS.length - 1) {
      nextLevel = LEVELS[rank(state.level) + 1] as Level;
      progress = 0;
      events.push({ type: 'levelUp', level: nextLevel });
    }
    return {
      state: {
        ...state,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        score: state.score + gained,
        correct: state.correct + 1,
        level: nextLevel,
        levelProgress: progress,
        maxLevel: rank(nextLevel) > rank(state.maxLevel) ? nextLevel : state.maxLevel,
      },
      events,
    };
  }

  events.push({ type: 'wrong' });
  if (state.streak > 0) events.push({ type: 'streakBroken', streak: state.streak });
  let next: GameState = { ...state, streak: 0, wrong: state.wrong + 1, levelProgress: 0 };
  if (state.mode === 'endless') {
    if (rank(state.level) > 0) {
      next = { ...next, level: LEVELS[rank(state.level) - 1] as Level };
      events.push({ type: 'levelDown', level: next.level });
    }
  } else {
    next = { ...next, lives: state.lives - 1 };
    events.push({ type: 'lifeLost', lives: next.lives });
    if (next.lives <= 0) {
      next = { ...next, over: true };
      events.push({ type: 'gameOver' });
    }
  }
  return { state: next, events };
}

/** Passa al turno successivo con un nuovo esercizio. */
export function nextRound(state: GameState): GameState {
  if (state.over) return state;
  const round = state.round + 1;
  const exercise = exerciseFor(state.mode, state.seed, round, state.level, state.seen, state.exercise);
  const level = state.mode === 'lives' ? exercise.level : state.level;
  return {
    ...state,
    round,
    exercise,
    seen: [...state.seen, exerciseKey(exercise)],
    level,
    maxLevel: rank(level) > rank(state.maxLevel) ? level : state.maxLevel,
  };
}

/** Chiude la partita (il pulsante “Termina” della modalità endless). */
export function endGame(state: GameState): GameState {
  return { ...state, over: true };
}

export function accuracy(state: GameState): number {
  const total = state.correct + state.wrong;
  return total === 0 ? 0 : state.correct / total;
}

/** Il codice sfida è un seme da 1 a 999 999, corto da dettare in classe. */
export { isSeed, MAX_SEED } from '@/engine';
export function randomSeed(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * 999_999);
}
