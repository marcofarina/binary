/** Cifre usate fino alla base 16. */
export const DIGITS = '0123456789ABCDEF';

export const MIN_BASE = 2;
export const MAX_BASE = 16;

export type Base = number;

export function isBase(base: number): base is Base {
  return Number.isInteger(base) && base >= MIN_BASE && base <= MAX_BASE;
}

export function assertBase(base: number): void {
  if (!isBase(base)) throw new RangeError(`Base non supportata: ${base}.`);
}

/** Valore di una cifra (maiuscola o minuscola), oppure -1 se il carattere non è una cifra fino a F. */
export function digitValue(char: string): number {
  return DIGITS.indexOf(char.toUpperCase());
}

export function digitChar(value: number): string {
  const char = DIGITS[value];
  if (char === undefined || !Number.isInteger(value)) throw new RangeError(`Cifra non valida: ${value}.`);
  return char;
}

/** Nome usuale della base, per i testi. */
export function baseName(base: Base): 'binario' | 'ottale' | 'decimale' | 'esadecimale' | null {
  switch (base) {
    case 2:
      return 'binario';
    case 8:
      return 'ottale';
    case 10:
      return 'decimale';
    case 16:
      return 'esadecimale';
    default:
      return null;
  }
}

/** Le basi che si convertono tra loro per gruppi di bit, con il numero di bit di ogni gruppo. */
export function bitsPerDigit(base: Base): number | null {
  const bits = Math.log2(base);
  return Number.isInteger(bits) && bits > 1 ? bits : null;
}
