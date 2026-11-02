import { useId, useState } from 'react';

const WHO = ['proprietario', 'gruppo', 'altri'] as const;
const WHAT = [
  { letter: 'r', label: 'lettura', weight: 4 },
  { letter: 'w', label: 'scrittura', weight: 2 },
  { letter: 'x', label: 'esecuzione', weight: 1 },
] as const;

/** I permessi di un file Linux: tre gruppi di tre bit, cioè tre cifre ottali. */
export default function Permessi({ modo = '754' }: { modo?: string }) {
  const [digits, setDigits] = useState(() => [...modo].map(Number));
  const id = useId();
  const symbolic = digits.map((d) => WHAT.map((w) => ((d & w.weight) !== 0 ? w.letter : '-')).join('')).join('');

  return (
    <figure className="not-prose my-8 flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 font-sans">
      <table className="w-full border-collapse text-center">
        <caption className="sr-only">Permessi per proprietario, gruppo e altri</caption>
        <thead>
          <tr>
            <td />
            {WHAT.map((w) => (
              <th key={w.letter} scope="col" className="px-1 py-1 text-sm font-normal text-text-muted">
                <span className="sr-only sm:not-sr-only sm:block">{w.label}</span>
                <span className="block font-mono text-text">
                  {w.letter} = {w.weight}
                </span>
              </th>
            ))}
            <th scope="col" className="px-1 py-1 text-sm font-normal text-text-muted">
              <span className="sm:hidden">ottale</span>
              <span className="hidden sm:inline">cifra ottale</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {WHO.map((who, i) => (
            <tr key={who} className="border-t border-border">
              <th scope="row" className="py-2 text-left font-semibold">
                {who}
              </th>
              {WHAT.map((w) => {
                const inputId = `${id}-${i}-${w.letter}`;
                return (
                  <td key={w.letter}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={((digits[i] ?? 0) & w.weight) !== 0}
                      onChange={() => setDigits((all) => all.map((d, j) => (j === i ? d ^ w.weight : d)))}
                      aria-label={`${w.label} per ${who}`}
                      className="size-6 accent-[var(--color-accent)]"
                    />
                  </td>
                );
              })}
              <td className="font-mono text-2xl font-bold">{digits[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-1 rounded-lg bg-text p-3 font-mono text-bg" aria-live="polite">
        <span>$ chmod {digits.join('')} programma.sh</span>
        <span className="opacity-80">$ ls -l programma.sh</span>
        <span>-{symbolic} 1 marta studenti 512 programma.sh</span>
      </div>
      <figcaption className="text-sm text-text-muted">
        Ogni cifra ottale riassume tre bit: lettura vale 4, scrittura 2, esecuzione 1.
      </figcaption>
    </figure>
  );
}
