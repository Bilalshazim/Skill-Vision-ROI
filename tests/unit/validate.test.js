import { test } from "node:test";
import assert from "node:assert/strict";
import { model } from "../../src/js/core/model.js";
import { validate, isBlocked } from "../../src/js/core/validate.js";
import { SAMPLE, EMPTY, normalizeState } from "../../src/js/core/defaults.js";

const run = (over) => { const s = { ...normalizeState(SAMPLE), ...over }; return validate(s, model(s)); };
const has = (checks, level, re) => checks.some((c) => c.l === level && re.test(c.t));

test("sample data is not blocked and both P&L reconciliations pass", () => {
  const c = run({});
  assert.equal(isBlocked(c), false);
  assert.ok(has(c, "ok", /EBIT dichiarato coincidente/));
  assert.ok(has(c, "ok", /EBITDA dichiarato coincidente/));
});

test("empty data blocks results and lists every essential field", () => {
  const s = normalizeState(EMPTY);
  const c = validate(s, model(s));
  assert.ok(isBlocked(c));
  const msg = c.find((x) => x.l === "bad").t;
  for (const f of ["numero dipendenti", "valore della produzione", "totale costi della produzione", "costo del personale", "corrispettivo"]) {
    assert.match(msg, new RegExp(f));
  }
});

test("unit-of-measure and inverted-line checks", () => {
  assert.ok(has(run({ vdp: 25619.746, costiProd: 20257.407, cp: 7179.874, sal: 5111.582 }), "warn", /migliaia/));
  assert.ok(has(run({ cp: 30000000 }), "bad", /costo del personale supera/));
  assert.ok(has(run({ sal: 8000000 }), "bad", /Salari e stipendi superano/));
});

test("range checks block out-of-scale assessment values", () => {
  assert.ok(isBlocked(run({ gap: 60 })));
  assert.ok(isBlocked(run({ cov: 120 })));
  assert.ok(isBlocked(run({ comp: 98, gap: 4 })));           // atteso > 100
  assert.ok(has(run({ comp: 93, gap: 4 }), "info", /Valore atteso medio implicito/));
});

test("non-positive HCVA blocks the productivity lever", () => {
  assert.ok(has(run({ costiProd: 40000000 }), "bad", /HCVA è negativo/));
});

test("EBITDA reconciliation names the convention the file follows", () => {
  assert.ok(has(run({ conv: "prud" }), "warn", /segue la convenzione gestionale/));
  assert.ok(has(run({ ebitda: 6916793 }), "warn", /segue la convenzione prudente/));
  assert.ok(has(run({ ebitda: 1 }), "warn", /non quadra/));
  assert.ok(has(run({ ebit: 1 }), "warn", /EBIT dichiarato .* differisce/));
});

test("missing development-action cost is flagged with the break-even budget", () => {
  assert.ok(has(run({ invAz: 0 }), "warn", /Costo delle azioni di sviluppo non indicato/));
  assert.ok(!has(run({ invAz: 50000 }), "warn", /Costo delle azioni di sviluppo non indicato/));
});

test("checks are sorted bad → warn → info → ok", () => {
  const order = { bad: 0, warn: 1, info: 2, ok: 3 };
  const c = run({ gap: 60, invAz: 0 });
  for (let i = 1; i < c.length; i++) assert.ok(order[c[i - 1].l] <= order[c[i].l]);
});
