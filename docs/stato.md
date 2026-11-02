# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- Fase 0 (branch `fase-0-setup`): Astro 7 + React 19 + TypeScript + Tailwind 4 + MDX, token propri con i nomi di Enigma (tema chiaro e scuro), layout con intestazione e piè di pagina, home, pagine segnaposto per sfida, allenamento, teoria e docenti, collezioni `lezioni` e `fonti`, `lint:content` copiato da Enigma, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages.

## Prossimo passo

- Marco: sottodominio (vedi README, “Pubblicazione”).
- Fase 1: motore.

## Note operative

- Node: nel container c’è Node 22.23.4 in `/opt/node22/bin`, sufficiente per Astro 7; la CI usa Node 24 (`.nvmrc`).
- Playwright: tenere `@playwright/test@1.63.0` finché l’ambiente non cambia (browser in `/opt/pw-browsers`).
- `astro preview` va lanciato con `--ignore-lock`.
