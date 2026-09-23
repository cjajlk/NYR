import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrZoneProgression } from "../../src/gameplay/nyrZoneProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createGameLoop } from "../../src/core/gameLoop.js";
import { endGame, getRuntimeState, isRuntimeActive, suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";

const hz = Number(process.argv[2]);
if (!hz) {
  const partial = createNyrStability({ initial: 10, maximum: 100 });
  assert.equal(partial.applyCorruptionContact().stability, 0);
  assert.equal(partial.applyCorruptionContact().stability, 0);
  const main = readFileSync(new URL("../../src/main.js", import.meta.url), "utf8");
  assert.match(main, /getCurrentZone: \(\) => zoneProgression.snapshot\(\).currentZone/);
  assert.match(main, /stability.applyCorruptionContact\(\);\s*if \(stability.snapshot\(\).stability === 0\) endGame\(\);\s*return isRuntimeActive\(\)/);
  assert.match(main, /fragmentSystem.update\([^;]+;\s*if \(!isRuntimeActive\(\)\) return;\s*mobileAsteroid.update/);
  for (const rate of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(rate)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 28 corruption: tests OK");
} else {
  const movement = createNyrMovement(); movement.reset(956, 440);
  const stability = createNyrStability(), progression = createNyrProgression();
  const zone = createNyrZoneProgression(), score = createNyrScore();
  let contacts = 0, pureAbsorptions = 0;
  const system = createFragmentSystem({ random: () => 0.4,
    getCurrentZone: () => zone.snapshot().currentZone,
    onAbsorbed() { movement.addSegments(); zone.sync(progression.recordNormalFragmentAbsorption()); score.awardNormalFragment(); },
    onPureAbsorbed() { pureAbsorptions++; stability.applyPureFragment(); },
    onCorruptionContact() {
      contacts++; stability.applyCorruptionContact();
      if (stability.snapshot().stability === 0) endGame();
      return isRuntimeActive();
    }
  });
  system.initialize(956, 440, movement.snapshot());
  const corruption = () => system.snapshot().find(item => item.kind === "corruption");
  const pure = () => system.snapshot().find(item => item.kind === "pure");
  let head = movement.snapshot(), timestamp = 0;
  const queue = [];
  const loop = createGameLoop({ isActive: isRuntimeActive, requestFrame: fn => queue.push(fn), render() {},
    update() { system.update(head, 956, 440); }
  });
  const frame = () => { timestamp += 1000 / hz; queue.shift()(timestamp); };
  const at = point => { head = { ...point, trail: [] }; };
  const normal = () => { at(system.snapshot()[0]); frame(); };
  const progress = () => ({ movement: movement.snapshot(), score: score.snapshot(), progression: progression.snapshot(), zone: zone.snapshot() });
  loop.start(); frame();
  for (let i = 1; i < 35; i++) { normal(); assert.equal(corruption(), undefined); }
  normal(); assert.equal(corruption().generation, 35);
  const before = progress(), existingPure = pure();
  at(corruption()); frame();
  assert.equal(stability.snapshot().stability, 80);
  for (let i = 0; i < hz * 2; i++) frame();
  assert.equal(contacts, 1);
  assert.deepEqual(progress(), before);
  assert.deepEqual(pure(), existingPure);
  assert.equal(pureAbsorptions, 0);
  suspendRuntime("portrait-orientation");
  const paused = system.snapshot();
  at({ x: -1000, y: -1000 });
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(system.snapshot(), paused);
  at(corruption()); resumeRuntime("portrait-orientation"); frame(); frame();
  assert.equal(contacts, 1, "suspension cannot rearm contact");
  at({ x: -1000, y: -1000 }); frame(); at(corruption()); frame();
  assert.equal(stability.snapshot().stability, 60);
  assert.equal(contacts, 2);
  const hazard = { ...corruption(), headContact: false };
  at(pure()); frame();
  assert.equal(stability.snapshot().stability, 80);
  assert.equal(pureAbsorptions, 1);
  assert.deepEqual(progress(), before);
  assert.deepEqual(corruption(), hazard);
  for (let i = 36; i <= 65; i++) {
    normal();
    assert.equal(corruption().generation, 35 + Math.floor((i - 35) / 10) * 10);
    assert.equal(system.snapshot().filter(item => item.kind === "corruption").length, 1);
  }
  assert.equal(progression.snapshot().normalFragmentsAbsorbed, 65);
  assert.equal(score.snapshot().points, 6500);
  const finalProgress = progress();
  while (stability.snapshot().stability > 0) {
    at({ x: -1000, y: -1000 }); frame(); at(corruption()); frame();
  }
  assert.equal(getRuntimeState().gameOver, true);
  const ended = system.snapshot();
  at(pure());
  for (let i = 0; i < hz; i++) frame();
  assert.equal(stability.snapshot().stability, 0);
  assert.deepEqual(progress(), finalProgress);
  assert.deepEqual(system.snapshot(), ended);
  loop.stop(); frame();

  // The threshold alone must not activate the hazard outside Zone 2.
  const outside = createFragmentSystem({ random: () => 0.4, getCurrentZone: () => "zone-1", onCorruptionContact() { throw Error("wrong zone"); } });
  outside.initialize(956, 440, movement.snapshot());
  for (let i = 0; i < 65; i++) outside.update({ ...outside.snapshot()[0], trail: [] }, 956, 440);
  assert.equal(outside.snapshot().some(item => item.kind === "corruption"), false);
}
