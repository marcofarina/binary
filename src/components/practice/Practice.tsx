import { useId, useState } from 'react';
import { type Check, createRng, type Exercise, generate, type Level, LEVELS, PRACTICE_PAIRS, solve } from '@/engine';
import { randomSeed } from '@/game/game';
import { t, tf } from '@/i18n';
import { AnswerForm } from '../exercise/AnswerForm';
import { levelLabel } from '../exercise/labels';
import { REVIEW_BUTTON, REVIEW_GRID, REVIEW_SOLUTION, REVIEW_SOURCE } from '../exercise/layout';
import { Numeral } from '../exercise/Numeral';
import { Solution } from '../exercise/Solution';

type Choice = `${number}-${number}` | 'exotic';

const choiceOf = (pair: { from: number; to: number }): Choice => `${pair.from}-${pair.to}`;

function create(level: Level, choice: Choice): Exercise {
  const rng = createRng(randomSeed());
  if (choice === 'exotic') return generate(level, rng, { only: 'exotic' });
  const [from, to] = choice.split('-').map(Number) as [number, number];
  return generate(level, rng, { only: { from, to } });
}

/** Legge `?conversione=2-10&livello=medium` dall’indirizzo (per i link delle lezioni). */
function fromUrl(): { level: Level; choice: Choice } {
  const fallback = { level: 'easy' as Level, choice: choiceOf(PRACTICE_PAIRS[0] ?? { from: 2, to: 10 }) };
  if (typeof window === 'undefined') return fallback;
  const params = new URLSearchParams(window.location.search);
  const conv = params.get('conversione');
  const lvl = params.get('livello');
  const choice =
    conv === 'exotic' || PRACTICE_PAIRS.some((p) => choiceOf(p) === conv) ? (conv as Choice) : fallback.choice;
  const level = (LEVELS as readonly string[]).includes(lvl ?? '') ? (lvl as Level) : fallback.level;
  return { level, choice };
}

/** Allenamento libero: si sceglie conversione e livello, niente punteggio, procedimento sempre disponibile. */
export default function Practice() {
  const [initial] = useState(fromUrl);
  const [level, setLevel] = useState<Level>(initial.level);
  const [choice, setChoice] = useState<Choice>(initial.choice);
  const [exercise, setExercise] = useState<Exercise>(() => create(initial.level, initial.choice));
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Exclude<Check, { verdict: 'invalid' }> | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [tally, setTally] = useState({ correct: 0, total: 0 });
  const id = useId();

  function renew(nextLevel = level, nextChoice = choice) {
    setExercise(create(nextLevel, nextChoice));
    setRound((r) => r + 1);
    setResult(null);
    setShowSteps(false);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 fit:grid fit:min-h-0 fit:w-full fit:max-w-none fit:flex-1 fit:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] fit:gap-x-6">
      <div className="grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 sm:grid-cols-2 fit:grid-cols-1 fit:self-start">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-conversion`} className="font-semibold">
            {t('pr.conversion')}
          </label>
          <select
            id={`${id}-conversion`}
            value={choice}
            onChange={(e) => {
              const next = e.target.value as Choice;
              setChoice(next);
              renew(level, next);
            }}
            className="min-h-11 rounded-lg border border-border bg-surface px-2 text-text"
          >
            {PRACTICE_PAIRS.map((pair) => (
              <option key={choiceOf(pair)} value={choiceOf(pair)}>
                {tf('pr.conversion.option', pair)}
              </option>
            ))}
            <option value="exotic">{t('pr.conversion.exotic')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-level`} className="font-semibold">
            {t('pr.level')}
          </label>
          <select
            id={`${id}-level`}
            value={level}
            onChange={(e) => {
              const next = e.target.value as Level;
              setLevel(next);
              renew(next, choice);
            }}
            className="min-h-11 rounded-lg border border-border bg-surface px-2 text-text"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {levelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-text-muted sm:col-span-2 fit:col-span-1" aria-live="polite">
          {tf('pr.tally', tally)}
        </p>
      </div>

      <div className="rounded-[var(--radius)] border-2 border-border bg-surface p-5 fit:flex fit:min-h-0 fit:flex-col fit:overflow-auto">
        {result ? (
          <div className={REVIEW_GRID}>
            <p className={REVIEW_SOURCE}>
              <Numeral digits={exercise.source} base={exercise.from} group />
            </p>
            <p role="alert" className="rounded-lg bg-surface-muted px-4 py-3 text-lg">
              {result.verdict === 'correct' ? (
                <>
                  <span aria-hidden="true" className="me-2 font-bold text-correct">
                    ✓
                  </span>
                  {t('ex.correct')} <Numeral digits={exercise.answer} base={exercise.to} group />
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="me-2 font-bold text-wrong">
                    ✗
                  </span>
                  {tf('ex.wrong', { answer: exercise.answer })}
                  <span className="mt-1 block text-base text-text-muted">
                    {tf('ex.yourAnswer', { answer: result.answer })}
                  </span>
                </>
              )}
            </p>
            <div className={`flex flex-col ${REVIEW_SOLUTION}`}>
              {result.verdict === 'wrong' ? (
                <Solution steps={result.steps} diagnosis={result.diagnosis} />
              ) : showSteps ? (
                <Solution steps={solve(exercise.source, exercise.from, exercise.to)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSteps(true)}
                  className="min-h-11 self-start rounded-md border border-border px-4"
                >
                  {t('pr.showSolution')}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => renew()}
              className={`min-h-12 rounded-[var(--radius)] bg-accent px-6 text-lg font-bold text-accent-contrast ${REVIEW_BUTTON}`}
            >
              {t('pr.new')}
            </button>
          </div>
        ) : (
          <AnswerForm
            key={round}
            exercise={exercise}
            onResult={(r) => {
              setResult(r);
              setTally((x) => ({ correct: x.correct + (r.verdict === 'correct' ? 1 : 0), total: x.total + 1 }));
            }}
          />
        )}
      </div>
    </div>
  );
}
