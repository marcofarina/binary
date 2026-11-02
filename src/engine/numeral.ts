import { assertBase, type Base, digitChar, digitValue } from './digits';

/**
 * Per ora il motore tratta solo interi senza segno entro `Number.MAX_SAFE_INTEGER`.
 * Virgola, segno e complemento a due arriveranno come nuovi tipi di numerale, senza toccare questi.
 */
export type ParseError =
  | { kind: 'empty' }
  /** `index` è la posizione nel testo normalizzato (senza spazi né prefisso). */
  | { kind: 'invalidDigit'; char: string; index: number }
  | { kind: 'tooLarge' };

export type ParseResult = { ok: true; value: number; digits: string } | { ok: false; error: ParseError };

const PREFIXES: Record<number, string> = { 2: '0B', 8: '0O', 16: '0X' };

/**
 * Pulisce ciò che scrive lo studente: toglie spazi e separatori, porta in maiuscolo e accetta sia il prefisso dei
 * linguaggi di programmazione (`0b`, `0o`, `0x`) sia un pedice finale uguale alla base (`1010₂`, `FF(16)`).
 */
export function normalize(text: string, base: Base): string {
  let clean = stripSubscript(text.trim(), base)
    .replace(/[\s_.'’]/g, '')
    .toUpperCase();
  const prefix = PREFIXES[base];
  if (prefix && clean.startsWith(prefix) && clean.length > 2) clean = clean.slice(2);
  return clean;
}

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

/** Toglie un pedice finale uguale alla base (`1010₂`, `FF(16)`), che alcuni studenti copiano dalla consegna. */
function stripSubscript(text: string, base: Base): string {
  const subscript = [...String(base)].map((d) => SUBSCRIPTS[Number(d)]).join('');
  if (text.endsWith(subscript)) return text.slice(0, -subscript.length);
  const paren = `(${base})`;
  if (text.endsWith(paren)) return text.slice(0, -paren.length);
  return text;
}

/** Legge un numerale nella base indicata. Gli zeri iniziali sono ammessi e ignorati. */
export function parseNumeral(text: string, base: Base): ParseResult {
  assertBase(base);
  const clean = normalize(text, base);
  if (clean === '') return { ok: false, error: { kind: 'empty' } };
  let value = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i] as string;
    const digit = digitValue(char);
    if (digit < 0 || digit >= base) return { ok: false, error: { kind: 'invalidDigit', char, index: i } };
    value = value * base + digit;
    if (!Number.isSafeInteger(value)) return { ok: false, error: { kind: 'tooLarge' } };
  }
  return { ok: true, value, digits: stripLeadingZeros(clean) };
}

export function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

/** Scrive un intero senza segno nella base indicata, con le cifre oltre il 9 in maiuscolo. */
export function formatNumeral(value: number, base: Base): string {
  assertBase(base);
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`Valore non supportato: ${value}.`);
  if (value === 0) return '0';
  let digits = '';
  for (let rest = value; rest > 0; rest = Math.floor(rest / base)) digits = digitChar(rest % base) + digits;
  return digits;
}

/** Valore delle cifre lette così come sono, senza controlli (le cifre devono essere valide per la base). */
export function valueOf(digits: string, base: Base): number {
  let value = 0;
  for (const char of digits) value = value * base + digitValue(char);
  return value;
}

/** Raggruppa le cifre da destra per la lettura (es. `1011 0101`); solo per la visualizzazione. */
export function groupForDisplay(digits: string, size: number, separator = ' '): string {
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= size) groups.unshift(digits.slice(Math.max(0, end - size), end));
  return groups.join(separator);
}
