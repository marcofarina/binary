import { describe, expect, it } from 'vitest';
import { answer, createGame, endGame, type GameState, LEVEL_UP_AFTER, LIVES, nextRound } from './game';
import { multiplier, points } from './scoring';

function play(state: GameState, outcome: 'correct' | 'wrong') {
  const step = answer(state, outcome);
  return { ...step, state: nextRound(step.state) };
}

describe('punteggio', () => {
  it('moltiplicatore dalla quinta, dalla decima e dalla ventesima risposta di fila', () => {
    expect([1, 4, 5, 9, 10, 19, 20, 99].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3, 5, 5]);
    expect(points('hard', 10)).toBe(120);
  });
});

describe('modalità endless', () => {
  it('tre facili, tre intermedi, poi difficili senza fine', () => {
    let state = createGame('endless', 42);
    const levels: string[] = [];
    for (let i = 0; i < 10; i++) {
      levels.push(state.exercise.level);
      state = play(state, 'correct').state;
    }
    expect(levels).toEqual(['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard']);
    expect(state.maxLevel).toBe('hard');
  });

  it('un errore fa scendere di un livello e per risalire servono di nuovo tre risposte', () => {
    let state = createGame('endless', 7);
    for (let i = 0; i < 2 * LEVEL_UP_AFTER; i++) state = play(state, 'correct').state;
    expect(state.level).toBe('hard');
    const step = play(state, 'wrong');
    expect(step.events.map((e) => e.type)).toEqual(['wrong', 'streakBroken', 'levelDown']);
    state = step.state;
    expect(state.level).toBe('medium');
    expect(state.streak).toBe(0);
    for (let i = 0; i < LEVEL_UP_AFTER - 1; i++) state = play(state, 'correct').state;
    expect(state.level).toBe('medium');
    state = play(state, 'correct').state;
    expect(state.level).toBe('hard');
  });

  it('al livello facile un errore non fa scendere, e i punti non calano mai', () => {
    let state = play(createGame('endless', 1), 'correct').state;
    const step = play(state, 'wrong');
    expect(step.events.map((e) => e.type)).toEqual(['wrong', 'streakBroken']);
    state = step.state;
    expect(state.level).toBe('easy');
    expect(state.score).toBe(10);
    expect(state.over).toBe(false);
  });

  it('streak, traguardi e moltiplicatore', () => {
    let state = createGame('endless', 3);
    const events: string[] = [];
    for (let i = 0; i < 5; i++) {
      const step = play(state, 'correct');
      events.push(...step.events.map((e) => e.type));
      state = step.state;
    }
    expect(events.filter((e) => e === 'milestone')).toHaveLength(1);
    expect(events.filter((e) => e === 'multiplierUp')).toHaveLength(1);
    expect(state.streak).toBe(5);
    // 3 facili × 10 + 1 intermedio × 20 + 1 intermedio × 20 × 2 (quinta di fila).
    expect(state.score).toBe(30 + 20 + 40);
  });

  it('termina quando lo studente lo chiede', () => {
    const state = endGame(createGame('endless', 1));
    expect(state.over).toBe(true);
    expect(answer(state, 'correct').events).toEqual([]);
  });
});

describe('modalità a vite', () => {
  it('tre vite, poi la partita finisce', () => {
    let state = createGame('lives', 9);
    expect(state.lives).toBe(LIVES);
    for (let i = 0; i < LIVES - 1; i++) state = play(state, 'wrong').state;
    const last = answer(state, 'wrong');
    expect(last.events.map((e) => e.type)).toContain('gameOver');
    expect(last.state.over).toBe(true);
  });

  it('la difficoltà è mista e cresce con i turni', () => {
    let state = createGame('lives', 11);
    const levels: string[] = [];
    for (let i = 0; i < 60; i++) {
      levels.push(state.exercise.level);
      state = play(state, 'correct').state;
    }
    expect(levels.slice(0, 3)).not.toContain('hard');
    expect(new Set(levels.slice(10))).toEqual(new Set(['easy', 'medium', 'hard']));
  });
});

describe('codice sfida', () => {
  it('lo stesso seme dà la stessa sequenza di esercizi', () => {
    const run = (seed: number) => {
      let state = createGame('endless', seed);
      const seen = [];
      for (let i = 0; i < 12; i++) {
        seen.push(state.exercise.source);
        state = play(state, i === 5 ? 'wrong' : 'correct').state;
      }
      return seen;
    };
    expect(run(123456)).toEqual(run(123456));
    expect(run(123456)).not.toEqual(run(654321));
  });
});
