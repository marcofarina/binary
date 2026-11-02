# Convenzioni del progetto

Eserciziario Astro + React + TypeScript (Tailwind, MDX) sulle conversioni tra basi, pubblicato con GitHub Pages su `https://binary.rainbowbits.cloud/`. Il piano completo è in `docs/piano.md`, lo stato del lavoro in `docs/stato.md`. Le convenzioni ricalcano quelle di `marcofarina/enigma`.

## Comandi

- `pnpm dev` — server di sviluppo
- `pnpm verify` — lint, formattazione, regole tipografiche, tipi, unit test e build (da far passare prima di ogni push)
- `pnpm test:e2e` — test Playwright con axe (richiede `pnpm build`)

Node ≥ 22.23.4 (vedi `.nvmrc`), pnpm 10.

## Regole

- `src/engine/` e `src/game/` sono TypeScript puro: nessuna dipendenza, nessun accesso a DOM, React o Astro (lo impone ESLint). `localStorage` si usa solo nei componenti, sempre dentro `try/catch`.
- Il motore restituisce i procedimenti come dati strutturati, mai come testo: teoria, soluzioni e schede li disegnano a modo loro.
- I link interni passano da `url()` in `src/lib/url.ts`, per rispettare `base`.
- I colori e i font si usano solo tramite i design token di `src/styles/tokens.css` (stessi nomi di Enigma, valori propri). I colori dell’arcobaleno sono decorativi, mai per il testo; giusto e sbagliato non si comunicano mai solo con il colore.
- Ogni animazione rispetta `prefers-reduced-motion`; i suoni sono spenti di default.
- I testi in `src/content/` seguono le regole tipografiche italiane controllate da `pnpm lint:content`: virgolette “curve”, apostrofo ’, trattino lungo — per gli incisi, titoli con maiuscola solo iniziale, acronimi senza punti, numeri fino a dieci in lettere.
- Le lezioni nuove nascono con `stato: bozza`; solo l’autore le porta a `rivista`. Le lezioni devono restare portabili: in futuro la teoria confluirà nel libro e qui resterà l’eserciziario.
- Ogni fatto storico o tecnico citato nei testi rimanda a una voce di `src/content/fonti.yaml`.
