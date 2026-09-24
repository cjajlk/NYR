import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { endGame } from "../../src/core/runtimeState.js";

function fixture() {
  let hits = 0;
  const f = createFragmentSystem({ random: () => 0.4, getCurrentZone: () => "zone-2",
    onPureAbsorbed() {}, onCorruptionContact() { hits++; } });
  f.initialize(940, 392, { x: 470, y: 196, trail: [] });
  const absorb = () => f.update({ ...f.snapshot()[0], trail: [] }, 940, 392);
  for (let i = 0; i < 35; i++) absorb();
  return { f, absorb, hits: () => hits };
}
const danger = f => f.snapshot().find(v => v.kind === "corruption");
export function verifyMotion({ app, frame, snapshot, hz, setBounds }) {
  const { f, absorb, hits } = fixture();
  const anchor = danger(f);
  assert.equal(anchor.x, anchor.anchorX); assert.equal(anchor.y, anchor.anchorY);
  const pure = f.snapshot().find(v => v.kind === "pure");
  for (let i = 0; i < hz * 8; i++) {
    f.advanceCorruption(1 / hz, 940, 392);
    const d = danger(f);
    assert.ok(Math.abs(d.x - d.anchorX) <= 40 + 1e-9);
    assert.ok(Math.abs(d.y - d.anchorY) <= 20 + 1e-9);
    assert.ok(d.x >= 48 && d.x <= 892 && d.y >= 48 && d.y <= 344);
    f.update({ ...d, trail: [] }, 940, 392);
  }
  assert.equal(hits(), 1, "continuous moving contact has one hit");
  f.update({ x: -1000, y: -1000, trail: [] }, 940, 392);
  f.update({ ...danger(f), trail: [] }, 940, 392);
  assert.equal(hits(), 2);
  assert.deepEqual(f.snapshot().find(v => v.kind === "pure"), pure);
  for (let i = 0; i < 10; i++) absorb();
  assert.equal(danger(f).generation, 45);
  assert.equal(danger(f).motionTime, 0);
  assert.equal(danger(f).x, danger(f).anchorX);
  const reference = fixture().f;
  reference.advanceCorruption(0.5, 940, 392);
  const other = fixture().f;
  for (let i = 0; i < hz / 2; i++) other.advanceCorruption(1 / hz, 940, 392);
  assert.ok(Math.abs(danger(reference).x - danger(other).x) < 1e-8);
  assert.ok(Math.abs(danger(reference).y - danger(other).y) < 1e-8);

  const initial = snapshot(globalThis.probe), p = globalThis.probe;
  for (let i = 0; i < 35; i++) { p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    if (p.portal.snapshot().active) p.portal.update(p.portal.snapshot()); }
  frame(); frame();
  const before = danger(p.fragmentSystem);
  frame(); assert.notEqual(danger(p.fragmentSystem).x, before.x);
  window.innerWidth = 440; window.innerHeight = 956;
  setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
  const frozen = danger(p.fragmentSystem);
  for (let i = 0; i < hz * 10; i++) frame();
  assert.deepEqual(danger(p.fragmentSystem), frozen);
  window.innerWidth = 956; window.innerHeight = 440;
  setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
  assert.deepEqual(danger(p.fragmentSystem), frozen);
  frame(); frame();
  assert.ok(Math.abs(danger(p.fragmentSystem).x - frozen.x) < 5);
  endGame(); frame();
  const dead = danger(p.fragmentSystem);
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(danger(p.fragmentSystem), dead);
  app.children.find(e => e.className === "return-menu").emit("click");
  assert.equal(danger(globalThis.probe.fragmentSystem), undefined);
  app.children.find(e => e.className === "main-menu").children[1].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
}
if (!process.env.NYR_CORRUPTION_MOTION_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_CORRUPTION_MOTION_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 35 corruption motion: tests OK");
}
