# Test report — v4 restructure

Date: 2026-11-02 · Node 24 · `npm test` → **54 tests, 54 passed**

## Coverage

| Suite | Tests | What it covers |
|---|---|---|
| unit/model | 10 | P&L reconstruction, all four levers, ROI, payback, break-even, EBITDA conventions, base selector, partial population, scenarios, v3→v4 migration |
| unit/validate | 8 | blocking checks, unit-of-measure, ranges, HCVA ≤ 0, EBITDA reconciliation, check ordering |
| unit/importer | 10 | key normalisation, number parsing (IT/EN), CSV parsing, template round-trip, code columns, fiscal year from header |
| unit/format, unit/zip | 7 | Italian formatting and article elision, escaping, file names, CRC-32, zip structure |
| integration/parity | 9 | the built page and the **original legacy file** run side by side in 9 situations; every KPI, table, chart label and derived field must match |
| integration/dashboard | 10 | tabs, live recalculation, reset/clear, CSV drop import, print, save copy, save/load JSON |

A real-browser check (Chromium via Playwright) loaded the built page and rendered it correctly. The only console message was a missing favicon.

## Calculation engine: no defects found

On the GAROFOLI sample, EBIT (5,362,339) and EBITDA (7,016,793) recalculate exactly to the declared values. Independent hand calculations of every lever agree with the model: ROI 621%, cost-only ROI 12.5%, payback 1.7 months, break-even 5.7% of the gap potential. The parity tests show that the restructured build produces the same results as the original in every case tested.

## Defects found in the original, fixed in this version

Each fix has a test. The same tests fail when run against the legacy file.

| # | Area | Defect | Effect |
|---|---|---|---|
| 1 | Import | Italian thousands separators were misread: `25.619.746` → 25.619, `€ 31.000` → 31, `0,125` → 125, `4,3 p.p.` → 43 | Excel's "Save as CSV" writes numbers as they are displayed, so a formatted P&L imported wrong figures by a factor of 1,000 |
| 2 | Import | If the first cell after a key was not a number (e.g. a code column such as `B9`), the row was skipped | values were missed in typical accounting exports |
| 3 | Inputs | Emptying a numeric field left the old value in the model | e.g. deleting "Costo azioni" kept counting it in the investment, with no visible sign |
| 4 | Print | "Stampa / PDF" made all 7 panels visible and never hid them again | after printing, every tab was stacked on screen |
| 5 | Save copy | The copy was a snapshot of the live page: an open info popover was saved stuck open, and a second `#pop` element was added each time a copy was saved again | a popover that could not be closed in the saved file |
| 6 | Save copy (security) | Data was written into a JS literal without escaping. A company name containing `</script>` broke the saved file and ran injected script | script injection through imported data |
| 7 | Import (security) | Imported values were inserted into the "changes" table as raw HTML | HTML/script injection from a crafted file |
| 8 | JSON load | Selecting the same `.json` file twice did nothing | minor |

## Behaviour change to note

- In a saved copy, "Dati campione" restores the saved client's data, as it did before. The status message now says "Dati salvati ripristinati" instead of naming GAROFOLI.

## Not covered

- Real `.xlsx` parsing: SheetJS loads from a CDN. The logic after parsing is the same as for CSV and is tested.
- Visual and layout regressions beyond one manual screenshot.
- Downloads inside the claude.ai artifact frame (`window.claude.use("downloads")`).
