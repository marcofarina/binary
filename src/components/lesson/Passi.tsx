import { useState } from 'react';

/** Comandi per rivelare un procedimento un passo alla volta. */
export function usePassi(total: number) {
  const [visible, setVisible] = useState(1);
  return { visible: Math.min(visible, total), setVisible, total };
}

export function ComandiPassi({
  visible,
  total,
  setVisible,
}: {
  visible: number;
  total: number;
  setVisible: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setVisible(Math.max(1, visible - 1))}
        disabled={visible <= 1}
        className="min-h-11 rounded-md border border-border px-3 disabled:opacity-50"
      >
        Indietro
      </button>
      <button
        type="button"
        onClick={() => setVisible(Math.min(total, visible + 1))}
        disabled={visible >= total}
        className="min-h-11 rounded-md bg-accent px-4 font-bold text-accent-contrast disabled:opacity-50"
      >
        Passo successivo
      </button>
      <button
        type="button"
        onClick={() => setVisible(total)}
        disabled={visible >= total}
        className="min-h-11 rounded-md border border-border px-3 disabled:opacity-50"
      >
        Tutto
      </button>
      <span className="text-sm text-text-muted" aria-live="polite">
        Passo {visible} di {total}
      </span>
    </div>
  );
}
