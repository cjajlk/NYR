import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createVoidDifficulty } from "../../src/gameplay/voidDifficulty.js";
import { createCorruptionPocket } from "../../src/gameplay/corruptionPocket.js";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { endGame, getRuntimeState } from "../../src/core/runtimeState.js";
export function verifyVoid({ app, frame, snapshot, hz, setBounds }) {
  const difficulty = createVoidDifficulty();
  difficulty.sync(999); assert.equal(difficulty.snapshot().level, null);
  difficulty.enter(1000);
  const speeds = [109.25, 113, 117, 121, 125, 129];
  const cooldowns = [4, 3.7, 3.4, 3.1, 2.8, 2.5];
  for (const time of [0, 59.99, 60, 119.99, 120, 179.99, 180, 239.99, 240, 299.99, 300, 600, 1200]) {
    const level = Math.min(5, Math.floor(time / 60));
    const state = difficulty.sync(1000 + time);
    assert.equal(state.level, level);
    assert.equal(state.speed, speeds[level]);
    assert.equal(state.pocketCooldown, cooldowns[level]);
    assert.equal(state.corruptionInterval, 10 - level);
  }
  for (let i = 0; i <= hz * 601; i++) {
    const state = difficulty.sync(1000 + i / hz);
    assert.equal(state.level, Math.min(5, Math.floor(i / hz / 60)));
  }
  const pocket = createCorruptionPocket(() => {});
  const step = (delta, cooldown) => pocket.update(delta, "zone-4", 940, 392, { x: -1000, y: -1000 }, [], cooldown);
  step(0, 4); step(1, 4); step(4, 4);
  assert.equal(pocket.snapshot().phase, "cooldown");
  step(1, 2.5); assert.equal(pocket.snapshot().remaining, 3);
  step(3, 2.5); assert.equal(pocket.snapshot().phase, "warning");
  step(1, 2.5); step(4, 2.5);
  assert.equal(pocket.snapshot().remaining, 2.5);
  let interval = 10;
  const fragments = createFragmentSystem({ random: () => 0.4, getCurrentZone: () => "zone-4",
    getVoidCorruptionInterval: () => interval, onCorruptionContact: () => true, onPureAbsorbed() {} });
  fragments.initialize(940, 392, { x: 0, y: 0, trail: [] }); fragments.enterVoid();
  for (let i = 1; i <= 25; i++) {
    if (i === 5) interval = 9;
    if (i === 11) interval = 5;
    fragments.update({ ...fragments.snapshot()[0], trail: [] }, 940, 392);
    const corruption = fragments.snapshot().filter(f => f.kind === "corruption");
    assert.equal(corruption.length, i < 10 ? 0 : 1);
    if (i >= 10) assert.equal(corruption[0].generation, i < 19 ? 10 : i < 24 ? 19 : 24);
    assert.equal(fragments.snapshot().filter(f => f.kind === "pure").length, i < 10 ? 0 : 1);
  }
  const initial = snapshot(globalThis.probe);
  for (const menu of [false, true]) {
    const p = globalThis.probe;
    frame(); frame();
    assert.equal(p.voidDifficulty.snapshot().level, null);
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 0; i < 27; i++) normal(); p.portal.update(p.portal.snapshot());
    for (let i = 0; i < 15; i++) normal(); p.exitPortal.update(p.exitPortal.snapshot());
    for (let i = 0; i < 20; i++) normal();
    const entry = p.movement.snapshot().simulationTime;
    p.zoneThreePortal.update(p.zoneThreePortal.snapshot());
    assert.equal(p.voidDifficulty.snapshot().entryTime, entry);
    assert.equal(p.voidDifficulty.snapshot().elapsed, 0);
    for (let i = 62; i < 500; i++) normal();
    assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 500);
    assert.equal(p.progression.snapshot().currentForm, "devoreur");
    assert.equal(p.movement.snapshot().segmentCount, 120);
    assert.ok(p.score.snapshot().points > 100000);
    assert.equal(p.voidDifficulty.snapshot().level, 0, "absorptions cannot raise difficulty");
    assert.equal(getRuntimeState().phase, "PLAYING");
    assert.equal(getRuntimeState().journeyComplete, false);
    assert.equal(p.zoneThreePortal.snapshot().active, false);
    // Advance the existing simulation clock without combat to exercise the runtime wiring at N5.
    p.movement.update(600, 1000000, 392, 1);
    p.movement.fitViewport(940, 392);
    frame();
    assert.equal(p.voidDifficulty.snapshot().level, 5);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const frozen = snapshot(p); for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), frozen);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.deepEqual(snapshot(p), frozen);
    endGame(); frame(); const dead = snapshot(p);
    for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), dead);
    if (menu) {
      globalThis.quitToMenu();
      const idle = snapshot(globalThis.probe); for (let i = 0; i < hz; i++) frame();
      assert.deepEqual(snapshot(globalThis.probe), idle);
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
  }
}
if (!process.env.NYR_VOID_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_VOID_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 44 Void survival: tests OK");
}
