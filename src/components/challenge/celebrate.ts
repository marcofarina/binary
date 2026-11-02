import confetti from 'canvas-confetti';

function rainbow(): string[] {
  const style = getComputedStyle(document.documentElement);
  return [1, 2, 3, 4, 5, 6, 7].map((n) => style.getPropertyValue(`--color-rainbow-${n}`).trim() || '#8e4ec6');
}

/** Coriandoli arcobaleno; con `prefers-reduced-motion` non parte niente. */
export function burst(intensity: 'small' | 'big' = 'small'): void {
  try {
    const colors = rainbow();
    const options = { colors, disableForReducedMotion: true, zIndex: 60 };
    if (intensity === 'small') {
      void confetti({ ...options, particleCount: 60, spread: 70, origin: { y: 0.4 } });
      return;
    }
    void confetti({ ...options, particleCount: 120, spread: 100, origin: { x: 0.2, y: 0.5 }, angle: 60 });
    void confetti({ ...options, particleCount: 120, spread: 100, origin: { x: 0.8, y: 0.5 }, angle: 120 });
  } catch {
    // Canvas non disponibile: si festeggia senza coriandoli.
  }
}
