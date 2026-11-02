import { useState } from 'react';
import { divisionSteps, parseNumeral } from '@/engine';
import { Division } from '../exercise/Solution';
import { BaseSelect, NumeroInput } from './NumeroInput';
import { ComandiPassi, usePassi } from './Passi';

const BASES = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 16] as const;

/** Da decimale a una base qualsiasi: una divisione alla volta, poi i resti letti dal basso. */
export default function AnimatoreDivisioni({ numero = 43, base: initial = 2 }: { numero?: number; base?: number }) {
  const [base, setBase] = useState(initial);
  const [text, setText] = useState(String(numero));
  const parsed = parseNumeral(text, 10);
  const steps = parsed.ok && parsed.value <= 1_000_000 ? divisionSteps(parsed.value, base) : null;
  const passi = usePassi(steps?.rows.length ?? 1);

  return (
    <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <NumeroInput
          label="Numero in base 10"
          value={text}
          base={10}
          onChange={(v) => {
            setText(v);
            passi.setVisible(1);
          }}
        />
        <BaseSelect
          label="Base di arrivo"
          value={base}
          bases={BASES}
          onChange={(b) => {
            setBase(b);
            passi.setVisible(1);
          }}
        />
      </div>
      {steps && (
        <>
          <ComandiPassi {...passi} />
          <Division steps={steps} visible={passi.visible} />
        </>
      )}
    </figure>
  );
}
