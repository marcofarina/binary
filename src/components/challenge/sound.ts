/*
 * Effetti sonori sintetizzati con la Web Audio API: niente file audio. Spenti di default; la scelta resta in
 * `localStorage`, sempre dentro try/catch.
 */
const KEY = 'binary-sound';
let context: AudioContext | null = null;

export function loadSoundPreference(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveSoundPreference(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Archiviazione non disponibile: la scelta vale solo per questa pagina.
  }
}

function tone(frequency: number, start: number, duration: number, type: OscillatorType = 'triangle', volume = 0.12) {
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const t0 = context.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export type Sound = 'correct' | 'wrong' | 'levelUp' | 'milestone';

const NOTES: Record<Sound, [number, number, number][]> = {
  correct: [
    [659, 0, 0.12],
    [988, 0.08, 0.18],
  ],
  wrong: [
    [220, 0, 0.18],
    [165, 0.12, 0.28],
  ],
  levelUp: [
    [523, 0, 0.12],
    [659, 0.09, 0.12],
    [784, 0.18, 0.12],
    [1047, 0.27, 0.3],
  ],
  milestone: [
    [784, 0, 0.1],
    [988, 0.07, 0.1],
    [1319, 0.14, 0.3],
  ],
};

export function play(sound: Sound): void {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    for (const [frequency, start, duration] of NOTES[sound]) {
      tone(frequency, start, duration, sound === 'wrong' ? 'sawtooth' : 'triangle', sound === 'wrong' ? 0.06 : 0.12);
    }
  } catch {
    // Audio non disponibile: si gioca in silenzio.
  }
}
