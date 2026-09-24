import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { NYR_PROTOTYPE_CONFIG, ZONE_THREE_SPEED_MULTIPLIER } from "../../src/gameplay/nyrPrototypeConfig.js";
import { createCorruptionPocket } from "../../src/gameplay/corruptionPocket.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { endGame } from "../../src/core/runtimeState.js";
export function verifyIntensity({ app, frame, snapshot, hz, setBounds }) {
  assert.equal(NYR_PROTOTYPE_CONFIG.speedPixelsPerSecond, 95);
  assert.equal(ZONE_THREE_SPEED_MULTIPLIER, 1.15);
  for (const multiplier of [1, 1.15]) {
    const movement = createNyrMovement(); movement.reset(2000, 1000);
    const start = movement.snapshot();
    for (let i = 0; i < hz; i++) movement.update(1 / hz, 2000, 1000, multiplier);
    assert.ok(Math.abs(movement.snapshot().x - start.x - 95 * multiplier) < 1e-8);
    assert.equal(movement.snapshot().heading, start.heading);
    assert.equal(movement.snapshot().y, start.y);
  }
  const stability = createNyrStability();
  assert.equal(stability.applyAsteroidContact().stability, 75);
  assert.equal(stability.applyCorruptionContact().stability, 55);
  for (const [zone, delay] of [["zone-2", 5], ["zone-3", 4]]) {
    let hits = 0;
    const pocket = createCorruptionPocket(() => { stability.applyCorruptionContact(); hits++; });
    const step = (dt, head = { x: -1000, y: -1000 }) => pocket.update(dt, zone, 940, 392, head);
    step(0);
    const position = pocket.snapshot();
    for (let i = 0; i < hz - 1; i++) step(1 / hz, position);
    assert.equal(hits, 0);
    step(1 / hz, position);
    assert.equal(hits, 1);
    assert.equal(pocket.snapshot().phase, "active");
    for (let i = 0; i < hz * 4 - 1; i++) step(1 / hz, position);
    assert.equal(hits, 1);
    step(1 / hz, position);
    assert.equal(pocket.snapshot().phase, "cooldown");
    assert.ok(Math.abs(pocket.snapshot().remaining - delay) < 1e-8);
    for (let i = 0; i < hz * delay - 1; i++) step(1 / hz);
    assert.equal(pocket.snapshot().phase, "cooldown");
    step(1 / hz);
    assert.equal(pocket.snapshot().phase, "warning");
    assert.equal(pocket.snapshot().generation, 2);
  }
  const switching = createCorruptionPocket(() => {});
  switching.update(0, "zone-2", 940, 392, { x: 0, y: 0 });
  switching.update(7, "zone-2", 940, 392, { x: 0, y: 0 });
  assert.equal(switching.snapshot().remaining, 3);
  switching.update(0, "zone-3", 940, 392, { x: 0, y: 0 });
  assert.equal(switching.snapshot().remaining, 2, "elapsed cooldown preserved on transition");

  const initial = snapshot(globalThis.probe);
  for (const menu of [false, true]) {
    const p = globalThis.probe;
    frame(); frame();
    const distanceStep = expected => {
      const before = p.movement.snapshot(); frame();
      const after = p.movement.snapshot();
      assert.ok(Math.abs(Math.hypot(after.x - before.x, after.y - before.y) - expected / hz) < 1e-8);
    };
    distanceStep(95);
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 0; i < 27; i++) normal();
    distanceStep(95);
    p.portal.update(p.portal.snapshot());
    distanceStep(95);
    for (let i = 0; i < 15; i++) normal();
    distanceStep(95);
    const conserved = { movement: p.movement.snapshot(), stability: p.stability.snapshot(),
      score: p.score.snapshot(), progression: p.progression.snapshot() };
    p.exitPortal.update(p.exitPortal.snapshot());
    assert.deepEqual({ movement: p.movement.snapshot(), stability: p.stability.snapshot(),
      score: p.score.snapshot(), progression: p.progression.snapshot() }, conserved);
    assert.equal(p.combo.snapshot().chain, 0);
    distanceStep(109.25);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const frozen = snapshot(p);
    for (let i = 0; i < hz * 10; i++) frame();
    assert.deepEqual(snapshot(p), frozen);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.deepEqual(snapshot(p), frozen);
    frame(); distanceStep(109.25);
    endGame(); frame();
    const dead = snapshot(p); for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), dead);
    if (menu) {
      app.children.find(e => e.className === "return-menu").emit("click");
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
  }
}
if (!process.env.NYR_INTENSITY_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_INTENSITY_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 40 zone three intensity: tests OK");
}
