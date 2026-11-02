/**
 * Regole tipografiche per la prosa italiana dei contenuti (vedi docs/piano.md).
 * Valgono solo per il testo discorsivo: blocchi di codice, codice inline, import/export
 * e tag JSX vengono ignorati.
 */

export type Severity = 'error' | 'warning';

export interface Issue {
  line: number;
  severity: Severity;
  rule: string;
  message: string;
}

const rules: { rule: string; severity: Severity; pattern: RegExp; message: string }[] = [
  {
    rule: 'virgolette-diritte',
    severity: 'error',
    pattern: /"/,
    message: 'Usa le virgolette tipografiche “…” al posto di quelle diritte.',
  },
  {
    rule: 'apostrofo-diritto',
    severity: 'error',
    pattern: /'/,
    message: 'Usa l’apostrofo tipografico ’ al posto di quello diritto.',
  },
  {
    rule: 'inciso-trattino',
    severity: 'error',
    pattern: /\s[-–]\s/,
    message: 'Per gli incisi usa il trattino lungo — al posto di - o –.',
  },
  {
    rule: 'acronimo-con-punti',
    severity: 'error',
    pattern: /\b(?:[A-Z]\.){2,}/,
    message: 'Scrivi gli acronimi in maiuscolo senza punti (per esempio USA, non U.S.A.).',
  },
  {
    rule: 'maiuscola-dopo-due-punti',
    severity: 'warning',
    pattern: /[:;] [A-ZÀÈÉÌÒÙ][a-zà-ù]/,
    message: 'Dopo due punti o punto e virgola di norma non va la maiuscola (salvo nomi propri).',
  },
  {
    rule: 'numero-in-cifre',
    severity: 'warning',
    // Le date restano in cifre: “il 10 luglio 1944”.
    pattern:
      /(?<![\d.,/-])\b(?:[0-9]|10)\b(?![\d.,/×x-]) (?!(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b)[a-zà-ù]/,
    message: 'I numeri fino a dieci vanno scritti in lettere nel testo discorsivo.',
  },
];

/** Toglie dalla riga le parti che non sono prosa. */
function stripNonProse(line: string): string {
  return line
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '');
}

function checkHeading(text: string): string | null {
  const words = text.split(/\s+/).slice(1);
  const capitalized = words.filter((w) => /^[A-ZÀÈÉÌÒÙ][a-zà-ù’]+$/.test(w));
  return capitalized.length > 0 ? capitalized.join(', ') : null;
}

export function lintContent(source: string): Issue[] {
  const issues: Issue[] = [];
  const lines = source.split('\n');
  let inFence = false;
  let inFrontmatter = lines[0]?.trim() === '---';

  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    if (index === 0 && inFrontmatter) return;
    if (inFrontmatter) {
      if (raw.trim() === '---') {
        inFrontmatter = false;
        return;
      }
      // Nel frontmatter si controllano solo i valori testuali di title e description.
      const match = /^(title|description):\s*(.*)$/.exec(raw);
      if (!match?.[2]) return;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      for (const r of rules.filter((r) => r.severity === 'error')) {
        if (r.pattern.test(value))
          issues.push({ line: lineNumber, severity: r.severity, rule: r.rule, message: r.message });
      }
      return;
    }
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence || /^\s*(import|export)\s/.test(raw) || /^\s*<\/?[A-Za-z]/.test(raw)) return;

    const prose = stripNonProse(raw);
    for (const r of rules) {
      if (r.pattern.test(prose))
        issues.push({ line: lineNumber, severity: r.severity, rule: r.rule, message: r.message });
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(raw);
    if (heading?.[1]) {
      const words = checkHeading(stripNonProse(heading[1]));
      if (words) {
        issues.push({
          line: lineNumber,
          severity: 'warning',
          rule: 'maiuscole-titolo',
          message: `Nei titoli la maiuscola va solo sulla prima parola e sui nomi propri: controlla ${words}.`,
        });
      }
    }
  });

  return issues;
}
