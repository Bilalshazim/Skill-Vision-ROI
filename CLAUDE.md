# Skill Vision — Motore ROI del Capitale Umano & AppShell Standard

Questo file è la memoria di progetto per il modulo **Motore ROI del Capitale Umano (ROI Engine)** e per le componenti globali dell'**AppShell** (Header Iconset, Sidebar, Temi e Componenti).
Vale per ogni sessione: tutto ciò che riguarda la generazione, l'impaginazione, i calcoli finanziari/HR e la stampa PDF del motore ROI viene tracciato qui e in `PROGRESS.md`.

---

## 1. Che cosa stiamo facendo

Il modulo **Motore ROI del Capitale Umano** consente ai consulenti di Skill Vision di valutare il ritorno economico degli investimenti formativi e organizzativi basandosi su bilanci d'esercizio (schema civilistico), organico, dati HR (turnover, assenze) e risultati dell'assessment APEX 5D.

### Obiettivi della Modifica (Ottobre 2026)
1. **Documento PDF Finalizzato (No Form Admin UI):** Il PDF generato **NON deve mostrare controlli form** (input textboxes, radio buttons, frecce di select, bottoni) né schede non necessarie. Deve essere un documento di business case pulito e definitivo.
2. **Lingua Predefinita Italiano (IT):** L'intera interfaccia web, i controlli, i messaggi e il documento PDF devono essere tassativamente in lingua **italiana**.
3. **Impaginazione A4 Proporzionata:** Il documento PDF deve riempire in modo armonioso le dimensioni di una pagina A4 (210mm x 297mm), estendendo i blocchi della Pagina 1 senza lasciare ampi spazi vuoti verticali.
4. **Header Iconset Standard:** Implementazione dei pulsanti azione circolari nell'header (Tema, Azzera, Dati campione, Glossario, Stampa/PDF, Aggiorna) con icone Lucide e perimetro definito.
5. **Sidebar Navigation Standard:** Bonifica della barra laterale e transizione alle primitive di navigazione e tab design Skill Vision.
6. **Piattaforma Standalone ROI Engine:** Conversione della dashboard in Motore ROI dedicato, con gestione anagrafica, conto economico, 4 leve di calcolo (Produttività, Turnover, Assenze, Posizioni Vacanti), scenari e piano di verifica a 12 mesi.
7. **Campi Partita IVA & Codice ATECO:** Inserimento campo P.IVA (11 cifre) nei Dati Azienda e Codice ATECO nel Settore.
8. **Barra Stato Preventivo / Business Case:** Gestione metadati cliente, esercizio, KPI in evidenza (ROI, Beneficio Anno 1, Tempo di rientro, Soglia di pareggio).
9. **Archivio & Ricerca Persistente:** Salvataggio copia HTML, ZIP per email, e dati JSON con supporto offline/client-side completo.
10. **Tracciabilità delle Fonti & Controlli Automatici:** Validazione in tempo reale di quadratura EBIT/EBITDA, HCVA, ROCE e indici di bilancio.

---

## 2. Regole PDF: Business Case Finalizzato (No Form UI)

### Differenza tra Configurato Web e Documento PDF
* **In Web (Interactive Configurator):** Controlli attivi (`Input`, `Select`, slider per le leve, selettori di scenario).
* **In PDF (Stampa/Esportazione):**
  1. **Nessun controllo grafico da form:** Scomparsa di input border, slider attivi e selettori. I campi diventano valori testuali statici formattati in tabelle pulite.
  2. **Layout di Stampa Ottimizzato:** `@media print` forza il light theme e rimuove i pulsanti non stampabili (`nav.tabs`, `.hdr-actions`).

---

## 3. Regole di Impaginazione A4 & PDF Export

1. **Dimensione A4 e Riempimento Proporzionato:**
   * La pagina PDF è dimensionata su formato standard A4 (210mm x 297mm).
   * La **Pagina 1** deve distribuire verticalmente i suoi blocchi (KPI principali, Catena logica, Waterfall chart, Controllo solidità) occupando in modo proporzionato l'intera altezza del foglio.
2. **Strict Layout & Interruzione:**
   * Usare la regola CSS `@media print` per evitare tagli errati sulle sezioni e garantire tabelle leggibili.
3. **Stampa in Light Theme:**
   * L'esportazione PDF/Stampa deve essere forzata sempre in **Light Theme** (fondo crema/bianco, testo scuro ad alta contrastabilità).

---

## 4. Header Iconset & Navigazione Tab Standard

* **Azioni Header:** Tema, Azzera tutto, Dati campione, Glossario, Stampa / PDF, Aggiorna il dato.
* **Tabs di Navigazione:** Sintesi, Dati, Motore di calcolo, Scenari, Metodologia, Valore non monetizzato, Glossario.

---

## 5. Gestione Brand, Loghi e Assets

* **Brand Identity:** SKILL-VISION — Nero caldo (`#0D0C0A`), Lime del marchio (`#B3C614` / `#C9DC1E`), Crema (`#F5F3EC`).
* **Icone:** Esclusivamente **Lucide Icons** o primitive SVG inline scalabili.

---

## 6. Checklist di Conformità

Lo stato aggiornato di ogni voce è in `PROGRESS.md`.

- [ ] **PDF Business Case Finalizzato:** Zero slider attivi, zero input border in stampa.
- [ ] **Lingua:** Interfaccia e PDF completamente in italiano.
- [ ] **Layout A4:** La stampa PDF riempie proporzionatamente l'intero foglio A4.
- [ ] **Header Actions & Tabs:** Bottoni azione puliti e navigazione tab fluida.
- [ ] **Form & Controlli:** Dati anagrafici, bilancio civilistico, 4 leve di calcolo, controlli automatici e piano di verifica.

---

## 7. Note tecniche (progetto)

* Sorgenti in `src/` (vedi `README.md`); `npm run build` produce `dist/index.html`, file unico autonomo.
* `npm test` deve restare verde. I test di parità (`tests/integration/parity.test.js`) confrontano i risultati con il file originale in `legacy/`: ogni modifica ai calcoli deve essere intenzionale e motivata.
* La logica di calcolo sta in `src/js/core/` (funzioni pure, senza DOM).
