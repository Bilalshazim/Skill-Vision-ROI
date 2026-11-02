// Loads an HTML page in jsdom with its inline scripts running, as a browser would.
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync } from "node:fs";

export const DIST = new URL("../../dist/index.html", import.meta.url);
export const LEGACY = new URL("../../legacy/Motore ROI del capitale umano.html", import.meta.url);

export function loadHtml(html) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => { if (!/Not implemented/.test(e.message)) errors.push(e); });
  const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => {};
      w.print = () => { w.__printed = true; };
      w.URL.createObjectURL = (blob) => { w.__downloads.push(blob); return "blob:test"; };
      w.URL.revokeObjectURL = () => {};
      w.__downloads = [];
    },
  });
  return { dom, window: dom.window, document: dom.window.document, errors };
}

export const loadFile = (url) => loadHtml(readFileSync(url, "utf8"));

export const text = (doc, id) => doc.getElementById(id).textContent;

export function setInput(win, id, value) {
  const el = win.document.getElementById(id);
  el.value = String(value);
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
}
export function setSelect(win, id, value) {
  const el = win.document.getElementById(id);
  el.value = String(value);
  el.dispatchEvent(new win.Event("change", { bubbles: true }));
}
export const click = (win, selector) => win.document.querySelector(selector).click();

export function blobText(win, blob) {
  return new Promise((resolve, reject) => {
    const r = new win.FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
}

// Simulates dropping a file on the drop zone; resolves after the FileReader finishes
export function dropFile(win, name, content) {
  const file = new win.File([content], name, { type: "text/csv" });
  const ev = new win.Event("drop", { bubbles: true, cancelable: true });
  ev.dataTransfer = { files: [file] };
  win.document.getElementById("drop").dispatchEvent(ev);
  return new Promise((r) => setTimeout(r, 50));
}
