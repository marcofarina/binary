import { groupForDisplay } from '@/engine';

interface Props {
  digits: string;
  base: number;
  /** Raggruppa i bit a gruppi di quattro da destra, per renderli leggibili. */
  group?: boolean;
  className?: string;
}

/** Un numerale con il pedice della base, letto dai lettori di schermo come “1010 in base 2”. */
export function Numeral({ digits, base, group = false, className = '' }: Props) {
  const size = 4;
  const shown = group && base === 2 && digits.length > size ? groupForDisplay(digits, size) : digits;
  return (
    <span className={`whitespace-nowrap font-mono ${className}`}>
      <span aria-hidden="true">
        {shown}
        <sub className="ms-0.5 font-sans text-[0.45em] text-text-muted">{base}</sub>
      </span>
      <span className="sr-only">
        {digits} in base {base}
      </span>
    </span>
  );
}
