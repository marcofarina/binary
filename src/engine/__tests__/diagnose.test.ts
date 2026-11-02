import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { check, type Diagnosis } from '../diagnose';
import { DIGITS } from '../digits';
import type { Exercise } from '../generate';
import { formatNumeral } from '../numeral';
import { solve, type Steps } from '../steps';

function stepCount(steps: Steps): number {
  switch (steps.method) {
    case 'positional':
      return steps.terms.length;
    case 'division':
      return steps.rows.length;
    case 'grouping':
      return steps.groups.length;
    default:
      return 0;
  }
}

function exercise(source: string, from: number, to: number): Exercise {
  const value = parseInt(source, from);
  return { level: 'hard', from, to, value, source, answer: formatNumeral(value, to), exotic: false };
}

function diagnosisOf(source: string, from: number, to: number, answer: string, intermediate?: string): Diagnosis {
  const result = check(exercise(source, from, to), answer, intermediate === undefined ? {} : { intermediate });
  if (result.verdict !== 'wrong') throw new Error(`Atteso un errore, ottenuto ${result.verdict}`);
  return result.diagnosis;
}

describe('verifica della risposta', () => {
  it('riconosce la risposta giusta anche scritta in modo libero', () => {
    expect(check(exercise('1011', 2, 16), '0x0b').verdict).toBe('correct');
    expect(check(exercise('255', 10, 2), '1111 1111').verdict).toBe('correct');
  });

  it('una cifra non valida non conta come errore', () => {
    expect(check(exercise('13', 10, 2), '1021')).toEqual({
      verdict: 'invalid',
      error: { kind: 'invalidDigit', char: '2', index: 2 },
    });
    expect(check(exercise('13', 10, 2), '').verdict).toBe('invalid');
  });
});

describe('divisioni successive', () => {
  it('resti letti dall’alto invece che dal basso', () => {
    expect(diagnosisOf('13', 10, 2, '1011')).toMatchObject({ kind: 'reversedRemainders' });
    // 12 = 1100₂: chi legge al contrario scrive 0011, cioè 11.
    expect(diagnosisOf('12', 10, 2, '0011')).toMatchObject({ kind: 'reversedRemainders' });
  });

  it('resto oltre il 9 scritto in decimale', () => {
    expect(diagnosisOf('171', 10, 16, '1011')).toEqual({
      kind: 'remainderNotDigit',
      confidence: 'likely',
      phase: null,
      index: 0,
    });
  });

  it('indica la divisione del primo resto sbagliato', () => {
    // 22 = 10110₂: il resto della seconda divisione (riga 1) è 1, non 0.
    expect(diagnosisOf('22', 10, 2, '10100')).toEqual({
      kind: 'wrongRemainder',
      confidence: 'exact',
      phase: null,
      index: 1,
    });
  });

  it('divisioni interrotte troppo presto o cifre in più', () => {
    expect(diagnosisOf('22', 10, 2, '110')).toMatchObject({ kind: 'missingDivisions', index: 3 });
    expect(diagnosisOf('22', 10, 2, '110110')).toMatchObject({ kind: 'extraDigits' });
  });

  it('una sola cifra cambiata indica sempre la sua divisione', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100_000 }),
        fc.integer({ min: 2, max: 16 }),
        fc.nat(),
        fc.nat(),
        (value, base, position, shift) => {
          fc.pre(base !== 10);
          const answer = formatNumeral(value, base);
          const i = position % answer.length;
          const char = answer[answer.length - 1 - i] as string;
          const replacement = DIGITS[(DIGITS.indexOf(char) + 1 + (shift % (base - 1))) % base] as string;
          fc.pre(!(i === answer.length - 1 && replacement === '0'));
          const wrong = answer.slice(0, answer.length - 1 - i) + replacement + answer.slice(answer.length - i);
          const result = check(exercise(String(value), 10, base), wrong);
          fc.pre(result.verdict === 'wrong');
          if (result.verdict !== 'wrong') return;
          if (result.diagnosis.kind === 'wrongRemainder') expect(result.diagnosis.index).toBe(i);
          else expect(['reversedRemainders', 'remainderNotDigit']).toContain(result.diagnosis.kind);
        },
      ),
    );
  });
});

