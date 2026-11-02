import { test } from "node:test";
import assert from "node:assert/strict";
import { eur, eurK, pct, num, esc, art, slug, baseName } from "../../src/js/core/format.js";

// Intl uses narrow no-break spaces in some locales; normalise for comparison
const n = (s) => s.replace(/[  ]/g, " ");

test("euro formatting (it-IT)", () => {
  assert.equal(n(eur(31000)), "31.000 €");
  assert.match(n(eur(1234.6)), /^1\.?235 €$/); // CLDR it-IT may skip grouping for 4 digits
  assert.equal(n(eur(-5362339)), "-5.362.339 €");
  assert.equal(eur(NaN), "—");
  assert.equal(n(eurK(5362339)), "5,36 M€");
  assert.equal(n(eurK(223644)), "224k€");
  assert.match(n(eurK(9999)), /^9\.?999 €$/);
  assert.equal(eurK(Infinity), "—");
});

test("percent and number formatting", () => {
  assert.equal(pct(4.3), "4,3%");
  assert.equal(pct(621.43, 0), "621%");
  assert.equal(pct(NaN), "—");
  assert.equal(num(1234567), "1.234.567");
  assert.equal(num(1.666, 1), "1,7");
});

test("Italian article elision before percentages", () => {
  assert.equal(art("il", 8, 0), "l'8%");
  assert.equal(art("il", 80, 0), "l'80%");
  assert.equal(art("il", 11, 0), "l'11%");
  assert.equal(art("il", 1.5, 1), "l'1,5%");
  assert.equal(art("del", 84, 0), "dell'84%");
  assert.equal(art("al", 80, 0), "all'80%");
  assert.equal(art("il", 18, 0), "il 18%");
  assert.equal(art("il", 100, 0), "il 100%");
  assert.equal(art("Il", 13, 0), "Il 13%");
});

test("HTML escaping covers tags and attribute quotes", () => {
  assert.equal(esc('<img src=x onerror="a">&'), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;");
});

test("file names from company names", () => {
  assert.equal(slug("GAROFOLI S.p.A."), "GAROFOLI_S_p_A");
  assert.equal(slug("Società Àlfa & C."), "Societa_Alfa_C");
  assert.equal(slug(""), "azienda");
  assert.equal(baseName({ company: "GAROFOLI S.p.A.", anno: 2025 }), "ROI_GAROFOLI_S_p_A_2025");
});
