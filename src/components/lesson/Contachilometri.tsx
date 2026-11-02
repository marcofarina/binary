import { MotionConfig, motion } from 'motion/react';
import { useId, useState } from 'react';
import { DIGITS, formatNumeral } from '@/engine';

const BASES = [2, 3, 5, 8, 10, 16] as const;
const WHEELS = 4;

/** Contachilometri in una base qualsiasi: quando una ruota supera l’ultima cifra torna a 0 e fa scattare la vicina. */
export default function Contachilometri({ base: initial = 10 }: { base?: number }) {
  const [base, setBase] = useState(initial);
  const [value, setValue] = useState(0);
  const id = useId();
  const max = base ** WHEELS - 1;
  const digits = formatNumeral(value, base).padStart(WHEELS, '0');

  return (
    <MotionConfig reducedMotion="user">
      <figure className="not-prose my-8 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor={`${id}-base`} className="font-semibold">
            Base
          </label>
          <select
            id={`${id}-base`}
            value={base}
            onChange={(e) => {
              setBase(Number(e.target.value));
              setValue(0);
            }}
            className="min-h-11 rounded-lg border border-border bg-surface px-2"
          >
            {BASES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="text-sm text-text-muted">Cifre: {DIGITS.slice(0, base).split('').join(' ')}</span>
        </div>

        <div className="my-6 flex justify-center gap-2" aria-hidden="true">
          {[...digits].map((digit, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-text font-mono text-4xl font-bold text-bg">
                <motion.span
                  key={`${base}-${digit}`}
                  initial={{ y: '-100%' }}
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  {digit}
                </motion.span>
              </div>
              <span className="text-xs text-text-muted">
                {base}
                <sup>{WHEELS - 1 - i}</sup>
              </span>
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {digits} in base {base}, cioè {value} in base 10
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setValue((v) => Math.max(0, v - 1))}
            className="min-h-11 rounded-md border border-border px-4"
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => setValue((v) => Math.min(max, v + 1))}
            className="min-h-11 rounded-md bg-accent px-5 font-bold text-accent-contrast"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => setValue((v) => Math.min(max, v + base))}
            className="min-h-11 rounded-md border border-border px-4"
          >
            +{base}
          </button>
          <button type="button" onClick={() => setValue(0)} className="min-h-11 rounded-md border border-border px-4">
            Azzera
          </button>
        </div>
        <figcaption className="mt-4 text-center text-sm text-text-muted">
          In decimale: <strong className="font-mono text-text">{value}</strong>. Prova a superare l’ultima cifra della
          base.
        </figcaption>
      </figure>
    </MotionConfig>
  );
}
