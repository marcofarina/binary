import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatNumeral } from '../numeral';
import { divisionSteps, expandSteps, groupSteps, methodFor, positionalSteps, resultOf, solve } from '../steps';

const value = fc.integer({ min: 0, max: 100_000 });
const base = fc.integer({ min: 2, max: 16 });
const pow2 = fc.constantFrom(4, 8, 16);

describe('procedimenti', () => {
  it('la somma pesata ricostruisce il valore', () => {
    fc.assert(
      fc.property(value, base, (v, b) => {
        const steps = positionalSteps(formatNumeral(v, b), b);
        expect(steps.total).toBe(v);
        expect(steps.terms.at(-1)?.exponent).toBe(0);
      }),
    );
  });

  it('ogni riga delle divisioni rispetta dividendo = quoziente × base + resto', () => {
    fc.assert(
      fc.property(value, base, (v, b) => {
        const steps = divisionSteps(v, b);
        for (const row of steps.rows) expect(row.quotient * b + row.remainder).toBe(row.dividend);
        expect(steps.rows.at(-1)?.quotient).toBe(0);
        expect(
          steps.rows
            .map((r) => r.digit)
            .reverse()
            .join(''),
        ).toBe(formatNumeral(v, b));
      }),
    );
  });

  it('raggruppare ed espandere i bit sono operazioni inverse', () => {
    fc.assert(
      fc.property(value, pow2, (v, b) => {
        const grouped = groupSteps(formatNumeral(v, 2), b);
        expect(grouped.digits).toBe(formatNumeral(v, b));
        expect(grouped.groups.every((g) => g.bits.length === grouped.bitsPerGroup)).toBe(true);
        expect(expandSteps(grouped.digits, b).binary).toBe(formatNumeral(v, 2));
      }),
    );
  });

  it('solo il gruppo più a sinistra riceve zeri di riempimento', () => {
    const steps = groupSteps('1110101', 8);
    expect(steps.groups.map((g) => [g.bits, g.digit, g.padding])).toEqual([
      ['001', '1', 2],
      ['110', '6', 0],
      ['101', '5', 0],
    ]);
  });

  it('sceglie il metodo con cui si insegna la conversione', () => {
    expect(methodFor(2, 10)).toBe('positional');
    expect(methodFor(10, 16)).toBe('division');
    expect(methodFor(2, 8)).toBe('group');
    expect(methodFor(16, 2)).toBe('expand');
    expect(methodFor(8, 16)).toBe('via-binary');
    expect(methodFor(5, 7)).toBe('via-decimal');
    expect(methodFor(8, 3)).toBe('via-decimal');
    expect(() => methodFor(2, 2)).toThrow(RangeError);
  });

  it('qualunque conversione dà il risultato giusto', () => {
    fc.assert(
      fc.property(value, base, base, (v, from, to) => {
        fc.pre(from !== to);
        expect(resultOf(solve(formatNumeral(v, from), from, to))).toBe(formatNumeral(v, to));
      }),
    );
  });
});
