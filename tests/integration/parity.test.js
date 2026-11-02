// The refactored build must show exactly the same results as the original single-file dashboard.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIST, LEGACY, loadFile, setInput, setSelect, click } from "./helpers.js";

// every element whose text carries a computed value
const IDS = [
  "brandSub", "footR", "scenEyebrow", "leadTxt",
  "k-roi", "k-roi-sub", "k-ben", "k-ben-sub", "k-pb", "k-pb-sub", "k-be", "k-be-sub",
  "k-cost", "k-cost-sub", "k-prod", "k-prod-sub", "k-gap", "k-gap-sub", "k-inv", "k-inv-sub",
  "chain", "cfoLine", "checksList", "calibBox", "coerenza", "derivedTbl",
  "scenDesc", "baseExpl", "l1amt", "l2amt", "l3amt", "l4amt", "l1f", "l2f", "l3f", "leverTbl",
  "scenCards", "scenTbl", "sensCap", "beNote", "verifyTbl", "hcroiNote", "convTbl", "gapConvTbl", "vociTbl", "srcTbl", "glossBody",
];
const FIELDS = ["o_atteso", "o_usc", "o_scop", "o_pop", "o_mgg", "o_ebit", "o_ebitda"];
const CHARTS = ["waterfall", "hurdle", "bulletComp", "bulletCov", "riskMini", "baseCmp", "scenChart", "sensChart", "beChart"];

function snapshot(doc) {
  const out = {};
  for (const id of IDS) out[id] = doc.getElementById(id).textContent.replace(/\s+/g, " ").trim();
  for (const id of FIELDS) out[id] = doc.getElementById(id).value;
  // chart labels (SVG text), ignoring generated pattern ids
  for (const id of CHARTS) out[id] = [...doc.getElementById(id).querySelectorAll("text")].map((t) => t.textContent).join(" | ");
  return out;
}

function both(steps) {
  const pages = [loadFile(LEGACY), loadFile(DIST)];
  for (const p of pages) steps(p.window);
  return pages.map((p) => snapshot(p.document));
}

const cases = {
  "sample data, scenario base": () => {},
  "scenario prudenziale": (w) => click(w, '#segScen button[data-scen="prud"]'),
  "scenario espansivo + prudent EBITDA": (w) => { click(w, '#segScen button[data-scen="espa"]'); setSelect(w, "i_conv", "prud"); },
  "custom slider + VA base": (w) => { setInput(w, "s_el", 65); setSelect(w, "i_base", "va"); },
  "lever 4 active with vacancies": (w) => { setSelect(w, "s_l4on", 1); setInput(w, "i_posVac", 3); setInput(w, "s_gg", 60); },
  "partial population + action cost": (w) => { setInput(w, "i_nVal", 120); setInput(w, "i_invAz", 40000); },
  "calibrated assumptions": (w) => { const c = w.document.getElementById("c_el"); c.checked = true; c.dispatchEvent(new w.Event("change", { bubbles: true })); },
  "blocked: all data cleared": (w) => click(w, "#clearBtn"),
  "loss-making company": (w) => { setInput(w, "i_costiProd", 26000000); },
};

for (const [name, steps] of Object.entries(cases)) {
  test(`parity with legacy: ${name}`, () => {
    const [legacy, dist] = both(steps);
    for (const k of Object.keys(legacy)) assert.equal(dist[k], legacy[k], `mismatch in #${k}`);
  });
}
