// End-to-end behaviour of the built single-file dashboard (dist/index.html) in jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIST, loadFile, loadHtml, text, setInput, click, blobText, dropFile } from "./helpers.js";

const fixture = (f) => readFileSync(new URL("../fixtures/" + f, import.meta.url), "utf8");

test("loads without script errors and shows the sample business case", () => {
  const { document, errors } = loadFile(DIST);
  assert.deepEqual(errors, []);
  assert.equal(text(document, "k-roi"), "621%");
  assert.match(text(document, "k-pb"), /^1,7 mesi$/);
  assert.match(text(document, "brandSub"), /GAROFOLI S\.p\.A\. · esercizio 2025/);
  assert.equal(document.getElementById("blockNote").hidden, true);
  assert.ok(document.querySelectorAll("#glossBody .gl-item").length > 80);
});

test("tabs show exactly one panel (instant switch when Web Animations are unavailable)", () => {
  const { window, document } = loadFile(DIST);
  click(window, 'nav.tabs button[data-tab="scenari"]');
  const visible = [...document.querySelectorAll("section.panel")].filter((p) => !p.hidden).map((p) => p.id);
  assert.deepEqual(visible, ["p-scenari"]);
  assert.equal(document.querySelector(".wrap:not([style])") !== null, true); // no min-height left behind
});

test("tab bar has the sliding indicator with the spring curve", () => {
  const { document } = loadFile(DIST);
  const nav = document.querySelector("nav.tabs");
  assert.ok(nav.classList.contains("has-ink"));
  assert.equal(nav.querySelectorAll(".tab-ink").length, 1);
  assert.match(nav.style.getPropertyValue("--spring-dur"), /^\d+ms$/);
  assert.equal(nav.querySelector('button[data-tab="motore"]').dataset.label, "Motore di calcolo");
});

test("editing an input recalculates the dashboard", () => {
  const { window, document } = loadFile(DIST);
  setInput(window, "i_inv", 62000);
  assert.equal(text(document, "k-roi"), "261%");
});

test("clearing a numeric field sets it to zero instead of keeping the old value", () => {
  const { window, document } = loadFile(DIST);
  setInput(window, "i_invAz", 50000);
  assert.match(text(document, "k-inv"), /81\.000/);
  setInput(window, "i_invAz", "");
  assert.match(text(document, "k-inv"), /31\.000/);
});

test("'Azzera tutto' blocks results and switches to the Dati tab", () => {
  const { window, document } = loadFile(DIST);
  click(window, "#clearBtn");
  assert.equal(text(document, "k-roi"), "—");
  assert.equal(document.getElementById("blockNote").hidden, false);
  assert.equal(document.getElementById("p-dati").hidden, false);
  click(window, "#resetBtn");
  assert.equal(text(document, "k-roi"), "621%");
});

test("CSV import (Italian Excel export with thousands separators) fills the model", async () => {
  const { window, document } = loadFile(DIST);
  click(window, "#clearBtn");
  await dropFile(window, "bilancio.csv", fixture("italian-format.csv"));
  assert.match(text(document, "status"), /voci riconosciute da bilancio\.csv/);
  assert.equal(document.getElementById("i_vdp").value, "25619746");
  assert.equal(document.getElementById("i_inv").value, "31000");
  assert.equal(document.getElementById("i_acc").value, "125000");
  assert.notEqual(text(document, "k-roi"), "—");
});

test("imported values are escaped in the change table (no HTML injection)", async () => {
  const { window, document } = loadFile(DIST);
  await dropFile(window, "evil.csv", 'Azienda;<img src=x onerror="window.__pwned=1">\nTurnover;3');
  assert.equal(document.querySelector("#changes img"), null);
  assert.equal(window.__pwned, undefined);
});

test("print shows every panel with sections expanded, and afterprint restores the screen", async () => {
  const { window, document } = loadFile(DIST);
  const closedBefore = document.querySelectorAll("section.panel details:not([open])").length;
  assert.ok(closedBefore > 0);
  click(window, "#printBtn");
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(window.__printed, true);
  assert.equal([...document.querySelectorAll("section.panel")].filter((p) => p.hidden).length, 0);
  assert.equal(document.querySelectorAll("section.panel details:not([open])").length, 0);
  window.dispatchEvent(new window.Event("afterprint"));
  const visible = [...document.querySelectorAll("section.panel")].filter((p) => !p.hidden).map((p) => p.id);
  assert.deepEqual(visible, ["p-sintesi"]);
  assert.equal(document.querySelectorAll("section.panel details:not([open])").length, closedBefore);
});

