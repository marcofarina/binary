import { AnimatePresence, MotionConfig, motion, useAnimationControls } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Check } from '@/engine';
import {
  accuracy,
  answer,
  createGame,
  endGame,
  type GameEvent,
  type GameState,
  isSeed,
  type Mode,
  nextRound,
  randomSeed,
} from '@/game/game';
import { t, tf } from '@/i18n';
import { AnswerForm } from '../exercise/AnswerForm';
import { levelLabel } from '../exercise/labels';
import { Numeral } from '../exercise/Numeral';
import { Solution } from '../exercise/Solution';
import { burst } from './celebrate';
import { Hud } from './Hud';
import { loadRecords, type Records, saveResult } from './records';
import { loadSoundPreference, play, saveSoundPreference } from './sound';

type Wrong = Extract<Check, { verdict: 'wrong' }>;

interface Toast {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'big';
}

/** Pausa dopo una risposta giusta, per godersi l’animazione prima del prossimo numero. */
const CORRECT_PAUSE = 900;

function readUrl(): { mode: Mode; code: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    return { mode: params.get('modalita') === 'vite' ? 'lives' : 'endless', code: params.get('codice') ?? '' };
  } catch {
    return { mode: 'endless', code: '' };
  }
}

export default function Challenge() {
  const [screen, setScreen] = useState<'start' | 'play' | 'over'>('start');
  // Il componente gira solo nel browser (client:only), quindi indirizzo e localStorage si leggono subito.
  const [mode, setMode] = useState<Mode>(() => readUrl().mode);
  const [code, setCode] = useState(() => readUrl().code);
  const [codeError, setCodeError] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [review, setReview] = useState<{ result: Wrong; answer: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sound, setSound] = useState(loadSoundPreference);
  const [records, setRecords] = useState<Records>(loadRecords);
  const [beaten, setBeaten] = useState(false);
  const card = useAnimationControls();
  const toastId = useRef(0);
  const nextButton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (review) nextButton.current?.focus();
  }, [review]);

  const toast = useCallback((text: string, tone: Toast['tone']) => {
    const item = { id: ++toastId.current, text, tone };
    setToasts((all) => [...all.slice(-2), item]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== item.id)), 1600);
  }, []);

  function start() {
    let seed = randomSeed();
    if (code.trim() !== '') {
      const parsed = Number(code.trim());
      if (!isSeed(parsed)) {
        setCodeError(true);
        return;
      }
      seed = parsed;
    }
    setCodeError(false);
    setGame(createGame(mode, seed));
    setReview(null);
    setBeaten(false);
    setScreen('play');
  }

  function finish(state: GameState) {
    const result = saveResult(state.mode, state.score, state.bestStreak);
    setBeaten(result.score || result.streak);
    setRecords(loadRecords());
    setGame(state);
    setScreen('over');
    if (result.score && state.score > 0) burst('big');
  }

  function celebrate(events: GameEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case 'correct':
          toast(
            event.multiplier > 1
              ? `${tf('ch.points', { points: event.points })} ×${event.multiplier}`
              : tf('ch.points', { points: event.points }),
            'good',
          );
          if (sound) play('correct');
          break;
        case 'multiplierUp':
          toast(tf('ch.multiplierUp', { factor: event.multiplier }), 'big');
          break;
        case 'milestone':
          toast(tf('ch.milestone', { streak: event.streak }), 'big');
          burst(event.streak >= 20 ? 'big' : 'small');
          if (sound) play('milestone');
          break;
        case 'levelUp':
          toast(tf('ch.levelUp', { level: levelLabel(event.level) }), 'big');
          burst('small');
          if (sound) play('levelUp');
          break;
        case 'wrong':
          void card.start({ x: [0, -12, 12, -8, 8, 0], transition: { duration: 0.4 } });
          if (sound) play('wrong');
          break;
        case 'streakBroken':
          toast(tf('ch.streakBroken', { streak: event.streak }), 'bad');
          break;
        case 'levelDown':
          toast(tf('ch.levelDown', { level: levelLabel(event.level) }), 'bad');
          break;
        case 'lifeLost':
          if (event.lives > 0) toast(tf('ch.lifeLost', { lives: event.lives }), 'bad');
          break;
        case 'gameOver':
          break;
      }
    }
  }

  function onResult(result: Exclude<Check, { verdict: 'invalid' }>, text: string) {
    if (!game || busy) return;
    const step = answer(game, result.verdict === 'correct' ? 'correct' : 'wrong');
    celebrate(step.events);
    setGame(step.state);
    if (result.verdict === 'correct') {
      setBusy(true);
      setTimeout(() => {
        setGame((current) => (current ? nextRound(current) : current));
        setBusy(false);
      }, CORRECT_PAUSE);
    } else {
      setReview({ result, answer: text });
    }
  }

  function next() {
    if (!game) return;
    setReview(null);
    if (game.over) finish(game);
    else setGame(nextRound(game));
  }

  function toggleSound() {
    setSound((on) => {
      saveSoundPreference(!on);
      return !on;
    });
  }

  if (screen === 'start' || !game) {
    const record = records[mode];
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-lg font-bold">{t('ch.mode')}</legend>
          {(['endless', 'lives'] as const).map((m) => (
            <div
              key={m}
              className={`flex gap-3 rounded-[var(--radius)] border-2 bg-surface p-4 ${mode === m ? 'border-accent' : 'border-border'}`}
            >
              <input
                id={`${id}-mode-${m}`}
                type="radio"
                name={`${id}-mode`}
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                aria-describedby={`${id}-mode-${m}-text`}
                className="mt-1 size-5 accent-[var(--color-accent)]"
              />
              <div>
                <label htmlFor={`${id}-mode-${m}`} className="block cursor-pointer text-lg font-bold">
                  {t(m === 'endless' ? 'ch.mode.endless' : 'ch.mode.lives')}
                </label>
                <p id={`${id}-mode-${m}-text`} className="text-text-muted">
                  {t(m === 'endless' ? 'ch.mode.endless.text' : 'ch.mode.lives.text')}
                </p>
              </div>
            </div>
          ))}
        </fieldset>

        <details className="rounded-[var(--radius)] border border-border bg-surface px-4 py-3" open={code !== ''}>
          <summary className="cursor-pointer font-semibold">{t('ch.code')}</summary>
          <label htmlFor={`${id}-code`} className="sr-only">
            {t('ch.code')}
          </label>
          <input
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={`${id}-code-hint`}
            aria-invalid={codeError}
            className="mt-2 min-h-11 w-40 rounded-lg border border-border bg-surface px-3 font-mono text-xl"
          />
          <p
            id={`${id}-code-hint`}
            className={`mt-1 text-sm ${codeError ? 'font-semibold text-wrong' : 'text-text-muted'}`}
          >
            {codeError ? t('ch.codeInvalid') : t('ch.codeHint')}
          </p>
        </details>

        <button
          type="button"
          onClick={start}
          className="min-h-14 rounded-[var(--radius)] bg-accent px-6 text-xl font-bold text-accent-contrast"
        >
          {t('ch.start')}
        </button>

        <section aria-labelledby={`${id}-records`} className="text-text-muted">
          <h2 id={`${id}-records`} className="font-semibold text-text">
            {t('ch.records')}
          </h2>
          {record ? (
            <p>
              {tf('ch.records.score', { score: record.bestScore })} ·{' '}
              {tf('ch.records.streak', { streak: record.bestStreak })}
            </p>
          ) : (
            <p>{t('ch.records.none')}</p>
          )}
        </section>
      </div>
    );
  }

  if (screen === 'over') {
    const total = game.correct + game.wrong;
    const share = `${window.location.origin}${window.location.pathname}?codice=${game.seed}${game.mode === 'lives' ? '&modalita=vite' : ''}`;
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby={`${id}-over`}
        className="mx-auto flex max-w-xl flex-col gap-5 rounded-[var(--radius)] border border-border bg-surface p-6 text-center"
      >
        <h2 id={`${id}-over`} className="text-3xl font-extrabold">
          {t('ch.over.title')}
        </h2>
        {beaten && <p className="text-xl font-bold text-streak">{t('ch.over.record')}</p>}
        <dl className="grid grid-cols-2 gap-4">
          {[
            [t('ch.over.score'), game.score],
            [t('ch.over.bestStreak'), game.bestStreak],
            [t('ch.over.maxLevel'), levelLabel(game.maxLevel)],
            [
              t('ch.over.accuracy'),
              `${tf('ch.over.accuracyValue', { correct: game.correct, total })} (${Math.round(accuracy(game) * 100)}%)`,
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-surface-muted p-3">
              <dt className="text-sm text-text-muted">{label}</dt>
              <dd className="text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2 text-sm">
          <p>{t('ch.over.share')}</p>
          <ShareLink url={share} />
        </div>
        <button
          type="button"
          onClick={() => {
            setCode('');
            setScreen('start');
          }}
          className="min-h-12 rounded-[var(--radius)] bg-accent px-6 text-lg font-bold text-accent-contrast"
        >
          {t('ch.over.again')}
        </button>
      </motion.section>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative mx-auto flex max-w-2xl flex-col gap-4">
        <Hud state={game} sound={sound} onToggleSound={toggleSound} />

        <div
          aria-live="polite"
          data-testid="messaggi"
          className="pointer-events-none absolute inset-x-0 top-28 z-10 flex flex-col items-center gap-2"
        >
          <AnimatePresence>
            {toasts.map((item) => (
              <motion.p
                key={item.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: item.tone === 'big' ? 1.15 : 1 }}
                exit={{ opacity: 0, y: -30 }}
                className={`rounded-full px-4 py-1 font-bold shadow-lg ${
                  item.tone === 'bad'
                    ? 'bg-surface text-wrong ring-2 ring-wrong'
                    : item.tone === 'big'
                      ? 'bg-accent text-xl text-accent-contrast'
                      : 'bg-surface text-correct ring-2 ring-correct'
                }`}
              >
                {item.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          animate={card}
          className="rounded-[var(--radius)] border-2 bg-surface p-5"
          style={{
            borderColor:
              game.streak > 0 ? `var(--color-rainbow-${((game.streak - 1) % 7) + 1})` : 'var(--color-border)',
          }}
        >
          {review ? (
            <div className="flex flex-col gap-4">
              <p className="text-center text-2xl">
                <Numeral digits={game.exercise.source} base={game.exercise.from} group />
              </p>
              <p role="alert" className="rounded-lg bg-surface-muted px-4 py-3 text-lg">
                <span aria-hidden="true" className="me-2 font-bold text-wrong">
                  ✗
                </span>
                {tf('ex.wrong', { answer: game.exercise.answer })}
                <span className="mt-1 block text-base text-text-muted">
                  {tf('ex.yourAnswer', { answer: review.result.answer })}
                </span>
              </p>
              <Solution steps={review.result.steps} diagnosis={review.result.diagnosis} />
              <button
                ref={nextButton}
                type="button"
                onClick={next}
                className="min-h-12 rounded-[var(--radius)] bg-accent px-6 text-lg font-bold text-accent-contrast"
              >
                {game.over ? t('ch.over.title') : t('ex.next')}
              </button>
            </div>
          ) : (
            <AnswerForm key={game.round} exercise={game.exercise} disabled={busy} onResult={onResult} />
          )}
          {busy && (
            <p role="status" className="mt-3 text-center text-lg font-bold text-correct">
              <span aria-hidden="true">✓ </span>
              {t('ex.correct')}
            </p>
          )}
        </motion.div>

        {game.mode === 'endless' && !review && (
          <button
            type="button"
            onClick={() => finish(endGame(game))}
            className="min-h-11 self-end rounded-md border border-border px-4 text-text"
          >
            {t('ch.end')}
          </button>
        )}
      </div>
    </MotionConfig>
  );
}

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <code className="rounded bg-surface-muted px-2 py-1 break-all">{url}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => setCopied(true));
        }}
        className="min-h-11 rounded-md border border-border px-3"
      >
        {copied ? t('ch.over.copied') : t('ch.over.copy')}
      </button>
    </div>
  );
}
