import type { Exercise } from './generate';
import { formatNumeral, type ParseError, parseNumeral, stripLeadingZeros, valueOf } from './numeral';
import {
  type DivisionSteps,
  expandSteps,
  type GroupingSteps,
  groupSteps,
  type PositionalSteps,
  solve,
  type Steps,
} from './steps';

/*
 * Diagnosi del primo errore. Lo studente scrive solo il risultato, quindi il motore ricostruisce dove
 * probabilmente ha sbagliato confrontando la sua risposta con il procedimento corretto:
 * - divisioni successive e gruppi di bit: ogni cifra della risposta nasce da un passo preciso, quindi la prima
 *   cifra diversa (contando da destra) indica il passo sbagliato;
 * - somma pesata: si vede solo il totale, quindi si confronta la differenza con gli errori tipici; se nessuno la
 *   spiega, l’errore resta “di calcolo”, senza indicare una riga.
 */

export type DiagnosisKind =
  // divisioni successive
  | 'reversedRemainders'
  | 'remainderNotDigit'
  | 'wrongRemainder'
  | 'missingDivisions'
  // somma pesata
  | 'exponentsFromOne'
  | 'weightsReversed'
  | 'missingTerm'
  | 'doubledTerm'
  | 'wrongPower'
  | 'letterValue'
  | 'sumError'
  // gruppi di bit
  | 'groupedFromLeft'
  | 'groupNotPadded'
  | 'wrongGroup'
  | 'missingGroups'
  // comuni
  | 'extraDigits'
  | 'unknownPhase';

export interface Diagnosis {
  kind: DiagnosisKind;
  /** `exact`: il passo indicato è certamente il primo diverso; `likely`: ipotesi; `unknown`: nessuna ipotesi. */
  confidence: 'exact' | 'likely' | 'unknown';
  /** Nelle conversioni in due fasi, la fase in cui sta l’errore. */
  phase: 'first' | 'second' | null;
  /**
   * Il passo da evidenziare nel procedimento della fase: indice della riga di divisione (dalla prima divisione),
   * del termine della somma (da sinistra) o del gruppo di bit (da sinistra). `null` se riguarda tutto il passo.
   */
  index: number | null;
}

export type Check =
  /** Risposta illeggibile nella base richiesta: non conta come errore. */
  | { verdict: 'invalid'; error: ParseError }
  | { verdict: 'correct'; steps: Steps }
  | { verdict: 'wrong'; steps: Steps; diagnosis: Diagnosis; answer: string };

export interface CheckOptions {
  /** Il valore decimale intermedio, facoltativo, nelle conversioni che passano dal decimale. */
  intermediate?: string;
}

export function check(exercise: Exercise, text: string, options: CheckOptions = {}): Check {
  const parsed = parseNumeral(text, exercise.to);
  if (!parsed.ok) return { verdict: 'invalid', error: parsed.error };
  const steps = solve(exercise.source, exercise.from, exercise.to);
  if (parsed.value === exercise.value) return { verdict: 'correct', steps };
  return { verdict: 'wrong', steps, answer: parsed.digits, diagnosis: diagnose(steps, parsed.digits, options) };
}

/** Diagnosi di una risposta sbagliata (cifre già normalizzate, nella base di arrivo). */
export function diagnose(steps: Steps, answer: string, options: CheckOptions = {}): Diagnosis {
  switch (steps.method) {
    case 'positional':
      return positional(steps, Number(answer)) ?? result('sumError', 'unknown', null);
    case 'division':
      return division(steps, answer);
    case 'grouping':
      return steps.direction === 'group' ? grouping(steps, answer) : expansion(steps, answer);
    case 'via-decimal':
      return viaDecimal(steps.first as PositionalSteps, steps.second as DivisionSteps, answer, options);
    case 'via-binary':
      return viaBinary(steps.first as GroupingSteps, steps.second as GroupingSteps, answer);
  }
}

function result(
  kind: DiagnosisKind,
  confidence: Diagnosis['confidence'],
  index: number | null,
  phase: Diagnosis['phase'] = null,
): Diagnosis {
  return { kind, confidence, phase, index };
}

