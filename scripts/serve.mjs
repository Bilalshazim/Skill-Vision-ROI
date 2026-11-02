// Minimal static server for local use: node scripts/serve.mjs [src|dist] [port]
// src/ needs a server because it loads ES modules; dist/index.html also opens directly from disk.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] || "dist");
const port = Number(process.argv[3] || process.env.PORT || 5173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json", ".csv": "text/csv; charset=utf-8" };

createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(root, path.normalize(rel));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`));
