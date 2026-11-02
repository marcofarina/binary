import { useId, useState } from 'react';
import { formatNumeral } from '@/engine';

const CHANNELS = [
  { key: 'r', label: 'Rosso' },
  { key: 'g', label: 'Verde' },
  { key: 'b', label: 'Blu' },
] as const;

const hex2 = (n: number) => formatNumeral(n, 16).padStart(2, '0');

/** Un colore come tre byte: rosso, verde e blu, ciascuno da 00 a FF. */
export default function Colore({ r = 90, g = 43, b = 212 }: { r?: number; g?: number; b?: number }) {
  const [rgb, setRgb] = useState({ r, g, b });
  const id = useId();
  const code = `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`;

  return (
    <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans sm:flex-row">
      <div
        className="h-32 w-full shrink-0 rounded-lg border border-border sm:h-auto sm:w-40"
        style={{ backgroundColor: code }}
        role="img"
        aria-label={`Anteprima del colore ${code}`}
      />
      <div className="flex flex-1 flex-col gap-3">
        {CHANNELS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-[4rem_1fr_6.5rem] items-center gap-2">
            <label htmlFor={`${id}-${key}`} className="font-semibold">
              {label}
            </label>
            <input
              id={`${id}-${key}`}
              type="range"
              min={0}
              max={255}
              value={rgb[key]}
              onChange={(e) => setRgb((c) => ({ ...c, [key]: Number(e.target.value) }))}
              className="accent-[var(--color-accent)]"
            />
            <span className="font-mono text-sm">
              {rgb[key]} = <strong>{hex2(rgb[key])}</strong>
            </span>
          </div>
        ))}
        <p className="font-mono text-3xl font-bold" aria-live="polite">
          {code}
        </p>
      </div>
      <figcaption className="sr-only">
        Muovi i cursori per comporre il colore e leggerne il codice esadecimale.
      </figcaption>
    </figure>
  );
}
