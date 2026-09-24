import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCorruptionPocket } from "../../src/gameplay/corruptionPocket.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { getRuntimeState } from "../../src/core/runtimeState.js";

export function verifyPocket({ app, frame, snapshot, hz, setBounds }) {
  const stability = createNyrStability();
  const pocket = createCorruptionPocket(() => stability.applyCorruptionContact());
  const head = { x: 400, y: 190 };
  const step = (delta, target = head, zone = "zone-2") => pocket.update(delta, zone, 940, 392, target, []);
  step(20, head, "zone-1"); assert.equal(pocket.snapshot().phase, "inactive");
  step(0);
  const start = pocket.snapshot();
  assert.equal(start.phase, "warning");
  const twin = createCorruptionPocket(() => {});
  twin.update(0, "zone-2", 940, 392, head, []);
  assert.deepEqual(twin.snapshot(), start);
  assert.ok(start.x >= start.radius && start.x <= 940 - start.radius);
  assert.ok(start.y >= start.radius && start.y <= 392 - start.radius);
  for (let i = 0; i < hz - 1; i++) step(1 / hz, start);
  assert.equal(pocket.snapshot().phase, "warning");
  assert.equal(stability.snapshot().stability, 100);
  step(1 / hz, start);
  assert.equal(pocket.snapshot().phase, "active");
  assert.equal(stability.snapshot().stability, 80);
  const insideEdge = { x: start.x + start.radius + 10, y: start.y };
  step(0, insideEdge); step(0, start);
  assert.equal(stability.snapshot().stability, 80, "head must fully separate");
  step(0, { x: -1000, y: -1000 }); step(0, start);
  assert.equal(stability.snapshot().stability, 60);
  for (let i = 0; i < hz * 4 - 1; i++) step(1 / hz, start);
  assert.equal(pocket.snapshot().phase, "active");
  assert.equal(stability.snapshot().stability, 60);
  step(1 / hz, start);
  assert.equal(pocket.snapshot().phase, "cooldown");
  for (let i = 0; i < hz * 5 - 1; i++) step(1 / hz);
  assert.equal(pocket.snapshot().phase, "cooldown");
  step(1 / hz);
  assert.equal(pocket.snapshot().phase, "warning");
  assert.equal(pocket.snapshot().generation, 2);
  assert.equal(stability.snapshot().stability, 60);
  pocket.revalidate(500, 180, head, []);
  assert.equal(pocket.snapshot().phase, "warning", "relocation gives a fresh warning");

  const initial = snapshot(globalThis.probe), p = globalThis.probe;
  for (let i = 0; i < 25; i++) p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
  frame(); frame(); assert.equal(p.pocket.snapshot().phase, "inactive");
  p.portal.update(p.portal.snapshot()); frame();
  assert.equal(p.pocket.snapshot().phase, "warning");
  const freeze = () => {
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const before = p.pocket.snapshot();
    for (let i = 0; i < hz * 3; i++) frame();
    assert.deepEqual(p.pocket.snapshot(), before);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.deepEqual(p.pocket.snapshot(), before);
  };
  freeze();
  // Isolate the cycle from trajectory/contact while exercising the real runtime suspension.
  p.pocket.update(1, "zone-2", 940, 392, { x: -1000, y: -1000 });
  assert.equal(p.pocket.snapshot().phase, "active"); freeze();
  p.pocket.update(4, "zone-2", 940, 392, { x: -1000, y: -1000 });
  assert.equal(p.pocket.snapshot().phase, "cooldown"); freeze();
  p.pocket.update(5, "zone-2", 940, 392, p.movement.snapshot());
  p.pocket.update(1, "zone-2", 940, 392, { x: -1000, y: -1000 });
  const location = p.pocket.snapshot();
  const beforeOther = { score: p.score.snapshot(), progression: p.progression.snapshot(), combo: p.combo.snapshot() };
  while (p.stability.snapshot().stability > 0) {
    p.pocket.update(0, "zone-2", 940, 392, { x: -1000, y: -1000 });
    p.pocket.update(0, "zone-2", 940, 392, location);
  }
  assert.equal(getRuntimeState().gameOver, true);
  assert.equal(p.stability.snapshot().stability, 0);
  assert.deepEqual(p.score.snapshot(), beforeOther.score);
  assert.deepEqual(p.progression.snapshot(), beforeOther.progression);
  frame();
  const dead = p.pocket.snapshot();
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.pocket.snapshot(), dead);
  p.stabilityDisplay.gameOverElement.children[2].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
  app.children.find(e => e.className === "return-menu").emit("click");
  assert.equal(globalThis.probe.pocket.snapshot().phase, "inactive");
  app.children.find(e => e.className === "main-menu").children[1].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
}
if (!process.env.NYR_POCKET_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_POCKET_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 37 corruption pocket: tests OK");
}