const reverse = (text: string) => [...text].reverse().join('');

/** Indice (contato da destra, da 0) del primo carattere diverso tra le parti comuni, oppure -1. */
function firstMismatchFromRight(a: string, b: string): number {
  const ra = reverse(a);
  const rb = reverse(b);
  for (let i = 0; i < Math.min(ra.length, rb.length); i++) if (ra[i] !== rb[i]) return i;
  return -1;
}

// --- Divisioni successive ---------------------------------------------------------------------------------------

function division(steps: DivisionSteps, answer: string): Diagnosis {
  const expected = steps.result;
  if (expected.length > 1 && stripLeadingZeros(reverse(expected)) === answer) {
    return result('reversedRemainders', 'likely', null);
  }
  if (steps.base > 10) {
    const spelled = steps.rows
      .map((row) => String(row.remainder))
      .reverse()
      .join('');
    if (answer === spelled) {
      return result(
        'remainderNotDigit',
        'likely',
        steps.rows.findIndex((row) => row.remainder >= 10),
      );
    }
  }
  const row = firstMismatchFromRight(answer, expected);
  if (row >= 0) return result('wrongRemainder', 'exact', row);
  if (answer.length < expected.length) return result('missingDivisions', 'exact', answer.length);
  return result('extraDigits', 'likely', null);
}

// --- Somma pesata -----------------------------------------------------------------------------------------------

/** Prova gli errori tipici della somma pesata; `null` se nessuno spiega il valore dato. */
function positional(steps: PositionalSteps, value: number): Diagnosis | null {
  const { base, terms, total } = steps;
  const diff = value - total;
  if (value === total * base) return result('exponentsFromOne', 'likely', null);
  if (steps.digits.length > 1 && value === valueOf(reverse(steps.digits), base)) {
    return result('weightsReversed', 'likely', null);
  }
  const checks: [DiagnosisKind, (t: (typeof terms)[number]) => boolean][] = [
    ['missingTerm', (t) => t.product !== 0 && diff === -t.product],
    ['doubledTerm', (t) => t.product !== 0 && diff === t.product],
    [
      'wrongPower',
      (t) =>
        t.digitValue !== 0 &&
        (diff === t.product * base - t.product || (t.exponent > 0 && diff === t.product / base - t.product)),
    ],
    [
      'letterValue',
      (t) =>
        t.digitValue >= 10 &&
        diff % t.weight === 0 &&
        Number.isInteger(t.digitValue + diff / t.weight) &&
        t.digitValue + diff / t.weight >= 10 &&
        t.digitValue + diff / t.weight <= 15,
    ],
  ];
  for (const [kind, matches] of checks) {
    const index = terms.findIndex(matches);
    if (index >= 0) return result(kind, 'likely', index);
  }
  return null;
}

// --- Gruppi di bit ----------------------------------------------------------------------------------------------

/** Raggruppamento sbagliato: da sinistra, con l’ultimo gruppo più corto letto così com’è. */
function groupFromLeft(binary: string, size: number): string {
  let digits = '';
  for (let i = 0; i < binary.length; i += size) digits += formatNumeral(valueOf(binary.slice(i, i + size), 2), 16);
  return digits;
}

function grouping(steps: GroupingSteps, answer: string): Diagnosis {
  const { groups, bitsPerGroup, binary } = steps;
  if (binary.length % bitsPerGroup !== 0 && answer === groupFromLeft(binary, bitsPerGroup)) {
    return result('groupedFromLeft', 'likely', null);
  }
  const j = firstMismatchFromRight(answer, steps.digits);
  if (j >= 0) return result('wrongGroup', 'exact', groups.length - 1 - j);
  if (answer.length < steps.digits.length) {
    return result('missingGroups', 'exact', groups.length - 1 - answer.length);
  }
  return result('extraDigits', 'likely', null);
}

