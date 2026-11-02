import { assertBase, type Base, bitsPerDigit, digitChar, digitValue } from './digits';
import { formatNumeral, stripLeadingZeros, valueOf } from './numeral';

/*
 * Procedimenti come dati strutturati: la teoria li anima, la soluzione degli esercizi li mostra, le schede li
 * stampano. Nessun testo qui dentro: le frasi stanno nell’interfaccia.
 */

/** Un termine della somma pesata: cifra × base^esponente. */
export interface PositionalTerm {
  /** Esponente, cioè posizione contata da destra a partire da 0. */
  exponent: number;
  digit: string;
  digitValue: number;
  /** base^esponente. */
  weight: number;
  product: number;
}

/** Da una base qualsiasi a decimale, con la somma pesata. I termini vanno dalla cifra più a sinistra. */
export interface PositionalSteps {
  method: 'positional';
  base: Base;
  digits: string;
  terms: PositionalTerm[];
  total: number;
}

export function positionalSteps(digits: string, base: Base): PositionalSteps {
  assertBase(base);
  const clean = stripLeadingZeros(digits.toUpperCase());
  const n = clean.length;
  const terms = [...clean].map((digit, i): PositionalTerm => {
    const exponent = n - 1 - i;
    const value = digitValue(digit);
    const weight = base ** exponent;
    return { exponent, digit, digitValue: value, weight, product: value * weight };
  });
  return { method: 'positional', base, digits: clean, terms, total: terms.reduce((sum, t) => sum + t.product, 0) };
}

/** Una riga delle divisioni successive: dividendo = quoziente × base + resto. */
export interface DivisionRow {
  dividend: number;
  quotient: number;
  remainder: number;
  /** Il resto scritto come cifra della base di arrivo (10 → A). */
  digit: string;
}

/**
 * Da decimale a una base qualsiasi, con le divisioni successive. Le righe vanno dalla prima divisione all’ultima:
 * la riga `i` produce la cifra di posizione `i` (contata da destra), quindi il risultato si legge dal basso.
 */
export interface DivisionSteps {
  method: 'division';
  base: Base;
  value: number;
  rows: DivisionRow[];
  result: string;
}

export function divisionSteps(value: number, base: Base): DivisionSteps {
  assertBase(base);
  const rows: DivisionRow[] = [];
  let rest = value;
  do {
    const quotient = Math.floor(rest / base);
    const remainder = rest % base;
    rows.push({ dividend: rest, quotient, remainder, digit: digitChar(remainder) });
    rest = quotient;
  } while (rest > 0);
  return { method: 'division', base, value, rows, result: formatNumeral(value, base) };
}

/** Un gruppo di bit che corrisponde a una cifra ottale o esadecimale. */
export interface BitGroup {
  bits: string;
  value: number;
  digit: string;
  /** Zeri aggiunti a sinistra per completare il gruppo (solo il gruppo più a sinistra può averne). */
  padding: number;
}

/**
 * Binario ↔ ottale o esadecimale: gruppi di tre o quattro bit. I gruppi vanno da sinistra a destra, come si
 * scrivono; `direction` dice se si parte dal binario (si raggruppa da destra) o dall’altra base (si espande).
 */
export interface GroupingSteps {
  method: 'grouping';
  direction: 'group' | 'expand';
  /** La base diversa da 2: 8 o 16 (o 4). */
  base: Base;
  bitsPerGroup: number;
  binary: string;
  digits: string;
  groups: BitGroup[];
}

function groupingBits(base: Base): number {
  const bits = bitsPerDigit(base);
  if (bits === null) throw new RangeError(`La base ${base} non si converte per gruppi di bit.`);
  return bits;
}

/** Dal binario alla base `base` (potenza di due), raggruppando da destra. */
export function groupSteps(binary: string, base: Base): GroupingSteps {
  const size = groupingBits(base);
  const bits = stripLeadingZeros(binary);
  const padding = (size - (bits.length % size)) % size;
  const padded = '0'.repeat(padding) + bits;
  const groups: BitGroup[] = [];
  for (let i = 0; i < padded.length; i += size) {
    const group = padded.slice(i, i + size);
    const value = valueOf(group, 2);
    groups.push({ bits: group, value, digit: digitChar(value), padding: i === 0 ? padding : 0 });
  }
  return {
    method: 'grouping',
    direction: 'group',
    base,
    bitsPerGroup: size,
    binary: bits,
    digits: groups.map((g) => g.digit).join(''),
    groups,
  };
}

/** Dalla base `base` (potenza di due) al binario, espandendo ogni cifra in un gruppo di bit. */
export function expandSteps(digits: string, base: Base): GroupingSteps {
  const size = groupingBits(base);
  const clean = stripLeadingZeros(digits.toUpperCase());
  const groups = [...clean].map((digit): BitGroup => {
    const value = digitValue(digit);
    return { bits: formatNumeral(value, 2).padStart(size, '0'), value, digit, padding: 0 };
  });
  return {
    method: 'grouping',
    direction: 'expand',
    base,
    bitsPerGroup: size,
    binary: stripLeadingZeros(groups.map((g) => g.bits).join('')),
    digits: clean,
    groups,
  };
}

/** Una conversione in due fasi: passando dal decimale (basi qualsiasi) o dal binario (ottale ↔ esadecimale). */
export interface TwoPhaseSteps {
  method: 'via-decimal' | 'via-binary';
  first: PositionalSteps | GroupingSteps;
  second: DivisionSteps | GroupingSteps;
}

export type Steps = PositionalSteps | DivisionSteps | GroupingSteps | TwoPhaseSteps;

/** Il metodo con cui si insegna una conversione da `from` a `to`. */
export type Method = 'positional' | 'division' | 'group' | 'expand' | 'via-binary' | 'via-decimal';

export function methodFor(from: Base, to: Base): Method {
  assertBase(from);
  assertBase(to);
  if (from === to) throw new RangeError('La base di partenza e quella di arrivo coincidono.');
  if (to === 10) return 'positional';
  if (from === 10) return 'division';
  if (from === 2 && bitsPerDigit(to) !== null) return 'group';
  if (to === 2 && bitsPerDigit(from) !== null) return 'expand';
  if (bitsPerDigit(from) !== null && bitsPerDigit(to) !== null) return 'via-binary';
  return 'via-decimal';
}

/** Il procedimento completo per convertire `digits` dalla base `from` alla base `to`. */
export function solve(digits: string, from: Base, to: Base): Steps {
  switch (methodFor(from, to)) {
    case 'positional':
      return positionalSteps(digits, from);
    case 'division':
      return divisionSteps(valueOf(stripLeadingZeros(digits), 10), to);
    case 'group':
      return groupSteps(digits, to);
    case 'expand':
      return expandSteps(digits, from);
    case 'via-binary': {
      const first = expandSteps(digits, from);
      return { method: 'via-binary', first, second: groupSteps(first.binary, to) };
    }
    case 'via-decimal': {
      const first = positionalSteps(digits, from);
      return { method: 'via-decimal', first, second: divisionSteps(first.total, to) };
    }
  }
}

/** Il risultato di un procedimento, nella base di arrivo. */
export function resultOf(steps: Steps): string {
  switch (steps.method) {
    case 'positional':
      return String(steps.total);
    case 'division':
      return steps.result;
    case 'grouping':
      return steps.direction === 'group' ? steps.digits : steps.binary;
    case 'via-binary':
    case 'via-decimal':
      return resultOf(steps.second);
  }
}
