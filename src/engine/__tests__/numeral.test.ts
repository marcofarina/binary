import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatNumeral, groupForDisplay, normalize, parseNumeral } from '../numeral';

const base = fc.integer({ min: 2, max: 16 });
const value = fc.integer({ min: 0, max: 1_000_000 });

describe('numerali', () => {
  it('scrivere e rileggere restituisce sempre il valore di partenza', () => {
    fc.assert(
      fc.property(value, base, (v, b) => {
        const parsed = parseNumeral(formatNumeral(v, b), b);
        expect(parsed).toEqual({ ok: true, value: v, digits: formatNumeral(v, b) });
      }),
    );
  });

  it('coincide con toString di JavaScript', () => {
    fc.assert(
      fc.property(value, base, (v, b) => {
        expect(formatNumeral(v, b)).toBe(v.toString(b).toUpperCase());
      }),
    );
  });

  it('accetta minuscole, spazi, zeri iniziali, prefissi e pedici', () => {
    expect(parseNumeral(' 00ff ', 16)).toEqual({ ok: true, value: 255, digits: 'FF' });
    expect(parseNumeral('0x1A', 16)).toMatchObject({ ok: true, value: 26 });
    expect(parseNumeral('0b1010', 2)).toMatchObject({ ok: true, value: 10 });
    expect(parseNumeral('1011 0101', 2)).toMatchObject({ ok: true, value: 181 });
    expect(parseNumeral('1010₂', 2)).toMatchObject({ ok: true, value: 10 });
    expect(parseNumeral('7F(16)', 16)).toMatchObject({ ok: true, value: 127 });
    expect(parseNumeral('000', 2)).toEqual({ ok: true, value: 0, digits: '0' });
    expect(normalize('0x', 16)).toBe('0X');
  });

  it('segnala le cifre non valide per la base e il campo vuoto', () => {
    expect(parseNumeral('1021', 2)).toEqual({ ok: false, error: { kind: 'invalidDigit', char: '2', index: 2 } });
    expect(parseNumeral('G', 16)).toMatchObject({ ok: false, error: { kind: 'invalidDigit', char: 'G' } });
    expect(parseNumeral('8', 8)).toMatchObject({ ok: false, error: { kind: 'invalidDigit' } });
    expect(parseNumeral('   ', 10)).toEqual({ ok: false, error: { kind: 'empty' } });
    expect(parseNumeral('F'.repeat(20), 16)).toEqual({ ok: false, error: { kind: 'tooLarge' } });
  });

  it('raggruppa da destra per la lettura', () => {
    expect(groupForDisplay('10110101', 4, ' ')).toBe('1011 0101');
    expect(groupForDisplay('1110101', 3, ' ')).toBe('1 110 101');
  });
});
