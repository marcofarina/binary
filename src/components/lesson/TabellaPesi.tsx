import { useState } from 'react';
import { parseNumeral, positionalSteps } from '@/engine';
import { Positional } from '../exercise/Solution';
import { BaseSelect, NumeroInput } from './NumeroInput';
import { ComandiPassi, usePassi } from './Passi';

const BASES = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 16] as const;

/** Da una base qualsiasi a decimale: la tabella cifra × peso si compila un passo alla volta. */
export default function TabellaPesi({ numero = '1011', base: initial = 2 }: { numero?: string; base?: number }) {
  const [base, setBase] = useState(initial);
  const [text, setText] = useState(numero);
  const parsed = parseNumeral(text, base);
  const steps = parsed.ok ? positionalSteps(parsed.digits, base) : null;
  const passi = usePassi(steps?.terms.length ?? 1);

  return (
    <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <NumeroInput
          label="Numero"
          value={text}
          base={base}
          onChange={(v) => {
            setText(v);
            passi.setVisible(1);
          }}
        />
        <BaseSelect
          label="Base"
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
          <Positional steps={steps} visible={passi.visible} />
        </>
      )}
    </figure>
  );
}
