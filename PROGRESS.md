# PROGRESS — Motore ROI del Capitale Umano

Stato degli obiettivi di `CLAUDE.md`. Aggiornare a ogni sessione.

## 2026-11-02

### Obiettivi (§1)

| # | Obiettivo | Stato | Dove |
|---|---|---|---|
| 1 | PDF finalizzato senza controlli form | ✅ | `@media print` in `src/styles/main.css`; valori statici `.pv` generati da `syncPrintValues()` in `src/js/ui/render.js` |
| 2 | Lingua italiana | ✅ | interfaccia, messaggi, PDF e `aria-label` in italiano; `<html lang="it">` |
| 3 | A4 proporzionato | ✅ | `@page{size:A4}`; pagina 1 in `.p1` (flex, altezza utile 250mm). Misurato in Chromium sul campione: contenuto 251mm, foglio pieno |
| 4 | Header iconset | ✅ | 6 pulsanti circolari 36px con icone Lucide inline, `aria-label` e `title` |
| 5 | Sidebar / navigazione | ✅ n/a | il modulo non ha barra laterale: la navigazione è la barra a schede (§4), invariata |
| 6 | Motore ROI standalone | ✅ | già presente (anagrafica, c.e., 4 leve, scenari, piano di verifica) |
| 7 | P.IVA e ATECO | ✅ | campi Partita IVA, Settore, Codice ATECO; controllo cifra di controllo P.IVA e formato ATECO (avvisi, mai bloccanti); importabili da Excel/CSV |
| 8 | Barra stato business case | ✅ | `#statusBar` sotto il marchio: cliente, P.IVA, ATECO, esercizio, scenario, ROI, beneficio, rientro, pareggio. In stampa solo i metadati |
| 9 | Archivio | ✅ | già presente: copia .html, .zip, .json, tutto lato client |
| 10 | Fonti e controlli | ✅ | già presente; aggiunti i controlli anagrafici |

### Checklist di conformità (§6)

- [x] PDF: zero slider, zero input, zero bordi di campo (verificato in Chromium: 0 controlli visibili in stampa)
- [x] Lingua: tutto in italiano
- [x] Layout A4: pagina 1 piena (KPI principali, catena logica, grafici, solidità); seconda riga KPI e frase CFO aprono la pagina 2
- [x] Header actions e schede
- [x] Form e controlli

### Regole di stampa adottate

- Tema chiaro forzato anche con tema scuro attivo (`:root:root:root` in `@media print`), colori di sfondo stampati (`print-color-adjust: exact`).
- Esclusi dal PDF: schede di navigazione, pulsanti, popover, glossario, strumenti di caricamento e salvataggio, introduzione operativa della scheda Dati.
- Ogni scheda inizia su una nuova pagina; KPI, schede, grafici e righe di tabella non si spezzano.
- Le sezioni a scomparsa (Metodologia) vengono aperte per la stampa e richiuse dopo.
- Vale sia per il pulsante «Stampa / PDF» sia per Ctrl+P (`beforeprint` / `afterprint`).

### Limiti noti

- Con molti avvisi nei controlli la sezione «Solidità» può proseguire a pagina 2 (consentito di proposito, per non lasciare un vuoto a pagina 1).
- L'altezza della pagina 1 è tarata sull'intestazione a una riga di metadati; ragioni sociali molto lunghe la portano a due righe e il contenuto scorre di qualche millimetro.

### Animazioni (instructions.md)

Il progetto è JavaScript senza framework: i preset sono tradotti in CSS e Web Animations API, con gli stessi valori.

| Preset / regola | Implementazione | Verifica in Chromium |
|---|---|---|
| `SNAPPY_TAB_SPRING` (600 / 35 / 0,5) | `src/js/core/motion.js` simula la molla e la converte in curva CSS `linear()` (316ms, nessun rimbalzo: smorzamento ≈ critico). Indicatore `.tab-ink` largo 1px, mosso con `translateX` + `scaleX` | arriva esattamente sotto la scheda (x 283, larghezza 53) |
| `FAST_PAGE_VARIANTS` | `src/js/ui/motion.js`: uscita 120ms `cubic-bezier(.4,0,1,1)`, poi entrata 160ms `cubic-bezier(.2,0,0,1)`, opacity / scale 0,985 / y ±4px (come AnimatePresence `mode="wait"`) | a 40ms opacità 0,76; entrata da 120ms; stabile a 400ms |
| Solo GPU | animati solo `transform` e `opacity`; le altre transizioni esistenti sono di colore, nessuna su dimensioni o posizione | — |
| Niente salti di layout | il contenitore mantiene l'altezza durante il cambio; spazio del grassetto riservato nelle schede | larghezze delle schede identiche prima e dopo |
| Riduci movimento | regola CSS del §2; in JS nessuna animazione di pannello | cambio istantaneo |
| Clic rapidi | la transizione in corso viene interrotta; la stampa la interrompe | stato finale pulito, nessuna animazione residua |

Senza Web Animations API (es. jsdom nei test) il cambio di scheda è istantaneo.

### Test

`npm test`: 69 test, tutti verdi (unit, parità con il file originale, dashboard, preset di animazione).
