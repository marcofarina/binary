# Binary — Rainbow Bits: piano

Versione completa e commentabile: <https://claude.ai/artifact/X6SrSndVM26tUNfHFVDrNi>. Questo file ne riassume le decisioni.

## Obiettivo

Eserciziario interattivo sulle conversioni tra basi di numerazione per la prima superiore (utile anche per il ripasso), con una breve teoria. Pubblicato su `binary.rainbowbits.cloud`. In futuro la teoria confluirà in un volume di informatica del biennio e il sito resterà l’eserciziario.

## Decisioni (Marco, 2 novembre 2026 — non ridiscuterle)

| Tema | Scelta |
|---|---|
| Stack | Astro + React + TypeScript, Tailwind, MDX, come Enigma; Motion e `canvas-confetti` per le animazioni; suoni con Web Audio, spenti di default |
| Hosting | GitHub Pages via Actions, sottodominio `binary.rainbowbits.cloud` |
| Perimetro | Solo interi senza segno; in futuro virgola mobile, precisione, complemento a due (il motore deve poterli accogliere) |
| Modalità | **Endless** (predefinita): 3 facili, 3 intermedi, poi difficili; un errore fa scendere di un livello e per risalire servono di nuovo 3 risposte giuste. **A vite**: difficoltà miste, 3 vite |
| Basi esotiche | Da 3 a 15 (escluse 8 e 10), solo nel difficile, circa 1 esercizio su 10 |
| Valore intermedio | Campo facoltativo per il decimale nelle conversioni base a → base b |
| Codice sfida | Seme nell’indirizzo, facoltativo; niente classifica online |
| Identità visiva | Look proprio, stessi nomi di token di Enigma |
| Modalità LIM | Sì, in fase 4 |
| Progressi | Solo `localStorage`, nessun account, nessun dato personale |
| Testi | Bozze di Claude secondo le regole tipografiche dell’autore; revisione dell’autore |
| Licenze | Codice MIT; contenuti CC BY-NC-SA 4.0 |

## Livelli (proposta da calibrare)

| Livello | Conversioni | Numeri | Punti base |
|---|---|---|---|
| Facile | binario ↔ decimale, binario → esadecimale | fino a 6 bit (0–63) | 10 |
| Intermedio | ottale ed esadecimale ↔ decimale, binario ↔ ottale ed esadecimale | fino a 8–12 bit (0–4095) | 20 |
| Difficile | tutte, ottale ↔ esadecimale, basi esotiche (1 su 10) | fino a 16 bit (0–65 535) | 40 |

Streak = risposte giuste consecutive; moltiplicatore ×2 dalla quinta, ×3 dalla decima, ×5 dalla ventesima. Il punteggio non cala mai. Nessun timer di default.

## Primo errore

- Decimale → base b: confronto cifra per cifra dalla meno significativa (ogni cifra è un resto); riconosce resti letti al contrario, divisioni saltate, resti ≥ 10 scritti in decimale. Esatto.
- Binario ↔ ottale ed esadecimale: confronto per gruppi da destra; riconosce il raggruppamento da sinistra. Esatto.
- Base b → decimale: la differenza dal risultato giusto si confronta con gli errori tipici (esponenti da 1, pesi letti da sinistra, termine dimenticato o doppio, potenza sbagliata, cifra esadecimale letta male). Per ipotesi; se nessuna regge, “errore di calcolo nella somma”.
- Base a → base b: coerenza con un decimale intermedio sbagliato o giusto; più precisa con il campo facoltativo.

## Teoria (sette lezioni, ciascuna con un widget)

1. Che cos’è una base (contachilometri in base qualsiasi)
2. Da qualsiasi base a decimale (tabella cifra × peso; Horner come approfondimento)
3. Da decimale a qualsiasi base (animatore delle divisioni)
4. Binario, ottale ed esadecimale per gruppi (bit raggruppati da destra)
5. Il binario nella memoria elettronica (registro di otto interruttori)
6. L’ottale nei permessi Linux (griglia `rwx` → `chmod`)
7. L’esadecimale nei codici colore (cursori RGB → `#RRGGBB`)

## Fasi

0. Setup: scaffold, token, lint, test, CI, deploy, sottodominio.
1. Motore: conversioni, procedimenti strutturati, generatore per livelli, diagnosi, test di proprietà.
2. Sfida: modalità endless e a vite, punteggio, streak, animazioni, soluzione con errore evidenziato, allenamento, codice sfida, record personali.
3. Teoria: le sette lezioni in bozza con i widget.
4. Rifinitura: accessibilità verificata, e2e, pagina docenti, modalità LIM, schede stampabili.
