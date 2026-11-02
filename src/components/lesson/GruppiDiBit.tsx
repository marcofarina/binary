import { useState } from 'react';
import { expandSteps, formatNumeral, groupSteps, parseNumeral } from '@/engine';
import { Grouping } from '../exercise/Solution';
import { BaseSelect, NumeroInput } from './NumeroInput';

/** Binario ↔ ottale o esadecimale: i bit si raggruppano da destra, o ogni cifra si espande in bit. */
export default function GruppiDiBit({ numero = '1011010', base: initial = 16 }: { numero?: string; base?: number }) {
  const [direction, setDirection] = useState<'group' | 'expand'>('group');
  const [base, setBase] = useState(initial);
  const [text, setText] = useState(numero);
  const from = direction === 'group' ? 2 : base;
  const parsed = parseNumeral(text, from);
  const steps = parsed.ok
    ? direction === 'group'
      ? groupSteps(parsed.digits, base)
      : expandSteps(parsed.digits, base)
    : null;

  function flip() {
    const value = parsed.ok ? parsed.value : 0;
    const next = direction === 'group' ? 'expand' : 'group';
    setDirection(next);
    setText(formatNumeral(value, next === 'group' ? 2 : base));
  }

  return (
    <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <NumeroInput
          label={direction === 'group' ? 'Numero in binario' : `Numero in base ${base}`}
          value={text}
          base={from}
          onChange={setText}
        />
        <BaseSelect
          label={direction === 'group' ? 'Verso la base' : 'Dalla base'}
          value={base}
          bases={[8, 16]}
          onChange={(b) => {
            if (direction === 'expand') setText(formatNumeral(parsed.ok ? parsed.value : 0, b));
            setBase(b);
          }}
        />
      </div>
      <button type="button" onClick={flip} className="min-h-11 self-start rounded-md border border-border px-3">
        {direction === 'group' ? `Al contrario: da base ${base} a binario` : `Al contrario: da binario a base ${base}`}
      </button>
      {steps && <Grouping steps={steps} />}
    </figure>
  );
}
