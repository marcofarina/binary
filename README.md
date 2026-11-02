# Binary — Rainbow Bits

Eserciziario interattivo sui sistemi di numerazione: conversioni tra basi con una sfida a livelli, streak e punteggi, più una breve teoria. Pensato per gli studenti di prima superiore, utile a tutti per il ripasso. Fa parte del progetto **Rainbow Bits** e sarà pubblicato su [binary.rainbowbits.cloud](https://binary.rainbowbits.cloud/).

Codice con licenza MIT ([`LICENSE`](LICENSE)); testi e materiali didattici con licenza CC BY-NC-SA 4.0 ([`LICENSE-CONTENT`](LICENSE-CONTENT)).

> Il piano di lavoro è in [`docs/piano.md`](docs/piano.md), lo stato in [`docs/stato.md`](docs/stato.md).

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Struttura del progetto, CI, pubblicazione su GitHub Pages | fatto |
| 1 | Motore: conversioni, procedimenti, generatore, diagnosi del primo errore | fatto |
| 2 | Sfida (endless e a vite), streak, animazioni, allenamento | da fare |
| 3 | Teoria: sette lezioni con widget | da fare |
| 4 | Accessibilità, pagina docenti, modalità LIM, schede stampabili | da fare |

## Sviluppo

Servono Node ≥ 22.23.4 (vedi `.nvmrc`) e pnpm 10.

```bash
pnpm install
pnpm dev
```

Prima di ogni push:

```bash
pnpm verify
pnpm test:e2e
```

## Pubblicazione

Il sito si pubblica con GitHub Actions a ogni push su `main` (`.github/workflows/deploy.yml`). Il sottodominio si attiva una volta sola:

1. Su Cloudflare, nel DNS di `rainbowbits.cloud`, un record `CNAME` con nome `binary` e destinazione `marcofarina.github.io`, in modalità “DNS only” (nuvola grigia) finché GitHub non emette il certificato.
2. Su GitHub, Settings → Pages: *Source* “GitHub Actions”; *Custom domain* `binary.rainbowbits.cloud`; dopo l’emissione del certificato, *Enforce HTTPS*.

Con il deploy da Actions un file `CNAME` nel build viene ignorato: il dominio vale solo se impostato nelle impostazioni di Pages.