test("Ctrl+P (beforeprint) prepares the document like the button", () => {
  const { window, document } = loadFile(DIST);
  window.dispatchEvent(new window.Event("beforeprint"));
  assert.equal([...document.querySelectorAll("section.panel")].filter((p) => p.hidden).length, 0);
  window.dispatchEvent(new window.Event("afterprint"));
  assert.equal([...document.querySelectorAll("section.panel")].filter((p) => !p.hidden).length, 1);
});

test("every form field has a formatted static value for the PDF", () => {
  const { window, document } = loadFile(DIST);
  const pv = (id) => document.getElementById(id).closest(".field").querySelector(".pv").textContent;
  assert.equal(pv("i_vdp"), "25.619.746");
  assert.equal(pv("i_gap"), "4,3");
  assert.equal(pv("i_piva"), "—");
  assert.match(pv("i_base"), /^HCVA/);
  setInput(window, "i_ric", 1000);
  assert.equal(pv("i_ric"), "1000");
});

test("header actions are labelled icon buttons", () => {
  const { document } = loadFile(DIST);
  const btns = [...document.querySelectorAll(".hdr-actions button")];
  assert.deepEqual(btns.map((b) => b.id), ["themeBtn", "clearBtn", "resetBtn", "glossBtn", "printBtn", "updBtnTop", "logoutBtn"]);
  for (const b of btns) {
    assert.ok(b.classList.contains("ib"));
    assert.ok(b.getAttribute("aria-label"));
    assert.ok(b.querySelector("svg"));
  }
  // the built file needs no login: it starts directly, with no logout button
  assert.equal(document.getElementById("logoutBtn").hidden, true);
  assert.ok(!document.documentElement.classList.contains("sv-checking"));
});

test("status bar shows client metadata and headline KPIs", () => {
  const { window, document } = loadFile(DIST);
  assert.equal(text(document, "sbCompany"), "GAROFOLI S.p.A.");
  assert.equal(text(document, "sbRoi"), "621%");
  assert.equal(text(document, "sbPb"), "1,7 mesi");
  setInput(window, "i_piva", "01720630555");
  setInput(window, "i_ateco", "70.22.09");
  setInput(window, "i_settore", "Consulenza");
  assert.match(text(document, "sbMeta"), /P\.IVA 01720630555.*ATECO 70\.22\.09 · Consulenza.*Esercizio 2025/);
  assert.match(text(document, "checksList"), /Partita IVA 01720630555 formalmente valida/);
  setInput(window, "i_piva", "01720630554");
  assert.match(text(document, "checksList"), /cifra di controllo non è valida/);
  click(window, "#clearBtn");
  assert.equal(text(document, "sbCompany"), "Nessun cliente");
  assert.equal(text(document, "sbRoi"), "—");
});

test("'Salva copia' produces a standalone page that reopens with the client data", async () => {
  const first = loadFile(DIST);
  setInput(first.window, "i_company", "Rossi </script><script>window.__pwned=1</script> S.r.l.");
  setInput(first.window, "i_inv", 62000);
  first.document.querySelector('.i[data-info="roi"]').click(); // leave a popover open
  click(first.window, "#printBtn");                            // and all panels un-hidden
  click(first.window, "#saveHtml");
  const blob = first.window.__downloads.at(-1);
  const saved = await blobText(first.window, blob);

  const copy = loadHtml(saved);
  assert.deepEqual(copy.errors, []);
  assert.equal(copy.window.__pwned, undefined);
  assert.equal(copy.document.getElementById("i_company").value, "Rossi </script><script>window.__pwned=1</script> S.r.l.");
  assert.equal(text(copy.document, "k-roi"), "261%");
  assert.equal(copy.document.querySelectorAll("#pop").length, 1);
  assert.equal(copy.document.getElementById("pop").hidden, true);
  assert.deepEqual([...copy.document.querySelectorAll("section.panel")].filter((p) => !p.hidden).map((p) => p.id), ["p-sintesi"]);
  // «Dati campione» in a saved copy restores the saved client, not the sample
  setInput(copy.window, "i_inv", 1);
  click(copy.window, "#resetBtn");
  assert.equal(copy.document.getElementById("i_inv").value, "62000");
});

test("'Salva dati' JSON reloads into the same results", async () => {
  const { window, document } = loadFile(DIST);
  setInput(window, "i_turn", 6);
  click(window, "#saveJson");
  const json = JSON.parse(await blobText(window, window.__downloads.at(-1)));
  assert.equal(json.turn, 6);
  assert.equal(json.company, "GAROFOLI S.p.A.");
  const roi = text(document, "k-roi");

  const other = loadFile(DIST);
  const f = new other.window.File([JSON.stringify(json)], "dati.json", { type: "application/json" });
  const inp = other.document.getElementById("jfile");
  Object.defineProperty(inp, "files", { value: [f] });
  inp.dispatchEvent(new other.window.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(text(other.document, "k-roi"), roi);
});
