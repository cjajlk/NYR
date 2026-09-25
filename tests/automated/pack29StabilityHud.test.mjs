import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStabilityDisplay } from "../../src/ui/stabilityDisplay.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";

function element(tag) {
  return { tag, children: [], attributes: {}, hidden: false,
    addEventListener() {},
    append(...children) { this.children.push(...children); },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
}
for (const hz of [30, 60, 120]) {
  const runtime = await import(`../../src/core/runtimeState.js?hud=${hz}`);
  const stability = createNyrStability();
  const hud = createStabilityDisplay(element);
  const [label, gauge] = hud.element.children;
  function check(value, ended = false, portrait = false) {
    const before = stability.snapshot();
    const runtimeBefore = runtime.getRuntimeState();
    for (let frame = 0; frame < hz; frame++) hud.update(before, runtimeBefore);
    assert.equal(label.textContent, `STABILITÉ ${value}/100`);
    assert.equal(gauge.value, value);
    assert.equal(gauge.min, 0); assert.equal(gauge.max, 100);
    assert.equal(hud.element.hidden, portrait);
    assert.equal(hud.gameOverElement.hidden, portrait || !ended);
    assert.deepEqual(stability.snapshot(), before, "HUD never mutates stability");
    assert.deepEqual(runtime.getRuntimeState(), runtimeBefore, "HUD never changes runtime");
  }
  check(100);
  stability.applyAsteroidContact(); check(75);
  stability.applyCorruptionContact(); check(55);
  stability.applyPureFragment(); check(75);
  stability.applyPureFragment(); check(95);
  stability.applyPureFragment(); check(100);
  runtime.suspendRuntime("portrait-orientation"); check(100, false, true);
  runtime.resumeRuntime("portrait-orientation"); check(100);
  for (let hit = 0; hit < 4; hit++) stability.applyAsteroidContact();
  check(0, false); // Display must not create Game Over itself.
  runtime.endGame(); check(0, true);
  assert.equal(hud.gameOverElement.children[0].textContent, "GAME OVER");
  assert.equal(hud.gameOverElement.children[1].textContent, "STABILITÉ ÉPUISÉE");
  runtime.suspendRuntime("portrait-orientation"); check(0, true, true);
  runtime.resumeRuntime("portrait-orientation"); check(0, true);
  assert.equal(runtime.isRuntimeActive(), false);
}
const source = readFileSync(new URL("../../src/ui/stabilityDisplay.js", import.meta.url), "utf8");
assert.doesNotMatch(source, /applyAsteroidContact|applyCorruptionContact|applyPureFragment|endGame\(|resumeRuntime|suspendRuntime|reset\(/);
const main = readFileSync(new URL("../../src/main.js", import.meta.url), "utf8");
assert.match(main, /render\(\)\s*\{[^}]*stabilityDisplay.update\(stability.snapshot\(\), getRuntimeState\(\), runStatistics.snapshot\(\)\)/);
assert.match(main, /app.append\(stabilityDisplay.element, stabilityDisplay.gameOverElement\)/);
const css = readFileSync(new URL("../../assets/css/main.css", import.meta.url), "utf8");
assert.match(css, /\.orientation-overlay\s*\{[^}]*z-index: 10/);
assert.match(css, /\.game-over-indication\s*\{[^}]*z-index: 9/);
assert.match(css, /\.stability-display\s*\{[^}]*pointer-events: none/);
assert.match(css, /\.stability-display\[hidden\], \.game-over-indication\[hidden\] \{ display: none/);
console.log("PACK 29 stability HUD and Game Over: tests OK");
