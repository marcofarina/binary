import type { Diagnosis, DivisionSteps, GroupingSteps, PositionalSteps, Steps } from '@/engine';
import { t, tf } from '@/i18n';
import { diagnosisMessage, superscript } from './labels';
import { Numeral } from './Numeral';

interface Props {
  steps: Steps;
  /** Assente quando si mostra il procedimento dopo una risposta giusta. */
  diagnosis?: Diagnosis;
}

const HIGHLIGHT = 'bg-wrong/15 outline outline-2 outline-wrong';

function Marker() {
  return (
    <span className="ms-2 inline-block rounded bg-wrong px-1.5 text-xs font-semibold text-surface">
      ← {t('sol.highlight')}
    </span>
  );
}

function Positional({ steps, highlight }: { steps: PositionalSteps; highlight: number | null }) {
  return (
    <table className="w-full max-w-md border-collapse font-mono text-base">
      <caption className="mb-2 text-left font-sans text-sm text-text-muted">{t('sol.positional.caption')}</caption>
      <thead className="font-sans text-sm text-text-muted">
        <tr>
          <th scope="col" className="px-2 py-1 text-left font-normal">
            {t('sol.positional.digit')}
          </th>
          <th scope="col" className="px-2 py-1 text-left font-normal">
            {t('sol.positional.weight')}
          </th>
          <th scope="col" className="px-2 py-1 text-right font-normal">
            {t('sol.positional.product')}
          </th>
        </tr>
      </thead>
      <tbody>
        {steps.terms.map((term, i) => (
          <tr key={i} className={i === highlight ? HIGHLIGHT : 'border-t border-border'}>
            <td className="px-2 py-1">
              {term.digit}
              {term.digitValue >= 10 && <span className="text-text-muted"> = {term.digitValue}</span>}
            </td>
            <td className="px-2 py-1">
              × {steps.base}
              {superscript(term.exponent)} <span className="text-text-muted">= {term.weight}</span>
            </td>
            <td className="px-2 py-1 text-right">
              {term.product}
              {i === highlight && <Marker />}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-text">
          <th scope="row" colSpan={2} className="px-2 py-1 text-left font-sans">
            {t('sol.positional.total')}
          </th>
          <td className="px-2 py-1 text-right font-bold">{steps.total}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function Division({ steps, highlight }: { steps: DivisionSteps; highlight: number | null }) {
  return (
    <div>
      <table className="w-full max-w-md border-collapse font-mono text-base">
        <caption className="mb-2 text-left font-sans text-sm text-text-muted">
          {tf('sol.division.caption', { base: steps.base })}
        </caption>
        <thead className="font-sans text-sm text-text-muted">
          <tr>
            <th scope="col" className="px-2 py-1 text-right font-normal">
              {t('sol.division.dividend')}
            </th>
            <th scope="col" className="px-2 py-1 text-right font-normal">
              {t('sol.division.quotient')}
            </th>
            <th scope="col" className="px-2 py-1 text-left font-normal">
              {t('sol.division.remainder')}
            </th>
          </tr>
        </thead>
        <tbody>
          {steps.rows.map((row, i) => (
            <tr key={i} className={i === highlight ? HIGHLIGHT : 'border-t border-border'}>
              <td className="px-2 py-1 text-right">
                {row.dividend} <span className="text-text-muted">: {steps.base}</span>
              </td>
              <td className="px-2 py-1 text-right">{row.quotient}</td>
              <td className="px-2 py-1 font-bold">
                {row.digit}
                {row.remainder >= 10 && <span className="font-normal text-text-muted"> ({row.remainder})</span>}
                {i === highlight && <Marker />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm">
        <span aria-hidden="true">↑ </span>
        {tf('sol.division.read', { result: steps.result })}
      </p>
    </div>
  );
}

function Grouping({ steps, highlight }: { steps: GroupingSteps; highlight: number | null }) {
  const expand = steps.direction === 'expand';
  const padded = steps.groups.some((g) => g.padding > 0);
  return (
    <figure>
      <figcaption className="mb-2 text-sm text-text-muted">
        {tf(expand ? 'sol.expand.caption' : 'sol.group.caption', { bits: steps.bitsPerGroup })}
      </figcaption>
      <ol className="flex flex-wrap gap-2">
        {steps.groups.map((group, i) => {
          const bits = (
            <span className="font-mono text-lg tracking-wider">
              <span className="text-text-muted opacity-60">{group.bits.slice(0, group.padding)}</span>
              {group.bits.slice(group.padding)}
            </span>
          );
          const digit = <span className="font-mono text-2xl font-bold">{group.digit}</span>;
          return (
            <li
              key={i}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 ${
                i === highlight ? HIGHLIGHT : 'border-border bg-surface-muted'
              }`}
            >
              {expand ? digit : bits}
              <span aria-hidden="true" className="text-text-muted">
                ↓
              </span>
              {expand ? bits : digit}
              {i === highlight && <span className="sr-only">({t('sol.highlight')})</span>}
            </li>
          );
        })}
      </ol>
      {padded && <p className="mt-2 text-sm text-text-muted">{t('sol.group.padding')}</p>}
    </figure>
  );
}

type TwoPhase = Extract<Steps, { method: 'via-binary' | 'via-decimal' }>;
type SinglePhase = Exclude<Steps, TwoPhase>;

const isTwoPhase = (steps: Steps): steps is TwoPhase => steps.method === 'via-binary' || steps.method === 'via-decimal';

function Part({ steps, highlight }: { steps: SinglePhase; highlight: number | null }) {
  switch (steps.method) {
    case 'positional':
      return <Positional steps={steps} highlight={highlight} />;
    case 'division':
      return <Division steps={steps} highlight={highlight} />;
    case 'grouping':
      return <Grouping steps={steps} highlight={highlight} />;
  }
}

/** Il procedimento completo, con il probabile primo errore evidenziato e spiegato. */
export function Solution({ steps, diagnosis }: Props) {
  const index = diagnosis?.index ?? null;
  return (
    <section aria-labelledby="procedimento" className="flex flex-col gap-4">
      <h2 id="procedimento" className="text-lg font-bold">
        {t('sol.title')}
      </h2>
      {diagnosis && (
        <p className="rounded-lg border-l-4 border-wrong bg-surface-muted px-4 py-3" data-testid="diagnosi">
          {diagnosisMessage(steps, diagnosis)}
          {diagnosis.phase && <> {tf('sol.errorInPhase', { phase: diagnosis.phase === 'first' ? 1 : 2 })}</>}
        </p>
      )}
      {isTwoPhase(steps) ? (
        <>
          <PhaseHeading steps={steps} which="first" />
          <Part steps={steps.first} highlight={diagnosis?.phase === 'first' ? index : null} />
          <p className="text-sm">
            {steps.method === 'via-decimal' ? (
              <Numeral digits={String(steps.second.method === 'division' ? steps.second.value : 0)} base={10} />
            ) : (
              <Numeral digits={steps.first.method === 'grouping' ? steps.first.binary : ''} base={2} group />
            )}
          </p>
          <PhaseHeading steps={steps} which="second" />
          <Part steps={steps.second} highlight={diagnosis?.phase === 'second' ? index : null} />
        </>
      ) : (
        <Part steps={steps as SinglePhase} highlight={index} />
      )}
    </section>
  );
}

function PhaseHeading({
  steps,
  which,
}: {
  steps: Extract<Steps, { method: 'via-binary' | 'via-decimal' }>;
  which: 'first' | 'second';
}) {
  const from = steps.first.base;
  const to = steps.second.base;
  const key =
    steps.method === 'via-decimal'
      ? which === 'first'
        ? 'sol.phase.viaDecimal.first'
        : 'sol.phase.viaDecimal.second'
      : which === 'first'
        ? 'sol.phase.viaBinary.first'
        : 'sol.phase.viaBinary.second';
  return <h3 className="font-semibold">{tf(key, { from, to })}</h3>;
}
