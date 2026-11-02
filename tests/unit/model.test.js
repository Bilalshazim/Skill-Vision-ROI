import { test } from "node:test";
import assert from "node:assert/strict";
import { model } from "../../src/js/core/model.js";
import { SAMPLE, EMPTY, clone, migrate, complete, normalizeState } from "../../src/js/core/defaults.js";
import { SCEN, scenOverrides, activeScen, scenName, calibCount } from "../../src/js/core/scenarios.js";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
const sample = () => normalizeState(SAMPLE);

test("accounting reconstruction on the GAROFOLI sample", () => {
  const m = model(sample());
  assert.equal(m.EBIT, 5362339);          // A − B, matches declared EBIT
  assert.equal(m.EBITDA, 7016793);        // gestionale: EBIT + B10 + B12/13, matches declared
  assert.equal(m.HCVA, 5362339 + 7179874);
  assert.equal(m.VA, 7016793 + 7179874);
  assert.equal(m.VA - m.HCVA, 1554454 + 100000);
  close(m.hcroi, 12542213 / 7179874);
  close(m.taxRate, 1307812 / 4938350);
});

test("lever values, ROI and payback on the sample (scenario base)", () => {
  const m = model(sample());
  close(m.gapVal, 12542213 * 0.043);                 // HCVA × GAP, full population
  close(m.l1, 12542213 * 0.043 * 0.5 * 0.7);        // × elasticity × feasibility
  close(m.turnVal, 5111582 * 0.024 * 0.5);           // exits × (RAL × 50%)
  close(m.l2, 5111582 * 0.024 * 0.5 * 0.2);
  close(m.assVal, 7179874 * 0.035 * 0.6);
  close(m.l3, 7179874 * 0.035 * 0.6 * 0.15);
  assert.equal(m.l4, 0);                              // lever 4 off by default
  close(m.benefit, m.l1 + m.l2 + m.l3);
  assert.equal(m.invTot, 31000);
  close(m.roi, (m.benefit - 31000) / 31000 * 100);
  close(m.roi, 621.4345, 1e-5);
  close(m.roiCost, 12.5303, 1e-4);
  close(m.payback, 31000 / (m.benefit / 12));
  assert.ok(m.payback > 1.66 && m.payback < 1.67);
  close(m.beGap, 31000 / m.gapVal * 100);
});

test("prudent EBITDA convention excludes provisions but leaves HCVA untouched", () => {
  const g = model(sample());
  const p = model(sample(), { conv: "prud" });
  assert.equal(p.EBITDA, g.EBITDA - 100000);
  assert.equal(p.HCVA, g.HCVA);
  assert.equal(p.l1, g.l1);
});

test("economic base selector changes only the productivity lever", () => {
  const s = sample();
  for (const base of ["hcva", "va", "ebitda", "cp"]) {
    const m = model(s, { base });
    close(m.gapVal, Math.max(0, m.bases[base]) * 0.043);
    close(m.l2, model(s).l2);
  }
  assert.equal(model(s, { base: "nonsense" }).base, model(s).HCVA); // unknown base falls back to HCVA
});

test("partial assessed population scales only the gap potential", () => {
  const full = model(sample());
  const half = model(sample(), { nVal: 84.5 });
  close(half.popF, 0.5);
  close(half.gapVal, full.gapVal / 2);
  assert.equal(half.turnVal, full.turnVal);
  assert.equal(model(sample(), { nVal: 500 }).popF, 1); // capped at 100%
});

test("lever 4 (vacancies) only counts when switched on", () => {
  const on = model(sample(), { l4on: 1, posVac: 3, gg: 45, r4: 20 });
  close(on.mgg, on.hcvaFte / 220);
  close(on.covVal, 3 * on.mgg * 45);
  close(on.l4, on.covVal * 0.2);
  assert.equal(model(sample(), { l4on: 0, posVac: 3 }).l4, 0);
});

test("degenerate inputs never produce NaN KPIs that the UI cannot handle", () => {
  const m = model(normalizeState(EMPTY));
  assert.ok(Number.isNaN(m.roi));          // no investment → ROI undefined (rendered as "—")
  assert.equal(m.payback, Infinity);
  assert.equal(m.benefit, 0);
});

test("scenarios: presets are detected, custom values are labelled", () => {
  const s = sample();
  assert.equal(activeScen(s).id, "base");
  for (const x of SCEN) assert.equal(activeScen({ ...s, ...scenOverrides(x) }).id, x.id);
  assert.equal(activeScen({ ...s, el: 55 }), null);
  assert.equal(scenName({ ...s, el: 55 }), "scenario personalizzato");
  // more prudent scenario ⇒ lower benefit
  const b = SCEN.map((x) => model(s, scenOverrides(x)).benefit);
  assert.ok(b[0] < b[1] && b[1] < b[2]);
  assert.equal(calibCount(s), 0);
  assert.equal(calibCount({ ...s, cal: { el: 1, r1: 1 } }), 2);
});

test("v3 save files are migrated (single slider r1 → elasticity × feasibility)", () => {
  const v3 = { ...clone(SAMPLE), r1: 35 };
  delete v3.el;
  const x = migrate(v3);
  assert.equal(x.el, 50);
  assert.equal(x.r1, 70);
  close(model(complete(x)).effL1, 0.35); // same effective share as v3
});

test("complete() fills fields introduced in v4", () => {
  const x = complete({ N: 10 });
  assert.equal(x.nVal, 10);
  assert.deepEqual(x.cal, { el: 0, r1: 0, cs: 0, r2: 0, qa: 0, r3: 0 });
  assert.equal(x.invAz, 0);
  assert.equal(x.conv, "gest");
});
