import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { type Check, check, DIGITS, type Exercise, methodFor, type ParseError, parseNumeral } from '@/engine';
import { t, tf, type UiKey } from '@/i18n';
import { allowedDigits } from './labels';
import { Numeral } from './Numeral';

interface Props {
  exercise: Exercise;
  disabled?: boolean;
  onResult: (result: Exclude<Check, { verdict: 'invalid' }>, answer: string) => void;
}

function invalidMessage(error: ParseError, base: number): string {
  switch (error.kind) {
    case 'empty':
      return t('ex.invalid.empty');
    case 'invalidDigit':
      return tf('ex.invalid.digit', { char: error.char, base, digits: allowedDigits(base) });
    case 'tooLarge':
      return t('ex.invalid.tooLarge');
  }
}

/** La consegna con il campo di risposta, il tastierino per i telefoni e il valore intermedio facoltativo. */
/** Il componente va montato con `key` diverso a ogni esercizio, così i campi ripartono vuoti. */
export function AnswerForm({ exercise, disabled = false, onResult }: Props) {
  const [text, setText] = useState('');
  const [intermediate, setIntermediate] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const viaDecimal = methodFor(exercise.from, exercise.to) === 'via-decimal';

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  function update(next: string) {
    setText(next);
    const parsed = parseNumeral(next, exercise.to);
    // Mentre si scrive si segnala solo la cifra non valida, non il campo vuoto.
    setMessage(!parsed.ok && parsed.error.kind !== 'empty' ? invalidMessage(parsed.error, exercise.to) : null);
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled) return;
    const result = check(exercise, text, { intermediate });
    if (result.verdict === 'invalid') {
      setMessage(invalidMessage(result.error, exercise.to));
      input.current?.focus();
      return;
    }
    onResult(result, text);
  }

  const keys = [...DIGITS.slice(0, exercise.to)];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 fit:my-auto fit:gap-3" noValidate>
      <p
        className="text-center text-3xl font-bold sm:text-5xl fit:text-6xl"
        data-testid="consegna"
        data-from={exercise.from}
        data-to={exercise.to}
        data-source={exercise.source}
      >
        <Numeral digits={exercise.source} base={exercise.from} group />
      </p>
      <p className="text-center text-text-muted">
        {tf('ex.prompt', { to: exercise.to })}
        {[2, 8, 10, 16].includes(exercise.to) && ` (${t(`base.name.${exercise.to}` as UiKey)})`}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-answer`} className="font-semibold">
          {tf('ex.answer', { to: exercise.to })}
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={input}
            id={`${id}-answer`}
            value={text}
            onChange={(e) => update(e.target.value)}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode={exercise.to <= 10 ? 'numeric' : 'text'}
            aria-describedby={`${id}-hint ${id}-message`}
            aria-invalid={message !== null}
            className="min-h-12 w-full rounded-[var(--radius)] border-2 border-border bg-surface px-3 font-mono text-2xl tracking-wider text-text uppercase focus:border-accent"
          />
          <span aria-hidden="true" className="self-end pb-1 text-sm text-text-muted">
            {exercise.to}
          </span>
        </div>
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {tf('ex.answerHint', { digits: allowedDigits(exercise.to) })}
        </p>
        <p id={`${id}-message`} role="status" className="min-h-6 text-sm font-semibold text-wrong">
          {message}
        </p>
      </div>

      <div
        className="hidden grid-cols-4 gap-2 pointer-coarse:grid fit:grid-cols-9"
        role="group"
        aria-label={t('ex.keypad')}
      >
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => update(text + key)}
            className="min-h-12 rounded-lg border border-border bg-surface-muted font-mono text-xl font-bold"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => update(text.slice(0, -1))}
          aria-label={t('ex.backspace')}
          className="min-h-12 rounded-lg border border-border bg-surface-muted text-xl"
        >
          ⌫
        </button>
      </div>

      {viaDecimal && (
        <details className="rounded-lg border border-border px-3 py-2">
          <summary className="cursor-pointer font-semibold">{t('ex.intermediate')}</summary>
          <label htmlFor={`${id}-intermediate`} className="sr-only">
            {t('ex.intermediate')}
          </label>
          <input
            id={`${id}-intermediate`}
            value={intermediate}
            onChange={(e) => setIntermediate(e.target.value)}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={`${id}-intermediate-hint`}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 font-mono text-xl"
          />
          <p id={`${id}-intermediate-hint`} className="mt-1 text-sm text-text-muted">
            {t('ex.intermediateHint')}
          </p>
        </details>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="min-h-12 rounded-[var(--radius)] bg-accent px-6 text-lg font-bold text-accent-contrast disabled:opacity-60"
      >
        {t('ex.check')}
      </button>
    </form>
  );
}
