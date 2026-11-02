import { useId, useMemo, useState } from 'react';
import { isSeed, LEVELS, PRACTICE_PAIRS } from '@/engine';
import { randomSeed } from '@/game/game';
import { buildSheet, SHEET_COUNTS, type SheetChoice, type SheetLevel, type SheetSettings } from '@/game/worksheet';
import { t, tf } from '@/i18n';
import { levelLabel } from '../exercise/labels';
import { Numeral } from '../exercise/Numeral';

type LevelChoice = SheetLevel;
type Choice = SheetChoice;
type Settings = SheetSettings;
const COUNTS = SHEET_COUNTS;
const choiceOf = (pair: { from: number; to: number }) => `${pair.from}-${pair.to}` as Choice;

function fromUrl(): Settings {
  const params = new URLSearchParams(window.location.search);
  const lvl = params.get('livello');
  const conv = params.get('conversione');
  const count = Number(params.get('numero'));
  const seed = Number(params.get('codice'));
  return {
    level:
      lvl === 'progressive' || (LEVELS as readonly string[]).includes(lvl ?? '') ? (lvl as LevelChoice) : 'progressive',
    choice: conv === 'exotic' || PRACTICE_PAIRS.some((p) => choiceOf(p) === conv) ? (conv as Choice) : 'all',
    count: (COUNTS as readonly number[]).includes(count) ? count : 12,
    seed: isSeed(seed) ? seed : randomSeed(),
  };
}

function toUrl(s: Settings) {
  const params = new URLSearchParams({
    livello: s.level,
    conversione: s.choice,
    numero: String(s.count),
    codice: String(s.seed),
  });
  window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
}

/** Schede stampabili: esercizi generati da un codice, con il foglio delle soluzioni su una pagina a parte. */
export default function Worksheet() {
  const [settings, setSettings] = useState<Settings>(fromUrl);
  const [withSolutions, setWithSolutions] = useState(true);
  const exercises = useMemo(() => buildSheet(settings), [settings]);
  const id = useId();

  function update(next: Partial<Settings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    toUrl(merged);
  }

  const select = 'min-h-11 rounded-lg border border-border bg-surface px-2 text-text';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <form
        className="no-print grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-level`} className="font-semibold">
            {t('ws.level')}
          </label>
          <select
            id={`${id}-level`}
            className={select}
            value={settings.level}
            onChange={(e) => update({ level: e.target.value as LevelChoice })}
          >
            <option value="progressive">{t('ws.level.progressive')}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {levelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-conversion`} className="font-semibold">
            {t('pr.conversion')}
          </label>
          <select
            id={`${id}-conversion`}
            className={select}
            value={settings.choice}
            onChange={(e) => update({ choice: e.target.value as Choice })}
          >
            <option value="all">{t('ws.conversion.all')}</option>
            {PRACTICE_PAIRS.map((pair) => (
              <option key={choiceOf(pair)} value={choiceOf(pair)}>
                {tf('pr.conversion.option', pair)}
              </option>
            ))}
            <option value="exotic">{t('pr.conversion.exotic')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-count`} className="font-semibold">
            {t('ws.count')}
          </label>
          <select
            id={`${id}-count`}
            className={select}
            value={settings.count}
            onChange={(e) => update({ count: Number(e.target.value) })}
          >
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t('ws.code')}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg" data-testid="codice-scheda">
              {settings.seed}
            </span>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border px-3 hover:bg-surface-muted"
              onClick={() => update({ seed: randomSeed() })}
            >
              {t('ws.new')}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            className="size-5"
            checked={withSolutions}
            onChange={(e) => setWithSolutions(e.target.checked)}
          />
          {t('ws.withSolutions')}
        </label>
        <div className="sm:col-span-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-contrast"
            onClick={() => window.print()}
          >
            {t('ws.print')}
          </button>
          <p className="mt-2 text-sm text-text-muted">{t('ws.hint')}</p>
        </div>
      </form>

      <article
        aria-label={t('ws.sheet')}
        className="rounded-[var(--radius)] border border-border bg-surface p-6 print:border-0 print:p-0"
      >
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
          <span>{t('ws.name')} ____________________</span>
          <span>{t('ws.class')} ________</span>
          <span>{t('ws.date')} ____________</span>
        </div>
        <h2 className="mb-1 text-xl font-bold">{t('ws.heading')}</h2>
        <p className="mb-4 text-sm text-text-muted">{tf('ws.instructions', { code: settings.seed })}</p>
        <ol className="flex flex-col gap-5" data-testid="esercizi-scheda">
          {exercises.map((ex, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 break-inside-avoid">
              <span className="w-6 text-right font-semibold">{i + 1}.</span>
              <Numeral digits={ex.source} base={ex.from} group className="text-xl" />
              <span>{tf('ws.toBase', { base: ex.to })}</span>
              <span aria-hidden="true" className="inline-block h-6 w-48 border-b border-text" />
            </li>
          ))}
        </ol>
      </article>

      {withSolutions && (
        <section
          aria-label={t('ws.solutions')}
          className="page-break rounded-[var(--radius)] border border-border bg-surface p-6 print:border-0 print:p-0"
        >
          <h2 className="mb-1 text-xl font-bold">{t('ws.solutions')}</h2>
          <p className="mb-4 text-sm text-text-muted">{tf('ws.solutionsCode', { code: settings.seed })}</p>
          <ol className="grid gap-2 sm:grid-cols-2 print:grid-cols-2" data-testid="soluzioni-scheda">
            {exercises.map((ex, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 break-inside-avoid">
                <span className="w-6 text-right font-semibold">{i + 1}.</span>
                <Numeral digits={ex.source} base={ex.from} group />
                <span aria-hidden="true">=</span>
                <span className="sr-only">{t('ws.equals')}</span>
                <Numeral digits={ex.answer} base={ex.to} group className="font-bold" />
                {ex.from !== 10 && ex.to !== 10 && (
                  <span className="text-sm text-text-muted">({tf('ws.decimal', { value: ex.value })})</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
