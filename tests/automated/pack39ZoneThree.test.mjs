import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createZoneBackgroundTransition, ZONE_THREE_BACKGROUND_SOURCE } from "../../src/core/zoneBackgroundTransition.js";
import { endGame, getRuntimeState } from "../../src/core/runtimeState.js";
function backgrounds(failThree = false) {
  const images = [];
  const transition = createZoneBackgroundTransition({
    zoneOneBackground: { render: () => ({ mode: "image" }) },
    createImage() {
      const listeners = {};
      const image = { naturalWidth: 1600, naturalHeight: 900,
        addEventListener(n, fn) { listeners[n] = fn; },
        set src(value) { this.source = value; listeners[failThree && images.length === 2 ? "error" : "load"](); }
      };
      images.push(image); return image;
    }
  });
  const context = { calls: [], globalAlpha: 1, save() {}, restore() { this.globalAlpha = 1; },
    drawImage(image, x, y, width, height) { this.calls.push({ source: image.source, x, y, width, height, alpha: this.globalAlpha }); } };
  return { transition, context, images };
}
export function verifyZoneThree({ app, frame, snapshot, hz, setBounds }) {
  const { transition, context, images } = backgrounds();
  assert.equal(images[1].source, ZONE_THREE_BACKGROUND_SOURCE);
  assert.equal(images[1].source, "./assets/images/zones/NYR_ZONE_03_FAILLE_ASTRALE_V1.png");
  transition.sync({ currentZone: "zone-2" }); transition.update(1);
  transition.sync({ currentZone: "zone-3" });
  for (let i = 0; i < hz / 2; i++) transition.update(1 / hz);
  assert.ok(Math.abs(transition.snapshot().progress - 0.5) < 1e-8);
  const frozen = transition.snapshot();
  for (let i = 0; i < hz; i++) transition.render(context, 800, 360);
  assert.deepEqual(transition.snapshot(), frozen);
  for (let i = 0; i < hz / 2; i++) transition.update(1 / hz);
  assert.equal(transition.render(context, 956, 440).mode, "zone-three");
  const draw = context.calls.at(-1);
  assert.equal(draw.source, ZONE_THREE_BACKGROUND_SOURCE); assert.equal(draw.alpha, 1);
  assert.ok(draw.width >= 956 && draw.height >= 440);
  assert.ok(Math.abs(draw.x * 2 + draw.width - 956) < 1e-8);
  const fallback = backgrounds(true);
  fallback.transition.sync({ currentZone: "zone-2" }); fallback.transition.update(1);
  fallback.transition.sync({ currentZone: "zone-3" }); fallback.transition.update(1);
  assert.equal(fallback.transition.render(fallback.context, 956, 440).mode, "zone-two-fallback");
  assert.equal(fallback.transition.snapshot().progress, 0);

  const initial = snapshot(globalThis.probe);
  for (const useMenu of [false, true]) {
    const p = globalThis.probe;
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 0; i < 27; i++) normal();
    p.portal.update(p.portal.snapshot());
    for (let i = 0; i < 15; i++) normal();
    p.pocket.update(0, "zone-2", 940, 392, p.movement.snapshot());
    const pocketPosition = p.pocket.snapshot();
    p.pocket.update(1, "zone-2", 940, 392, pocketPosition);
    const corruption = p.fragmentSystem.snapshot().find(f => f.kind === "corruption");
    p.fragmentSystem.update({ ...corruption, trail: [] }, 940, 392);
    const asteroid = p.mobileAsteroid.snapshot();
    p.mobileAsteroid.update(0, 940, 392, asteroid, p.fragmentSystem.snapshot());
    const preserved = { movement: p.movement.snapshot(), stability: p.stability.snapshot(), score: p.score.snapshot(),
      progression: p.progression.snapshot(), fragments: p.fragmentSystem.snapshot(),
      asteroid: p.mobileAsteroid.snapshot(), pocket: p.pocket.snapshot() };
    p.exitPortal.update(p.exitPortal.snapshot());
    assert.equal(getRuntimeState().phase, "PLAYING");
    assert.equal(getRuntimeState().journeyComplete, false);
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-3");
    assert.deepEqual({ movement: p.movement.snapshot(), stability: p.stability.snapshot(), score: p.score.snapshot(),
      progression: p.progression.snapshot(), fragments: p.fragmentSystem.snapshot(),
      asteroid: p.mobileAsteroid.snapshot(), pocket: p.pocket.snapshot() }, preserved);
    assert.deepEqual(p.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
    p.pocket.update(0, "zone-3", 940, 392, pocketPosition);
    p.fragmentSystem.update({ ...corruption, trail: [] }, 940, 392);
    p.mobileAsteroid.update(0, 940, 392, asteroid, p.fragmentSystem.snapshot());
    assert.deepEqual(p.stability.snapshot(), preserved.stability, "no repeated contact damage at transition");
    p.fragmentSystem.advanceCorruption(0.1, 940, 392);
    assert.notEqual(p.fragmentSystem.snapshot().find(f => f.kind === "corruption").x, corruption.x);
    p.pocket.update(0.1, "zone-3", 940, 392, { x: -1000, y: -1000 });
    assert.ok(p.pocket.snapshot().remaining < preserved.pocket.remaining);
    p.mobileAsteroid.update(0.1, 940, 392, { x: -1000, y: -1000 }, p.fragmentSystem.snapshot());
    assert.notEqual(p.mobileAsteroid.snapshot().x, asteroid.x);
    for (let i = 0; i < 8; i++) normal();
    assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 50);
    assert.equal(p.fragmentSystem.snapshot().find(f => f.kind === "corruption").generation, 45);
    const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
    const beforePure = p.stability.snapshot().stability;
    p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
    assert.equal(p.stability.snapshot().stability, Math.min(100, beforePure + 20));
    assert.equal(p.exitPortal.snapshot().active, false);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const stopped = snapshot(p);
    for (let i = 0; i < hz * 2; i++) frame();
    assert.deepEqual(snapshot(p), stopped);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-3");
    assert.equal(p.stabilityDisplay.gameOverElement.hidden, true);
    assert.equal(p.zoneBackgroundTransition.snapshot().targetZone, "zone-3");
    endGame(); frame();
    if (useMenu) {
      app.children.find(e => e.className === "return-menu").emit("click");
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
  }
}
if (!process.env.NYR_ZONE_THREE_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_ZONE_THREE_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 39 zone three: tests OK");
}
