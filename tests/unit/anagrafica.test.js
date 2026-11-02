import { test } from "node:test";
import assert from "node:assert/strict";
import { normPiva, pivaValid, atecoValid } from "../../src/js/core/anagrafica.js";
import { model } from "../../src/js/core/model.js";
import { validate } from "../../src/js/core/validate.js";
import { applyRows } from "../../src/js/core/importer.js";
import { SAMPLE, EMPTY, clone, normalizeState } from "../../src/js/core/defaults.js";

test("partita IVA: check digit (SKILL-VISION 01720630555 is valid)", () => {
  assert.equal(pivaValid("01720630555"), true);
  assert.equal(pivaValid("IT 01720630555"), true);
  assert.equal(pivaValid("01720630554"), false); // wrong check digit
  assert.equal(pivaValid("0172063055"), false);  // 10 digits
  assert.equal(pivaValid(""), false);
});

test("partita IVA from Excel as a number keeps its leading zero", () => {
  assert.equal(normPiva(1720630555), "01720630555");
  assert.equal(normPiva(" IT01720630555 "), "01720630555");
});

test("ATECO code format", () => {
  for (const ok of ["28", "28.2", "28.29", "28.29.30", "70.22.09"]) assert.equal(atecoValid(ok), true, ok);
  for (const bad of ["2829", "28-29", "A28", "28.293.0", ""]) assert.equal(atecoValid(bad), false, bad);
});

test("validation: P.IVA and ATECO are warnings, never blocking", () => {
  const run = (over) => { const s = { ...normalizeState(SAMPLE), ...over }; return validate(s, model(s)); };
  assert.ok(run({ piva: "123" }).some((c) => c.l === "warn" && /11 cifre/.test(c.t)));
  assert.ok(run({ piva: "01720630554" }).some((c) => c.l === "warn" && /cifra di controllo/.test(c.t)));
  assert.ok(run({ piva: "01720630555" }).some((c) => c.l === "ok" && /formalmente valida/.test(c.t)));
  assert.ok(run({ ateco: "xx" }).some((c) => c.l === "warn" && /ATECO/.test(c.t)));
  assert.ok(!run({ piva: "123", ateco: "xx" }).some((c) => c.l === "bad"));
  assert.ok(!run({}).some((c) => /Partita IVA|ATECO/.test(c.t))); // empty fields: no noise
});

test("import reads P.IVA, sector and ATECO as text", () => {
  const s = clone(EMPTY);
  applyRows([["P.IVA", 1720630555], ["Codice ATECO", "70.22.09"], ["Settore", "Consulenza aziendale"]], s);
  assert.equal(s.piva, "01720630555");
  assert.equal(s.ateco, "70.22.09");
  assert.equal(s.settore, "Consulenza aziendale");
});

test("old save files without the new fields are completed", () => {
  const old = clone(SAMPLE);
  delete old.piva; delete old.ateco; delete old.settore;
  const s = normalizeState(old);
  assert.equal(s.piva, "");
  assert.equal(s.ateco, "");
  assert.equal(s.settore, "");
});
