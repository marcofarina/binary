import { MotionConfig, motion } from 'motion/react';
import { useState } from 'react';
import { formatNumeral } from '@/engine';

const BITS = 8;

/** Un byte di memoria: otto interruttori, ciascuno acceso (1) o spento (0). */
export default function Registro({ valore = 0 }: { valore?: number }) {
  const [value, setValue] = useState(valore);
  const bits = formatNumeral(value, 2).padStart(BITS, '0');

  return (
    <MotionConfig reducedMotion="user">
      <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
        <div className="flex justify-center gap-1 sm:gap-2" role="group" aria-label="Otto bit, dal più significativo">
          {[...bits].map((bit, i) => {
            const weight = 2 ** (BITS - 1 - i);
            const on = bit === '1';
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Bit di peso ${weight}`}
                  onClick={() => setValue((v) => v ^ weight)}
                  className="flex h-16 w-9 items-end justify-center rounded-lg border-2 border-border bg-surface-muted p-1 sm:w-11"
                >
                  <motion.span
                    className="block h-6 w-full rounded"
                    animate={{
                      y: on ? -26 : 0,
                      backgroundColor: on ? `var(--color-rainbow-${(i % 7) + 1})` : 'var(--color-border)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className="font-mono text-lg font-bold" aria-hidden="true">
                  {bit}
                </span>
                <span className="text-xs text-text-muted" aria-hidden="true">
                  {weight}
                </span>
              </div>
            );
          })}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
          <div className="rounded-lg bg-surface-muted p-2">
            <dt className="text-xs text-text-muted">Binario</dt>
            <dd className="font-mono font-bold">{bits}</dd>
          </div>
          <div className="rounded-lg bg-surface-muted p-2">
            <dt className="text-xs text-text-muted">Decimale</dt>
            <dd className="font-mono font-bold">{value}</dd>
          </div>
          <div className="rounded-lg bg-surface-muted p-2">
            <dt className="text-xs text-text-muted">Esadecimale</dt>
            <dd className="font-mono font-bold">{formatNumeral(value, 16).padStart(2, '0')}</dd>
          </div>
        </dl>
        <figcaption className="text-center text-sm text-text-muted">
          Tocca un interruttore per cambiare il bit. Con otto bit si scrivono i numeri da 0 a 255: 2⁸ = 256 valori.
        </figcaption>
      </figure>
    </MotionConfig>
  );
}
