# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- Fase 0 (PR #1, unita): Astro 7 + React 19 + TypeScript + Tailwind 4 + MDX, token propri con i nomi di Enigma (tema chiaro e scuro), layout con intestazione e piè di pagina, home, pagine segnaposto per sfida, allenamento, teoria e docenti, collezioni `lezioni` e `fonti`, `lint:content` copiato da Enigma, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages.

- Fase 1 (PR #2, unita): motore in `src/engine/` (vedi il suo README): numerali, procedimenti strutturati, generatore per livello con basi esotiche, `check` con diagnosi del primo errore; test unitari e di proprietà con fast-check.

- Fase 2 (branch `fase-2-sfida`): logica della sfida in `src/game/` (endless e a vite, livelli, streak, moltiplicatore, codice sfida deterministico per turno, con test); componenti condivisi in `src/components/exercise/` (campo di risposta con tastierino sui dispositivi touch e valore intermedio facoltativo, procedimento con il primo errore evidenziato, messaggi di diagnosi); sfida in `src/components/challenge/` (HUD con streak arcobaleno, messaggi a comparsa, coriandoli con `canvas-confetti`, scossone con Motion, suoni Web Audio spenti di default, record in `localStorage`, link con il codice sfida); allenamento in `src/components/practice/`. Test e2e con axe su sfida e allenamento.

## Prossimo passo

- Fase 3: le sette lezioni di teoria in bozza, con i widget.

## Da decidere o calibrare

- Intervalli dei livelli in `KINDS` (`src/engine/generate.ts`): da provare in classe.
- Ordine delle ipotesi della somma pesata: in base 2 “potenza sbagliata verso l’alto” e “termine contato due volte” danno lo stesso valore; vince il secondo.

## Note operative

- Node: nel container c’è Node 22.23.4 in `/opt/node22/bin`, sufficiente per Astro 7; la CI usa Node 24 (`.nvmrc`).
- Playwright: tenere `@playwright/test@1.63.0` finché l’ambiente non cambia (browser in `/opt/pw-browsers`).
- `astro preview` va lanciato con `--ignore-lock`.
