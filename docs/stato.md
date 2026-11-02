# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- Fase 0 (branch `fase-0-setup`): Astro 7 + React 19 + TypeScript + Tailwind 4 + MDX, token propri con i nomi di Enigma (tema chiaro e scuro), layout con intestazione e piè di pagina, home, pagine segnaposto per sfida, allenamento, teoria e docenti, collezioni `lezioni` e `fonti`, `lint:content` copiato da Enigma, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages.

- Fase 1 (branch `fase-1-motore`): motore in `src/engine/` (vedi il suo README): numerali, procedimenti strutturati, generatore per livello con basi esotiche, `check` con diagnosi del primo errore; test unitari e di proprietà con fast-check.

## Prossimo passo

- Fase 2: sfida (endless e a vite), punteggio e streak in `src/game/`, interfaccia con animazioni, allenamento, codice sfida.

## Da decidere o calibrare

- Intervalli dei livelli in `KINDS` (`src/engine/generate.ts`): da provare in classe.
- Ordine delle ipotesi della somma pesata: in base 2 “potenza sbagliata verso l’alto” e “termine contato due volte” danno lo stesso valore; vince il secondo.

## Note operative

- Node: nel container c’è Node 22.23.4 in `/opt/node22/bin`, sufficiente per Astro 7; la CI usa Node 24 (`.nvmrc`).
- Playwright: tenere `@playwright/test@1.63.0` finché l’ambiente non cambia (browser in `/opt/pw-browsers`).
- `astro preview` va lanciato con `--ignore-lock`.
