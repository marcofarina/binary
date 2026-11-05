/*
 * Storico degli esercizi già visti in questo browser, perché non tornino nemmeno da una partita o da un allenamento
 * all’altro. Contiene solo chiavi come `2-10:45` e i codici sfida già giocati: niente dati personali. `localStorage`
 * sempre dentro try/catch: se manca, resta la copia in memoria e lo storico vale finché la pagina è aperta.
 */

const KEY = 'binary-visti';
/** Esercizi ricordati: i più vecchi escono, così i livelli con pochi numeri non si esauriscono. */
export const HISTORY_SIZE = 300;
/** Codici sfida ricordati. */
const CODES_SIZE = 100;

interface History {
  keys: string[];
  codes: number[];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

/** Copia in memoria, che basta da sola quando `localStorage` non c’è. */
let memory: History = { keys: [], codes: [] };

function load(): History {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Record<keyof History, unknown>>) : {};
    const codes = Array.isArray(parsed.codes) ? parsed.codes.filter((x): x is number => typeof x === 'number') : [];
    const stored = { keys: strings(parsed.keys), codes };
    const keys = new Set(stored.keys);
    const codeSet = new Set(stored.codes);
    return {
      keys: [...stored.keys, ...memory.keys.filter((k) => !keys.has(k))],
      codes: [...stored.codes, ...memory.codes.filter((c) => !codeSet.has(c))],
    };
  } catch {
    return memory;
  }
}

function save(history: History) {
  memory = { keys: history.keys.slice(-HISTORY_SIZE), codes: history.codes.slice(-CODES_SIZE) };
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Archiviazione non disponibile: lo storico vale solo per questa pagina.
  }
}

/** Gli esercizi già visti, dal più vecchio al più recente. */
export function loadSeen(): string[] {
  return load().keys;
}

/** Aggiunge esercizi allo storico (quelli già presenti passano in fondo, come i più recenti). */
export function rememberSeen(keys: readonly string[]) {
  const history = load();
  const fresh = new Set(keys);
  save({ ...history, keys: [...history.keys.filter((k) => !fresh.has(k)), ...fresh] });
}

/**
 * Lo storico da escludere in una sfida. Con un codice mai giocato in questo browser non si esclude niente, così la
 * prima partita è identica per tutta la classe; dalla seconda in poi il codice dà esercizi nuovi.
 */
export function historyForChallenge(code: number | undefined): string[] {
  const history = load();
  if (code === undefined) return history.keys;
  const played = history.codes.includes(code);
  save({ ...history, codes: [...history.codes.filter((c) => c !== code), code] });
  return played ? history.keys : [];
}
