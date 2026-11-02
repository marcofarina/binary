import { useId } from 'react';
import { parseNumeral } from '@/engine';

interface Props {
  label: string;
  value: string;
  base: number;
  onChange: (value: string) => void;
}

/** Campo per scrivere un numero in una base, con l’errore di cifra segnalato subito. */
export function NumeroInput({ label, value, base, onChange }: Props) {
  const id = useId();
  const parsed = parseNumeral(value, base);
  const error =
    !parsed.ok && parsed.error.kind === 'invalidDigit'
      ? `La cifra ${parsed.error.char} non esiste in base ${base}.`
      : null;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error !== null}
        aria-describedby={`${id}-error`}
        className="min-h-11 rounded-lg border border-border bg-surface px-3 font-mono text-xl uppercase"
      />
      <p id={`${id}-error`} role="status" className="min-h-5 text-sm font-semibold text-wrong">
        {error}
      </p>
    </div>
  );
}

export function BaseSelect({
  label,
  value,
  bases,
  onChange,
}: {
  label: string;
  value: number;
  bases: readonly number[];
  onChange: (base: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-h-11 rounded-lg border border-border bg-surface px-2"
      >
        {bases.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
