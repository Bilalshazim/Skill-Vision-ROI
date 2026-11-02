// Builds dist/index.html: one self-contained file (CSS, JS and logos inlined)
// that opens with a double click and can save standalone copies of itself.
import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (p) => path.join(root, "src", p);
const outDir = path.join(root, "dist");
const outFile = path.join(outDir, "index.html");

function replaceOnce(html, needle, replacement) {
  const i = html.indexOf(needle);
  if (i < 0) throw new Error(`build: "${needle}" not found in src/index.html`);
  // function form: replacement text is inserted literally (no $-patterns)
  return html.slice(0, i) + replacement + html.slice(i + needle.length);
}

const bundle = await build({
  entryPoints: [src("js/main.js")],
  bundle: true,
  format: "iife",
  target: "es2018",
  charset: "utf8",
  legalComments: "none",
  write: false,
});
const js = bundle.outputFiles[0].text;
if (/<\/script/i.test(js)) throw new Error("build: bundled JS contains </script and cannot be inlined");

const css = await readFile(src("styles/main.css"), "utf8");
const logo = async (name) => "data:image/png;base64," + (await readFile(src("assets/" + name))).toString("base64");

let html = await readFile(src("index.html"), "utf8");
html = replaceOnce(html, '<link rel="stylesheet" href="styles/main.css">', `<style>\n${css}</style>`);
html = replaceOnce(html, 'src="assets/logo-light.png"', `src="${await logo("logo-light.png")}"`);
html = replaceOnce(html, 'src="assets/logo-dark.png"', `src="${await logo("logo-dark.png")}"`);
html = replaceOnce(html, '<script type="module" src="js/main.js"></script>', `<script>\n${js}</script>`);

await mkdir(outDir, { recursive: true });
await writeFile(outFile, html, "utf8");
console.log(`built ${path.relative(root, outFile)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
