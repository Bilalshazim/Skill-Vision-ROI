# Skill-Vision-ROI · Human Capital ROI Engine (APEX 5D™)

A business-case calculator for human-capital programmes. It takes a client's Italian statutory income statement (art. 2425 c.c.) and the results of an APEX 5D competence assessment, then estimates the **first-year ROI** of the programme, which is the assessment plus the development actions that follow it.

The interface is in Italian. Everything runs in the browser with no backend: client data never leaves the machine.

**Live:** https://bilalshazim.github.io/Skill-Vision-ROI/

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
index.html               the page (GitHub Pages entry): loads ./src/styles, ./src/assets, ./src/js
.nojekyll                serve files as-is on GitHub Pages (no Jekyll build)
src/
  styles/main.css        all styles (light/dark theme tokens, print/PDF rules)
  assets/                logos
  js/
    main.js              entry point (ES module)
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
    ui/                  rendering, charts (hand-drawn SVG), controls, motion, import, save
scripts/
  build.mjs              bundles index.html + src/ → dist/index.html (one self-contained file)
  serve.mjs              tiny static server (optional base path, like GitHub Pages)
tests/
  unit/                  core logic (node:test)
  integration/           page driven in jsdom, parity with the legacy file, GitHub Pages path checks
  fixtures/              sample CSV exports
legacy/                  the original single-file dashboard (reference for parity tests)
docs/test-report.md      test results and defects found
CLAUDE.md                project rules · PROGRESS.md status · instructions.md animation standard
```

## Usage

```bash
npm install
npm run dev            # serve the site at http://127.0.0.1:5173/
npm run preview:pages  # same, under /Skill-Vision-ROI/ exactly like GitHub Pages
npm test               # build + all tests
npm run build          # → dist/index.html: single file, double-click it or email it zipped
npm run serve          # serve dist/
```

The root `index.html` loads ES modules, so it needs to be served over HTTP (GitHub Pages or `npm run dev`). If you open it by double-clicking, the browser blocks the modules and the page stays empty. For a file that works from disk, use `dist/index.html`.

## Deploying to GitHub Pages

Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`. No build step is needed: Pages serves `index.html` and `src/` as they are in the repository. Every path is relative (`./src/…`), so the site also works under the `/Skill-Vision-ROI/` project path. `tests/integration/pages.test.js` checks the following:
- every file the page loads exists, with exactly matching letter case (Pages is case-sensitive, Windows is not)
- every such file is committed to git
- no path is root-absolute

**Salva copia** writes the current data into the `<script id="sv-data">` block of a copy of the page.
- **From the hosted site:** the copy links to the site's absolute URLs, so it opens anywhere with an internet connection.
- **From `dist/`:** the copy is fully self-contained and also works offline.

In both cases the copy opens on the client's data, and "Dati campione" in it restores that client.

Two features always need an internet connection: the SheetJS Excel reader and the Google fonts. CSV import works offline.

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
