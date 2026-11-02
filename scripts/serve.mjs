// Minimal static server for local use: node scripts/serve.mjs [dir] [port] [base]
//   dir  — folder to serve, relative to the repo root ("." = the GitHub Pages site, "dist" = built file)
//   base — URL prefix, e.g. Skill-Vision-ROI to reproduce a GitHub Pages project site
//          (write it without the leading slash: Git Bash rewrites "/name" into a Windows path)
// The root index.html loads ES modules from ./src/, so it needs a server; dist/index.html also opens from disk.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] || ".");
const port = Number(process.argv[3] || process.env.PORT || 5173);
const base = ("/" + (process.argv[4] || "/").replace(/^\/+|\/+$/g, "") + "/").replace(/\/+/g, "/");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".csv": "text/csv; charset=utf-8" };

createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!rel.startsWith(base)) { res.writeHead(404).end("Not found"); return; }
  rel = "/" + rel.slice(base.length);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(root, path.normalize(rel));
  // like GitHub Pages: nothing outside the site, no dotfiles (.git, .github…)
  if (!file.startsWith(root) || /[\\/]\./.test(path.relative(root, file).replace(/^/, "/"))) { res.writeHead(404).end("Not found"); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}${base}`));
