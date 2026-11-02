import type { Base, Diagnosis, Level, Steps } from '@/engine';
import { DIGITS } from '@/engine';
import { t, tf, type UiKey } from '@/i18n';

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

export const subscript = (n: number) => [...String(n)].map((d) => SUBSCRIPTS[Number(d)]).join('');
export const superscript = (n: number) => [...String(n)].map((d) => SUPERSCRIPTS[Number(d)]).join('');

/** “base 16 (esadecimale)” oppure “base 5”. */
export function baseLabel(base: Base): string {
  const key = `base.name.${base}` as UiKey;
  const label = tf('base.label', { base });
  return [2, 8, 10, 16].includes(base) ? `${label} (${t(key)})` : label;
}

export const levelLabel = (level: Level) => t(`level.${level}`);

/** Le cifre ammesse in una base, per i messaggi: “0 e 1”, “da 0 a 7”, “da 0 a 9 e da A a F”. */
export function allowedDigits(base: Base): string {
  if (base === 2) return '0 e 1';
  if (base <= 10) return `da 0 a ${base - 1}`;
  return `da 0 a 9 e da A a ${DIGITS[base - 1]}`;
}

/** Il messaggio che spiega la diagnosi, con i numeri presi dal procedimento. */
export function diagnosisMessage(steps: Steps, diagnosis: Diagnosis): string {
  const part =
    steps.method === 'via-binary' || steps.method === 'via-decimal'
      ? diagnosis.phase === 'second'
        ? steps.second
        : steps.first
      : steps;
  const i = diagnosis.index ?? 0;
  switch (diagnosis.kind) {
    case 'remainderNotDigit':
    case 'wrongRemainder': {
      if (part.method !== 'division') break;
      const row = part.rows[i];
      if (!row) break;
      return tf(`dx.${diagnosis.kind}`, { ...row, base: part.base });
    }
    case 'missingTerm':
    case 'doubledTerm':
    case 'wrongPower':
    case 'letterValue': {
      if (part.method !== 'positional') break;
      const term = part.terms[i];
      if (!term) break;
      return tf(`dx.${diagnosis.kind}`, {
        digit: term.digit,
        value: term.digitValue,
        weight: term.weight,
        product: term.product,
        exponent: term.exponent,
        power: `${part.base}${superscript(term.exponent)}`,
      });
    }
    case 'exponentsFromOne':
      if (part.method === 'positional') return tf('dx.exponentsFromOne', { base: part.base });
      break;
    case 'groupNotPadded': {
      if (part.method !== 'grouping') break;
      const group = part.groups[i];
      if (!group) break;
      return tf('dx.groupNotPadded', { digit: group.digit, bits: part.bitsPerGroup, padded: group.bits });
    }
    case 'wrongGroup': {
      if (part.method !== 'grouping') break;
      const group = part.groups[i];
      if (!group) break;
      return tf(part.direction === 'group' ? 'dx.wrongGroup.group' : 'dx.wrongGroup.expand', {
        digit: group.digit,
        bits: group.bits,
      });
    }
    default:
      return t(`dx.${diagnosis.kind}` as UiKey);
  }
  return t('dx.sumError');
}
