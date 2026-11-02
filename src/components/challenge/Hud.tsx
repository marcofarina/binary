import { motion } from 'motion/react';
import { type Level, LEVELS } from '@/engine';
import { type GameState, LEVEL_UP_AFTER, LIVES } from '@/game/game';
import { multiplier } from '@/game/scoring';
import { t, tf } from '@/i18n';
import { levelLabel } from '../exercise/labels';

/** Sette bit dell’arcobaleno che si accendono uno a ogni risposta giusta di fila. */
export function RainbowStreak({ streak }: { streak: number }) {
  const lit = streak === 0 ? 0 : ((streak - 1) % 7) + 1;
  const laps = streak === 0 ? 0 : Math.floor((streak - 1) / 7);
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <motion.span
          key={`${n}-${laps}`}
          className="h-2.5 flex-1 rounded-full"
          initial={false}
          animate={{
            backgroundColor: n <= lit ? `var(--color-rainbow-${n})` : 'var(--color-surface-muted)',
            scaleY: n === lit ? [1, 1.8, 1] : 1,
          }}
          transition={{ duration: 0.35 }}
        />
      ))}
    </div>
  );
}

function Flame({ factor }: { factor: number }) {
  const size = 18 + factor * 4;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="text-streak">
      <path
        fill="currentColor"
        d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.3 2.5 1.5 0 2.4-1.2 2.2-3 2.2 1.8 3.5 4.3 3.5 7A7.5 7.5 0 0 1 4.5 16c0-4.2 3-6.4 4.6-9 .9-1.4 2.1-3.2 2.9-5z"
      />
    </svg>
  );
}

function LevelPips({ level }: { level: Level }) {
  const rank = LEVELS.indexOf(level);
  return (
    <span className="flex gap-1" aria-hidden="true">
      {LEVELS.map((l, i) => (
        <span key={l} className={`h-3 w-5 rounded-sm ${i <= rank ? 'bg-accent' : 'bg-surface-muted'}`} />
      ))}
    </span>
  );
}

export function Hud({ state, sound, onToggleSound }: { state: GameState; sound: boolean; onToggleSound: () => void }) {
  const factor = multiplier(state.streak);
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4">
      <dl className="grid grid-cols-3 items-start gap-2 text-center">
        <div>
          <dt className="text-xs text-text-muted uppercase">{t('ch.hud.score')}</dt>
          <dd className="font-mono text-2xl font-bold" data-testid="punti">
            <motion.span key={state.score} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block">
              {state.score}
            </motion.span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted uppercase">{t('ch.hud.streak')}</dt>
          <dd className="flex items-center justify-center gap-1 font-mono text-2xl font-bold" data-testid="streak">
            {state.streak > 0 && <Flame factor={factor} />}
            <motion.span key={state.streak} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="inline-block">
              {state.streak}
            </motion.span>
            {factor > 1 && (
              <span className="rounded bg-streak px-1 text-sm text-surface">
                <span aria-hidden="true">×{factor}</span>
                <span className="sr-only">{tf('ch.hud.multiplier', { factor })}</span>
              </span>
            )}
          </dd>
        </div>
        {state.mode === 'lives' ? (
          <div>
            <dt className="text-xs text-text-muted uppercase">{t('ch.hud.lives')}</dt>
            <dd className="flex justify-center gap-0.5 text-2xl" data-testid="vite">
              <span className="sr-only">{tf('ch.hud.livesValue', { lives: state.lives, max: LIVES })}</span>
              {Array.from({ length: LIVES }, (_, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  animate={{ scale: i < state.lives ? 1 : 0.7, opacity: i < state.lives ? 1 : 0.25 }}
                  className="text-wrong"
                >
                  ♥
                </motion.span>
              ))}
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-xs text-text-muted uppercase">{t('ch.hud.level')}</dt>
            <dd className="flex flex-col items-center gap-1" data-testid="livello" data-level={state.level}>
              <span className="font-semibold">{levelLabel(state.level)}</span>
              <LevelPips level={state.level} />
              {state.level !== 'hard' && (
                <span className="text-xs text-text-muted">
                  {tf('ch.hud.progress', { count: state.levelProgress, total: LEVEL_UP_AFTER })}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
      <RainbowStreak streak={state.streak} />
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>{tf('ch.hud.code', { code: state.seed })}</span>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={sound}
          className="min-h-11 rounded-md border border-border px-3 text-text"
        >
          {sound ? t('ch.sound.on') : t('ch.sound.off')}
        </button>
      </div>
    </div>
  );
}
