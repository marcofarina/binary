# Motore

TypeScript puro, senza dipendenze e senza accesso a DOM, React o Astro (lo impone ESLint). Per ora tratta interi
senza segno entro `Number.MAX_SAFE_INTEGER`; virgola, segno e complemento a due arriveranno come nuovi moduli.

| Modulo | Che cosa fa |
|---|---|
| `digits.ts` | Cifre fino a F, basi da 2 a 16, nomi delle basi, bit per cifra delle potenze di due |
| `numeral.ts` | Lettura tollerante di ciò che scrive lo studente (spazi, minuscole, prefissi `0b`/`0o`/`0x`, pedici), scrittura, errori di cifra non valida |
| `steps.ts` | Procedimenti come dati: somma pesata, divisioni successive, gruppi di bit, conversioni in due fasi; `methodFor` e `solve` |
| `generate.ts` | Esercizi per livello (`easy`, `medium`, `hard`), basi esotiche solo nel difficile (circa 1 su 10), niente numerali banali; `seen` ed `exerciseKey` impediscono di riproporre un esercizio già visto |
| `diagnose.ts` | `check` della risposta e diagnosi del primo errore |
| `random.ts` | PRNG con seme (mulberry32), lo stesso di Enigma |

## Diagnosi del primo errore

| Metodo | Diagnosi | Affidabilità |
|---|---|---|
| Divisioni successive | resti letti al contrario, resto ≥ 10 scritto in decimale, primo resto sbagliato (riga), divisioni mancanti, cifre in più | riga esatta |
| Gruppi di bit | raggruppamento da sinistra, gruppo sbagliato, gruppi mancanti, cifra espansa senza zeri | gruppo esatto |
| Somma pesata | esponenti da 1, pesi da sinistra, termine dimenticato o doppio, potenza sbagliata, lettera esadecimale con il valore sbagliato; altrimenti errore di calcolo | ipotesi |
| Due fasi (dal decimale) | con il valore intermedio la fase è certa; senza, si provano gli errori tipici della prima fase e quelli riconoscibili della seconda, altrimenti la fase resta incerta | ipotesi |
| Due fasi (dal binario) | raggruppamento da sinistra, cifra non completata, errori dentro una sola cifra di partenza (prima fase) o altrove (seconda) | ipotesi |

Gli indici di `Diagnosis.index` puntano alla riga di divisione (dalla prima), al termine della somma (da sinistra)
o al gruppo di bit (da sinistra) nel procedimento della fase indicata.
