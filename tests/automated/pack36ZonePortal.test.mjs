import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createZoneExitPortal, PORTAL_CONFIG } from "../../src/gameplay/zoneExitPortal.js";
import { createNyrZoneProgression } from "../../src/gameplay/nyrZoneProgression.js";
import { endGame } from "../../src/core/runtimeState.js";

export function verifyPortal({ app, frame, snapshot, hz, setBounds }) {
  let entries = 0;
  const head = { x: 470, y: 196, trail: [] };
  const portal = createZoneExitPortal(() => entries++);
  portal.unlock(24, 940, 392, head, []);
  assert.equal(portal.snapshot().active, false);
  portal.unlock(25, 940, 392, head, []);
  const placed = portal.snapshot();
  assert.ok(Math.hypot(placed.x - head.x, placed.y - head.y) >= 140);
  assert.ok(placed.x >= 56 && placed.y >= 56 && placed.x <= 884 && placed.y <= 336);
  const second = createZoneExitPortal(() => {});
  second.unlock(25, 940, 392, head, []);
  assert.deepEqual(second.snapshot(), placed);
  portal.unlock(60, 940, 392, head, []);
  assert.deepEqual(portal.snapshot(), placed);
  portal.update({ x: placed.x + PORTAL_CONFIG.contactRadius + 1, y: placed.y });
  assert.equal(entries, 0);
  portal.update(placed); portal.update(placed);
  assert.equal(entries, 1);
  portal.unlock(100, 940, 392, head, []); assert.equal(portal.snapshot().active, false);
  const zone = createNyrZoneProgression();
  assert.equal(zone.sync({ normalFragmentsAbsorbed: 25 }).currentZone, "zone-1");
  assert.equal(zone.sync({ normalFragmentsAbsorbed: 24 }, true).currentZone, "zone-1");
  assert.equal(zone.sync({ normalFragmentsAbsorbed: 30 }, true).currentZone, "zone-2");

  const initial = snapshot(globalThis.probe), p = globalThis.probe;
  const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
  for (let i = 0; i < 10; i++) normal();
  p.fragmentSystem.update({ ...p.fragmentSystem.snapshot().find(f => f.kind === "pure"), trail: [] }, 940, 392);
  assert.equal(p.portal.snapshot().active, false);
  for (let i = 10; i < 24; i++) normal();
  assert.equal(p.portal.snapshot().active, false);
  normal();
  assert.equal(p.portal.snapshot().active, true);
  const exit = p.portal.snapshot();
  assert.equal(p.zoneProgression.snapshot().currentZone, "zone-1");
  for (let i = 25; i < 32; i++) normal();
  assert.deepEqual(p.portal.snapshot(), exit);
  assert.equal(p.zoneProgression.snapshot().currentZone, "zone-1");
  assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 32);
  assert.equal(p.combo.snapshot().chain, 32);
  assert.equal(p.score.snapshot().points, 11600);
  window.innerWidth = 440; window.innerHeight = 956;
  setBounds({ width: 424, height: 908 }); window.emit("resize");
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.portal.snapshot(), exit);
  assert.equal(p.zoneProgression.snapshot().currentZone, "zone-1");
  window.innerWidth = 956; window.innerHeight = 440;
  setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
  assert.equal(p.zoneProgression.snapshot().currentZone, "zone-1");
  p.stability.applyAsteroidContact();
  const preserved = { stability: p.stability.snapshot(),
    score: p.score.snapshot(), movement: p.movement.snapshot(), progression: p.progression.snapshot() };
  p.portal.update(p.portal.snapshot());
  assert.equal(p.zoneProgression.snapshot().currentZone, "zone-2");
  assert.deepEqual({ stability: p.stability.snapshot(),
    score: p.score.snapshot(), movement: p.movement.snapshot(), progression: p.progression.snapshot() }, preserved);
  assert.deepEqual(p.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
  assert.equal(p.mobileAsteroid.snapshot().active, true);
  for (let i = 32; i < 35; i++) normal();
  assert.equal(p.fragmentSystem.snapshot().find(f => f.kind === "corruption").generation, 35);
  app.children.find(e => e.className === "return-menu").emit("click");
  assert.equal(globalThis.probe.portal.snapshot().active, false);
  app.children.find(e => e.className === "main-menu").children[1].emit("click");
  const fresh = globalThis.probe;
  assert.deepEqual(snapshot(fresh), initial);
  for (let i = 0; i < 25; i++) fresh.fragmentSystem.update({ ...fresh.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
  endGame(); frame();
  const frozen = fresh.portal.snapshot();
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(fresh.portal.snapshot(), frozen);
  assert.equal(fresh.zoneProgression.snapshot().currentZone, "zone-1");
  fresh.stabilityDisplay.gameOverElement.children[2].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
  const walking = globalThis.probe;
  for (let i = 0; i < 25; i++) walking.fragmentSystem.update({ ...walking.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
  const target = walking.portal.snapshot();
  walking.movement.aimAt(target.x, target.y);
  for (let i = 0; i < hz * 20 && walking.zoneProgression.snapshot().currentZone === "zone-1"; i++) { walking.movement.aimAt(target.x, target.y); frame(); }
  assert.equal(walking.zoneProgression.snapshot().currentZone, "zone-2", "real movement enters portal through gameplay loop");
  app.children.find(e => e.className === "return-menu").emit("click");
  app.children.find(e => e.className === "main-menu").children[1].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
}
if (!process.env.NYR_PORTAL_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_PORTAL_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 36 zone portal: tests OK");
}
