import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createFragmentSystem, PURE_FRAGMENT_INTERVAL } from "../../src/gameplay/fragmentSystem.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrZoneProgression } from "../../src/gameplay/nyrZoneProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createGameLoop } from "../../src/core/gameLoop.js";
import { endGame, getRuntimeState, isRuntimeActive, suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";

const hz = Number(process.argv[2]);
if (!hz) {
  assert.equal(PURE_FRAGMENT_INTERVAL, 10);
  for (const [initial, expected] of [[25, 45], [75, 95], [90, 100], [100, 100], [0, 0]]) {
    const stability = createNyrStability({ initial, maximum: 100 });
    assert.equal(stability.applyPureFragment().stability, expected);
  }
  const main = readFileSync(new URL("../../src/main.js", import.meta.url), "utf8");
  assert.match(main, /onPureAbsorbed\(\)\s*\{\s*if \(isRuntimeActive\(\)\) stability\.applyPureFragment\(\);\s*\}/);
  for (const rate of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(rate)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 27 pure fragment: tests OK");
} else {
  const movement = createNyrMovement(); movement.reset(956, 440);
  const stability = createNyrStability({ initial: 25, maximum: 100 });
  const progression = createNyrProgression(), zone = createNyrZoneProgression(), score = createNyrScore();
  let pureAbsorptions = 0, randomCalls = 0;
  const fragments = createFragmentSystem({ random: () => { randomCalls++; return 0.4; },
    onAbsorbed() { movement.addSegments(); zone.sync(progression.recordNormalFragmentAbsorption(), true); score.awardNormalFragment(); },
    onPureAbsorbed() { if (isRuntimeActive()) { pureAbsorptions++; stability.applyPureFragment(); } }
  });
  fragments.initialize(956, 440, movement.snapshot());
  const pure = () => fragments.snapshot().find(item => item.kind === "pure");
  let head = movement.snapshot(), timestamp = 0;
  const queue = [];
  const loop = createGameLoop({ isActive: isRuntimeActive, requestFrame: fn => queue.push(fn), render() {},
    update() { fragments.update(head, 956, 440); }
  });
  const frame = () => { timestamp += 1000 / hz; queue.shift()(timestamp); };
  const collectNormal = () => { head = { ...fragments.snapshot()[0], trail: [] }; frame(); };
  const progressionSnapshot = () => ({ movement: movement.snapshot(), progression: progression.snapshot(), zone: zone.snapshot(), score: score.snapshot() });
  loop.start(); frame();
  for (let i = 1; i <= 9; i++) { collectNormal(); assert.equal(pure(), undefined); }
  collectNormal(); assert.ok(pure());
  assert.equal(progression.snapshot().normalFragmentsAbsorbed, 10);
  const before = progressionSnapshot();
  head = { ...pure(), trail: [] };
  const pausedFragments = fragments.snapshot();
  suspendRuntime("portrait-orientation");
  for (let i = 0; i < hz; i++) frame();
  assert.equal(stability.snapshot().stability, 25);
  assert.deepEqual(fragments.snapshot(), pausedFragments);
  resumeRuntime("portrait-orientation"); frame();
  assert.equal(pureAbsorptions, 0, "resume baseline cannot absorb");
  const callsBeforePure = randomCalls;
  frame();
  assert.equal(randomCalls, callsBeforePure, "pure consumption needs no random spawn");
  assert.equal(pureAbsorptions, 1);
  assert.equal(stability.snapshot().stability, 45);
  assert.equal(pure(), undefined);
  assert.deepEqual(progressionSnapshot(), before);
  for (let i = 11; i <= 19; i++) { collectNormal(); assert.equal(pure(), undefined); }
  collectNormal(); assert.ok(pure());
  for (let i = 21; i <= 30; i++) collectNormal();
  assert.equal(fragments.snapshot().filter(item => item.kind === "pure").length, 1, "one reusable pure slot, no unbounded backlog");
  const oldPure = pure();
  fragments.translate({ x: 3, y: 4 });
  assert.deepEqual(pure(), { ...oldPure, x: oldPure.x + 3, y: oldPure.y + 4 });
  head = { ...pure(), trail: [] };
  while (stability.snapshot().stability > 0) stability.applyAsteroidContact();
  endGame();
  const ended = fragments.snapshot();
  for (let i = 0; i < hz; i++) frame();
  stability.applyPureFragment();
  resumeRuntime("portrait-orientation");
  assert.equal(getRuntimeState().gameOver, true);
  assert.equal(stability.snapshot().stability, 0);
  assert.deepEqual(fragments.snapshot(), ended);
  assert.equal(pureAbsorptions, 1);
  loop.stop(); frame();
}