describe('somma pesata', () => {
  it('esponenti partiti da 1', () => {
    expect(diagnosisOf('1011', 2, 10, '22')).toMatchObject({ kind: 'exponentsFromOne' });
  });

  it('pesi assegnati da sinistra', () => {
    expect(diagnosisOf('1011', 2, 10, '13')).toMatchObject({ kind: 'weightsReversed' });
  });

  it('termine dimenticato o contato due volte', () => {
    expect(diagnosisOf('1011', 2, 10, '3')).toMatchObject({ kind: 'missingTerm', index: 0 });
    expect(diagnosisOf('1011', 2, 10, '19')).toMatchObject({ kind: 'doubledTerm', index: 0 });
  });

  it('potenza sbagliata', () => {
    // 123₈ = 64 + 16 + 3 = 83; con 1 × 8³ al posto di 1 × 8² si ottiene 531.
    expect(diagnosisOf('123', 8, 10, '531')).toMatchObject({ kind: 'wrongPower', index: 0 });
  });

  it('lettera esadecimale con il valore sbagliato', () => {
    // B3₁₆ = 179; leggendo B come 12 si ottiene 195.
    expect(diagnosisOf('B3', 16, 10, '195')).toMatchObject({ kind: 'letterValue', index: 0 });
  });

  it('errore di calcolo senza ipotesi', () => {
    expect(diagnosisOf('B3', 16, 10, '178')).toEqual({
      kind: 'sumError',
      confidence: 'unknown',
      phase: null,
      index: null,
    });
  });
});

describe('gruppi di bit', () => {
  it('raggruppamento partito da sinistra', () => {
    // 101101₂ = 10 1101 = 2D; da sinistra 1011 01 = B1.
    expect(diagnosisOf('101101', 2, 16, 'B1')).toMatchObject({ kind: 'groupedFromLeft' });
  });

  it('indica il gruppo sbagliato', () => {
    expect(diagnosisOf('101101', 2, 16, '3D')).toEqual({
      kind: 'wrongGroup',
      confidence: 'exact',
      phase: null,
      index: 0,
    });
    expect(diagnosisOf('101101', 2, 16, 'D')).toMatchObject({ kind: 'missingGroups', index: 0 });
  });

  it('cifra espansa senza completare il gruppo', () => {
    // 41₈ = 100 001; scrivendo 1 invece di 001 si ottiene 1001.
    expect(diagnosisOf('41', 8, 2, '1001')).toMatchObject({ kind: 'groupNotPadded', index: 1 });
  });

  it('indica la cifra espansa male', () => {
    expect(diagnosisOf('41', 8, 2, '100011')).toEqual({
      kind: 'wrongGroup',
      confidence: 'exact',
      phase: null,
      index: 1,
    });
  });
});

describe('conversioni in due fasi', () => {
  it('passando dal decimale, un errore tipico della prima fase spiega la risposta', () => {
    // 123₅ = 38; con gli esponenti da 1 si ottiene 190 = 361₇.
    expect(diagnosisOf('123', 5, 7, formatNumeral(190, 7))).toMatchObject({
      kind: 'exponentsFromOne',
      phase: 'first',
    });
  });

  it('con il valore intermedio si sa in quale fase sta l’errore', () => {
    // 38 = 53₇: resti letti al contrario.
    expect(diagnosisOf('123', 5, 7, '35', '38')).toMatchObject({ kind: 'reversedRemainders', phase: 'second' });
    expect(diagnosisOf('123', 5, 7, '55', '40')).toMatchObject({ kind: 'sumError', phase: 'first' });
  });

  it('senza valore intermedio e senza ipotesi la fase resta incerta', () => {
    expect(diagnosisOf('123', 5, 7, '54')).toMatchObject({ kind: 'unknownPhase', confidence: 'unknown' });
  });

  it('passando dal binario: raggruppamento da sinistra o cifra non completata', () => {
    // 75₈ = 111 101 = 11 1101 = 3D; da sinistra 1111 01 = F1.
    expect(diagnosisOf('75', 8, 16, 'F1')).toMatchObject({ kind: 'groupedFromLeft', phase: 'second' });
    // 41₈ = 100 001 = 10 0001 = 21; senza completare il gruppo: 1001 = 9.
    expect(diagnosisOf('41', 8, 16, '9')).toMatchObject({ kind: 'groupNotPadded', phase: 'first', index: 1 });
  });

  it('passando dal binario: un errore dentro una sola cifra di partenza è nella prima fase', () => {
    // 75₈ → 3D; se il 5 diventa 4 (100): 111 100 = 3C.
    expect(diagnosisOf('75', 8, 16, '3C')).toMatchObject({ kind: 'wrongGroup', phase: 'first', index: 1 });
  });

  it('qualunque risposta sbagliata riceve una diagnosi', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 70_000 }),
        fc.integer({ min: 0, max: 70_000 }),
        fc.integer({ min: 2, max: 16 }),
        fc.integer({ min: 2, max: 16 }),
        (value, wrong, from, to) => {
          fc.pre(from !== to && value !== wrong);
          const result = check(exercise(formatNumeral(value, from), from, to), formatNumeral(wrong, to));
          expect(result.verdict).toBe('wrong');
          if (result.verdict !== 'wrong') return;
          const steps = solve(formatNumeral(value, from), from, to);
          expect(result.steps).toEqual(steps);
          const { index, phase } = result.diagnosis;
          if (index === null) return;
          const part =
            steps.method === 'via-binary' || steps.method === 'via-decimal'
              ? phase === 'second'
                ? steps.second
                : steps.first
              : steps;
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(stepCount(part));
        },
      ),
    );
  });
});