/** Ogni cifra scritta in binario senza completare il gruppo con gli zeri (1 invece di 001). */
function unpadded(steps: GroupingSteps): string {
  return steps.groups.map((g) => formatNumeral(g.value, 2)).join('');
}

function firstUnpaddedGroup(steps: GroupingSteps): number {
  return steps.groups.findIndex((g, i) => i > 0 && formatNumeral(g.value, 2).length < steps.bitsPerGroup);
}

function expansion(steps: GroupingSteps, answer: string): Diagnosis {
  const { groups, bitsPerGroup, binary } = steps;
  if (answer === unpadded(steps) && answer !== binary) {
    return result('groupNotPadded', 'likely', firstUnpaddedGroup(steps));
  }
  const bit = firstMismatchFromRight(answer, binary);
  if (bit >= 0) return result('wrongGroup', 'exact', groups.length - 1 - Math.floor(bit / bitsPerGroup));
  if (answer.length < binary.length) {
    return result('missingGroups', 'exact', groups.length - 1 - Math.floor(answer.length / bitsPerGroup));
  }
  return result('extraDigits', 'likely', null);
}

// --- Due fasi ---------------------------------------------------------------------------------------------------

function viaDecimal(first: PositionalSteps, second: DivisionSteps, answer: string, options: CheckOptions): Diagnosis {
  const inFirst = (d: Diagnosis): Diagnosis => ({ ...d, phase: 'first' });
  const inSecond = (d: Diagnosis): Diagnosis => ({ ...d, phase: 'second' });

  const intermediate = options.intermediate?.trim() ? parseNumeral(options.intermediate, 10) : null;
  if (intermediate?.ok) {
    if (intermediate.value !== first.total) {
      return inFirst(positional(first, intermediate.value) ?? result('sumError', 'unknown', null));
    }
    return inSecond(division(second, answer));
  }

  // Senza il valore intermedio: un errore tipico della prima fase, se c’è, spiega la risposta per intero.
  const value = valueOf(answer, second.base);
  const typical = positional(first, value);
  if (typical) return inFirst(typical);
  const later = division(second, answer);
  if (later.kind === 'reversedRemainders' || later.kind === 'remainderNotDigit') return inSecond(later);
  return result('unknownPhase', 'unknown', null);
}

function viaBinary(first: GroupingSteps, second: GroupingSteps, answer: string): Diagnosis {
  if (first.binary.length % second.bitsPerGroup !== 0 && answer === groupFromLeft(first.binary, second.bitsPerGroup)) {
    return { ...result('groupedFromLeft', 'likely', null), phase: 'second' };
  }
  const loose = unpadded(first);
  if (loose !== first.binary && answer === groupSteps(loose, second.base).digits) {
    return { ...result('groupNotPadded', 'likely', firstUnpaddedGroup(first)), phase: 'first' };
  }

  // Bit della risposta, riportati in binario, contro i bit corretti: se tutti gli errori cadono dentro la stessa
  // cifra di partenza, probabilmente è sbagliata la sua espansione; altrimenti il raggruppamento.
  const answerBits = expandSteps(answer, second.base).binary;
  const width = Math.max(answerBits.length, first.binary.length);
  const a = reverse(answerBits.padStart(width, '0'));
  const b = reverse(first.binary.padStart(width, '0'));
  const wrongBits = [...a].flatMap((bit, i) => (bit === b[i] ? [] : [i]));
  const firstBit = wrongBits[0] ?? 0;
  const sourceGroup = (bit: number) => Math.floor(bit / first.bitsPerGroup);
  if (
    wrongBits.every((bit) => sourceGroup(bit) === sourceGroup(firstBit)) &&
    sourceGroup(firstBit) < first.groups.length
  ) {
    return { ...result('wrongGroup', 'likely', first.groups.length - 1 - sourceGroup(firstBit)), phase: 'first' };
  }
  const targetGroup = Math.floor(firstBit / second.bitsPerGroup);
  return {
    ...result('wrongGroup', 'likely', Math.max(0, second.groups.length - 1 - targetGroup)),
    phase: 'second',
  };
}
