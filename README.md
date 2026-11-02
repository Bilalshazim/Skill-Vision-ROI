# SKILL-VISION · Human Capital ROI Engine (APEX 5D™)

A business-case calculator for human-capital programmes. It takes a client's Italian statutory income statement (art. 2425 c.c.) and the results of an APEX 5D competence assessment, then estimates the **first-year ROI** of the programme, which is the assessment plus the development actions that follow it.

The interface is in Italian. Everything runs in the browser with no backend: client data never leaves the machine.

## What it calculates

| Level | Content | Certainty |
|---|---|---|
| 1 · Verifiable data | P&L, headcount, assessment results, HR turnover/absence | documented fact |
| 2 · Estimated potential | gross value of the competence gap, turnover cost, absence cost, vacancy cost | accounting formulas |
| 3 · Expected benefit | the share of each potential the programme realises in 12 months | declared, editable assumptions |
| 4 · Realised benefit | measured at 12 months against the verification-plan baseline | to be measured |

Four levers:

1. **Productivity:** HCVA (EBIT + personnel cost) × GAP × assessed share × elasticity × feasibility. This is an estimate.
2. **Avoided turnover:** exits × (average salary × replacement cost %) × relative reduction. This is a cost and can be verified.
3. **Absenteeism:** personnel cost × absence % × employer-borne share × relative reduction. This is a cost and can be verified.
4. **Vacancies:** optional, and off by default.

Three scenarios are available (prudential, base, expansive). The page also includes sensitivity to the gap, break-even, automatic data checks, a methodology section, sources and a glossary.

## Project layout

```
src/
  index.html             page markup
  styles/main.css        all styles (light/dark theme tokens)
  assets/                logos
  js/
    main.js              entry point
    core/                pure logic: no DOM, unit-tested
      defaults.js        sample/empty datasets, state migration
      anagrafica.js      partita IVA check digit, ATECO code format
      model.js           the calculation engine
      validate.js        automatic data checks
      scenarios.js       scenario presets
      importer.js        Excel/CSV key-value parsing
      format.js          Italian number/currency formatting
      zip.js             dependency-free .zip writer
      motion.js          animation presets (tab spring → CSS linear(), page variants)
    content/             glossary and bibliography texts
    ui/                  rendering, charts (hand-drawn SVG), controls, import, save
scripts/
  build.mjs              bundles src/ → dist/index.html (one self-contained file)
  serve.mjs              tiny static server
tests/
  unit/                  core logic (node:test)
  integration/           built page driven in jsdom, plus parity with the legacy file
  fixtures/              sample CSV exports
legacy/                  the original single-file dashboard (reference for parity tests)
docs/test-report.md      test results and defects found
```

## Usage

```bash
npm install
npm run build      # → dist/index.html: double-click it, or email it zipped
npm test           # build + all tests
npm run dev        # serve src/ at http://127.0.0.1:5173 for development
npm run serve      # serve dist/
```

`dist/index.html` is a single file with the CSS, JS and logos inlined, so it works from disk like the original. Two features still need an internet connection: the SheetJS Excel reader and the Google fonts. CSV import works offline.

**Salva copia** writes the current data into the `<script id="sv-data">` block of a copy of the page. That copy then opens on the client's data, and "Dati campione" in that copy restores the saved client. Use it from the built `dist/` file. A copy saved while running `npm run dev` would reference the separate source files.

## Print / PDF

"Stampa / PDF" (or Ctrl+P) produces a finished business-case document on A4:
- It always uses the light theme, even when the dark theme is on.
- It contains no form controls. Every field appears as a formatted static value.
- It leaves out the glossary and the upload/save tools.
- Page 1 holds the main KPIs, the logic chain, the waterfall and comparison charts, and the robustness checks, sized to fill the sheet.
- Each tab starts on a new page.

See `CLAUDE.md` (project rules) and `PROGRESS.md` (status).

## Import format

Two columns, key and value, in `.xlsx`, `.xls` or `.csv`. The CSV separator can be `;`, `,` or a tab. Keys are matched without regard to accents, case or punctuation. The full list appears on the "Dati" tab, and "Copia template" puts a ready-made template on the clipboard. Numbers can be in Italian format (`25.619.746`, `4,3`, `1.234,56`) or in unambiguous English format.
