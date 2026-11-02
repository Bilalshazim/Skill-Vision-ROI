// GitHub Pages deployment: the root index.html must load every asset from ./src/ with paths that
// exist, match letter case exactly (Pages is case-sensitive, Windows is not) and are committed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { absolutizeAssets } from "../../src/js/ui/save.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rootHtml = readFileSync(path.join(root, "index.html"), "utf8");
const PAGES_URL = "https://bilalshazim.github.io/Skill-Vision-ROI/";

// exact-case existence: every path segment must appear verbatim in its directory listing
function existsExactCase(rel) {
  let dir = root;
  for (const seg of rel.split("/").filter((s) => s && s !== ".")) {
    if (!existsSync(dir) || !readdirSync(dir).includes(seg)) return false;
    dir = path.join(dir, seg);
  }
  return statSync(dir).isFile();
}

function localRefs(html) {
  return [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(?:[a-z]+:|\/\/|#)/i.test(u));
}

// relative ES-module import graph starting from the entry point
function importGraph(entry) {
  const seen = new Set(), queue = [entry];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    if (!existsExactCase(rel)) continue;
    const code = readFileSync(path.join(root, rel), "utf8");
    for (const m of code.matchAll(/(?:import|export)\s[^;]*?from\s*"(\.{1,2}\/[^"]+)"|import\s*"(\.{1,2}\/[^"]+)"/g)) {
      queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1] || m[2])));
    }
  }
  return [...seen];
}

const refs = localRefs(rootHtml);
const modules = importGraph("src/js/main.js");

test("root index.html references the stylesheet, logos and entry module under ./src/", () => {
  assert.deepEqual(refs.sort(), ["./src/assets/logo-dark.png", "./src/assets/logo-light.png", "./src/js/main.js", "./src/styles/main.css"]);
  assert.match(rootHtml, /<script type="module" src="\.\/src\/js\/main\.js"><\/script>/);
});

test("no root-absolute paths (they would break under the /Skill-Vision-ROI/ project path)", () => {
  assert.deepEqual([...rootHtml.matchAll(/\s(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]), []);
  for (const f of modules) assert.doesNotMatch(readFileSync(path.join(root, f), "utf8"), /from\s*"\/[^/]/, f);
});

test("every referenced file exists with exact letter case", () => {
  const missing = [...refs.map((r) => r.replace(/^\.\//, "")), ...modules].filter((f) => !existsExactCase(f));
  assert.deepEqual(missing, []);
  assert.ok(modules.length >= 20, `import graph has ${modules.length} modules`);
});

test("stylesheet has no local url() references that could 404", () => {
  const css = readFileSync(path.join(root, "src/styles/main.css"), "utf8");
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)/g)].map((m) => m[1]).filter((u) => !/^(?:data:|https?:|#)/.test(u));
  assert.deepEqual(urls, []);
});

test("every file the site loads is committed to git (untracked files 404 on Pages)", (t) => {
  let tracked;
  try { tracked = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/)); }
  catch { t.skip("git not available"); return; }
  const files = ["index.html", ".nojekyll", ...refs.map((r) => r.replace(/^\.\//, "")), ...modules];
  const untracked = files.filter((f) => !tracked.has(f));
  if (untracked.length && untracked.every((f) => existsExactCase(f))) {
    t.diagnostic("exists locally but not committed yet: " + untracked.join(", "));
  }
  assert.deepEqual(untracked.filter((f) => !existsExactCase(f)), []);
});

test("'Salva copia' from the hosted site points assets at absolute Pages URLs", () => {
  const doc = new JSDOM(rootHtml).window.document;
  absolutizeAssets(doc, PAGES_URL);
  assert.deepEqual(localRefs(doc.documentElement.outerHTML), []);
  assert.equal(doc.querySelector('script[type="module"]').getAttribute("src"), PAGES_URL + "src/js/main.js");
  assert.equal(doc.querySelector('img.logo.l').getAttribute("src"), PAGES_URL + "src/assets/logo-light.png");
  assert.match(doc.querySelector('link[href*="fonts.googleapis"]').getAttribute("href"), /^https:\/\/fonts\.googleapis\.com\//);
  // opened from disk (file:) nothing is rewritten
  const local = new JSDOM(rootHtml).window.document;
  absolutizeAssets(local, "file:///C:/x/index.html");
  assert.equal(local.querySelector('script[type="module"]').getAttribute("src"), "./src/js/main.js");
});

test("the built single file (dist/) has no external local references", () => {
  const dist = readFileSync(path.join(root, "dist/index.html"), "utf8");
  assert.deepEqual(localRefs(dist), []);
});
