import { test } from "node:test";
import assert from "node:assert/strict";
import { SNAPPY_TAB_SPRING, FAST_PAGE_VARIANTS, springEasing, cubicBezier, frame } from "../../src/js/core/motion.js";

test("presets match instructions.md §1 exactly", () => {
  assert.deepEqual(SNAPPY_TAB_SPRING, { type: "spring", stiffness: 600, damping: 35, mass: 0.5 });
  assert.deepEqual(FAST_PAGE_VARIANTS.initial, { opacity: 0, scale: 0.985, y: 4 });
  assert.deepEqual(FAST_PAGE_VARIANTS.animate.transition, { duration: 0.16, ease: [0.2, 0, 0, 1] });
  assert.deepEqual(FAST_PAGE_VARIANTS.exit, { opacity: 0, scale: 0.985, y: -4, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } });
});

test("tab spring becomes a CSS linear() curve: monotonic, no overshoot, fast settle", () => {
  const s = springEasing(SNAPPY_TAB_SPRING);
  assert.match(s.easing, /^linear\(0, [\d., ]+, 1\)$/);
  assert.equal(s.points[0], 0);
  assert.equal(s.points.at(-1), 1);
  for (let i = 1; i < s.points.length; i++) assert.ok(s.points[i] >= s.points[i - 1], "monotonic");
  assert.ok(Math.max(...s.points) <= 1, "damping 35 ≈ critical (2·√(600·0.5) ≈ 34.6): no wobble");
  assert.ok(s.duration > 200 && s.duration < 400, `settles in ${s.duration}ms`);
});

test("an underdamped spring would overshoot (the simulation is real)", () => {
  const s = springEasing({ stiffness: 600, damping: 8, mass: 0.5 });
  assert.ok(Math.max(...s.points.slice(0, -1)) > 1);
});

test("stylesheet animates only transform and opacity (instructions.md §2, GPU-only)", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../../src/styles/main.css", import.meta.url), "utf8");
  // drop (…) groups first, so commas inside var()/cubic-bezier() don't split a declaration
  const flat = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)/g, ""); } while (s !== p); return s; };
  const props = [...css.matchAll(/transition(?:-property)?\s*:\s*([^;}]+)/g)]
    .flatMap((m) => flat(m[1]).split(","))
    .map((p) => p.trim().split(/\s+/)[0])
    .filter((p) => p && p !== "none");
  assert.ok(props.length > 0);
  for (const p of props) assert.ok(["transform", "opacity"].includes(p), `transition on "${p}"`);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\*\s*\{\s*animation-duration:\s*\.01ms!important;\s*transition-duration:\s*\.01ms!important/);
});

test("variant frames only use transform and opacity", () => {
  assert.deepEqual(frame(FAST_PAGE_VARIANTS.exit), { opacity: 0, transform: "translateY(-4px) scale(0.985)" });
  assert.deepEqual(Object.keys(frame(FAST_PAGE_VARIANTS.initial)).sort(), ["opacity", "transform"]);
  assert.equal(cubicBezier([0.2, 0, 0, 1]), "cubic-bezier(0.2,0,0,1)");
});
