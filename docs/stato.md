# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- Fase 0 (PR #1, unita): Astro 7 + React 19 + TypeScript + Tailwind 4 + MDX, token propri con i nomi di Enigma (tema chiaro e scuro), layout con intestazione e piè di pagina, home, pagine segnaposto per sfida, allenamento, teoria e docenti, collezioni `lezioni` e `fonti`, `lint:content` copiato da Enigma, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages.

- Fase 1 (PR #2, unita): motore in `src/engine/` (vedi il suo README): numerali, procedimenti strutturati, generatore per livello con basi esotiche, `check` con diagnosi del primo errore; test unitari e di proprietà con fast-check.

- Fase 2 (PR #3, unita): logica della sfida in `src/game/` (endless e a vite, livelli, streak, moltiplicatore, codice sfida deterministico per turno, con test); componenti condivisi in `src/components/exercise/` (campo di risposta con tastierino sui dispositivi touch e valore intermedio facoltativo, procedimento con il primo errore evidenziato, messaggi di diagnosi); sfida in `src/components/challenge/` (HUD con streak arcobaleno, messaggi a comparsa, coriandoli con `canvas-confetti`, scossone con Motion, suoni Web Audio spenti di default, record in `localStorage`, link con il codice sfida); allenamento in `src/components/practice/`. Test e2e con axe su sfida e allenamento.

- Fase 3 (PR #4, unita): sette lezioni in `src/content/lezioni/it/`, tutte in `stato: bozza`, con widget in `src/components/lesson/` (contachilometri, tabella dei pesi, animatore delle divisioni, gruppi di bit, registro di memoria, permessi `chmod`, selettore di colore). Ogni lezione chiude con un link all’allenamento, che ora legge `?conversione=` e `?livello=`. Tabelle della prosa con stile proprio. Test e2e con axe su tutte le lezioni, in chiaro e in scuro.

- Dopo la fase 3: livello facile ridotto a decimale ↔ binario e ottale (PR #6); gruppi di bit separati da un margine di 0,2em (PR #5 non bastava: il separatore era già uno spazio sottile, corretto in fase 4).

- Fase 4 (branch `fase-4-rifinitura`): modalità LIM (pulsante nell’intestazione, `?lim=1` e `?lim=0`, testo al 137,5% e contrasto più alto, chiave `binary-lim`); schede stampabili in `/schede/` (logica in `src/game/worksheet.ts`, codice nel link, soluzioni su una pagina a parte, stampa sempre nero su bianco); pagina docenti con la tabella dei livelli generata dal motore; link della prosa sottolineati; animazioni ridotte rispettate anche nei widget delle lezioni. Test e2e su LIM, schede, tastiera e animazioni ridotte.

- Esercizi mai ripetuti (segnalazione di Marco del 5 novembre 2026, sfida con codice 1): ogni turno sceglieva a caso senza memoria e il facile ha poco più di cento esercizi, quindi le ripetizioni arrivavano già dopo pochi turni. Ora `generate` accetta `seen` (chiavi `exerciseKey`, coppia di basi senza verso più valore) e, finiti i numeri di un tipo, passa a un altro tipo del livello e poi allarga l’intervallo. La partita tiene le chiavi nello stato; schede e allenamento le escludono allo stesso modo. Lo storico tra una partita e l’altra sta in `localStorage` (`binary-visti`, ultimi 300 esercizi): un codice sfida mai giocato nel browser parte senza storico, così la prima partita resta uguale per tutta la classe; rigiocandolo arrivano esercizi nuovi.

## Prossimo passo

- Revisione delle lezioni da parte dell’autore (da `bozza` a `rivista`).
- Il piano è completo. Sviluppi già indicati da Marco: virgola mobile, precisione, complemento a 2.
- Da valutare: un controllo con un lettore di schermo vero (NVDA o VoiceOver), che i test automatici non sostituiscono.

## Da verificare

- Gli URL delle fonti in `src/content/fonti.yaml` (GNU Coreutils, W3C CSS Color 4, IEC 80000-13) non sono stati aperti: la rete del container li blocca.
- `lint:content` segnala ancora 12 avvisi `numero-in-cifre`, quasi tutti numeri usati come valori (“il resto 1”, “vale 4”): da rivedere a mano.

## Da decidere o calibrare

- Intervalli dei livelli in `KINDS` (`src/engine/generate.ts`): da provare in classe.
- Ordine delle ipotesi della somma pesata: in base 2 “potenza sbagliata verso l’alto” e “termine contato due volte” danno lo stesso valore; vince il secondo.

## Note operative

- Node: nel container c’è Node 22.23.4 in `/opt/node22/bin`, sufficiente per Astro 7; la CI usa Node 24 (`.nvmrc`).
- Playwright: tenere `@playwright/test@1.63.0` finché l’ambiente non cambia (browser in `/opt/pw-browsers`).
- `astro preview` va lanciato con `--ignore-lock`.
