import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { norm, toNum, parseCsv, applyRows, templateCsv, MAP } from "../../src/js/core/importer.js";
import { SAMPLE, EMPTY, clone } from "../../src/js/core/defaults.js";

const fixture = (f) => readFileSync(new URL("../fixtures/" + f, import.meta.url), "utf8");

test("key normalisation strips accents, case and punctuation", () => {
  assert.equal(norm("  Utile (perdita) dell'esercizio "), "utile perdita dell esercizio");
  assert.equal(norm("R.O.I. - Return on Investment"), "r o i return on investment");
  assert.equal(norm("Società"), "societa");
  assert.equal(MAP[norm("Margine Operativo Lordo (EBITDA)")], "ebitda");
});

test("toNum: plain numbers and Italian decimals", () => {
  assert.equal(toNum(25619746), 25619746);
  assert.equal(toNum("25619746"), 25619746);
  assert.equal(toNum("4,3"), 4.3);
  assert.equal(toNum("30,29 %"), 30.29);
  assert.equal(toNum("2.4"), 2.4);
  assert.equal(toNum("-1.234,56"), -1234.56);
  assert.ok(Number.isNaN(toNum("")));
  assert.ok(Number.isNaN(toNum(null)));
  assert.ok(Number.isNaN(toNum("B9")));
});

test("toNum: Italian thousands separators (Excel 'Save as CSV' keeps the displayed format)", () => {
  assert.equal(toNum("25.619.746"), 25619746);
  assert.equal(toNum("€ 31.000"), 31000);
  assert.equal(toNum("1.554.454,00"), 1554454);
  assert.equal(toNum("0,125"), 0.125);
  assert.equal(toNum("4,3 p.p."), 4.3);
});

test("toNum: unambiguous English formats still work", () => {
  assert.equal(toNum("24,103,607"), 24103607);
  assert.equal(toNum("1,234.56"), 1234.56);
});

test("CSV parsing: separator detection, BOM, quotes", () => {
  assert.deepEqual(parseCsv("﻿chiave;valore\nGAP;4,3")[1], ["GAP", "4,3"]);
  assert.deepEqual(parseCsv('chiave,valore\nGAP,"4,3"')[1], ["GAP", "4,3"]);
  assert.deepEqual(parseCsv('a\tb\nRicavi\t100')[1], ["Ricavi", "100"]);
  assert.deepEqual(parseCsv('Azienda;"Rossi ""&"" Figli; S.r.l."')[0], ["Azienda", 'Rossi "&" Figli; S.r.l.']);
});

test("the built-in template round-trips to exactly the sample data", () => {
  const s = clone(EMPTY);
  const { hits } = applyRows(parseCsv(templateCsv()), s);
  assert.equal(hits, 28); // 29 rows, «Posizioni in organigramma» is blank
  for (const k of ["company", "anno", "N", "nVal", "inv", "comp", "gap", "cov", "turn", "ass", "ric", "vdp", "costiProd", "cp", "sal", "ebitda", "ebit", "amm", "acc", "un", "ante", "imposte", "serv", "roce", "roiAz", "ros", "crescita"]) {
    assert.equal(s[k], SAMPLE[k], k);
  }
});

test("Italian-formatted export with thousands separators imports correctly", () => {
  const s = clone(EMPTY);
  applyRows(parseCsv(fixture("italian-format.csv")), s);
  assert.equal(s.vdp, 25619746);
  assert.equal(s.costiProd, 20257407);
  assert.equal(s.inv, 31000);
  assert.equal(s.gap, 4.3);
  assert.equal(s.acc, 100000 + 25000); // multiple provision lines are summed
});

test("rows with a code column between key and value (e.g. 'B9') are read", () => {
  const s = clone(EMPTY);
  const { seen } = applyRows(parseCsv(fixture("with-code-column.csv")), s);
  assert.equal(s.cp, 7179874);
  assert.equal(s.sal, 5111582);
  assert.ok(seen.cp && seen.sal);
});

test("fiscal year is taken from a date column header when no 'Esercizio' key exists", () => {
  const s = clone(EMPTY);
  applyRows([["Voce", "31/12/2024"], ["Ricavi", 1000]], s);
  assert.equal(s.anno, 2024);
});

test("first occurrence of a key wins; unknown rows are ignored", () => {
  const s = clone(EMPTY);
  const { hits } = applyRows([["Turnover", "2,4"], ["Turnover", "9"], ["Totale attivo", "28068439"]], s);
  assert.equal(s.turn, 2.4);
  assert.equal(hits, 1);
});
