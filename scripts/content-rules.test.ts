import { describe, expect, it } from 'vitest';
import { lintContent } from './content-rules.ts';

const rulesOf = (source: string) => lintContent(source).map((issue) => issue.rule);

describe('lintContent', () => {
  it('accetta la prosa con caratteri tipografici corretti', () => {
    expect(lintContent('L’operatore preme un tasto — e si accende una “lampada”.')).toEqual([]);
  });

  it('segnala virgolette e apostrofi diritti', () => {
    expect(rulesOf('L\'operatore disse "ciao".')).toEqual(['virgolette-diritte', 'apostrofo-diritto']);
  });

  it('segnala gli incisi con trattino corto e gli acronimi con i punti', () => {
    expect(rulesOf('La macchina - brevettata nel 1918 - arrivò negli U.S.A.')).toEqual([
      'inciso-trattino',
      'acronimo-con-punti',
    ]);
  });

  it('ignora codice, import e tag JSX', () => {
    const source = [
      "import Figura from '@/components/Figura.astro';",
      '```js',
      "const a = 'x';",
      '```',
      '<Figura src="a.png" alt="Rotore" />',
      'Il valore `"A"` resta com’è.',
    ].join('\n');
    expect(lintContent(source)).toEqual([]);
  });

  it('controlla title e description nel frontmatter', () => {
    const source = ['---', "title: 'Che cos'è Enigma'", 'ordine: 1', '---', 'Testo.'].join('\n');
    expect(rulesOf(source)).toEqual(['apostrofo-diritto']);
  });

  it('avvisa per maiuscole nei titoli e numeri piccoli in cifre', () => {
    expect(rulesOf('## Il Riflettore')).toEqual(['maiuscole-titolo']);
    expect(rulesOf('La macchina ha 3 rotori.')).toEqual(['numero-in-cifre']);
    expect(rulesOf('Nel 1918 e con 26 lettere.')).toEqual([]);
    expect(rulesOf('Arrivò il 10 luglio 1944, con 3 giorni di ritardo.')).toEqual(['numero-in-cifre']);
    expect(rulesOf('Arrivò il 2 novembre 1944.')).toEqual([]);
  });
});
