import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState } from "../../src/core/runtimeState.js";

export function verifyActionRuntime({ app, frame, hz }) {
  const menu = () => app.children.find(e => e.className === "main-menu");
  menu().children[1].emit("click"); // Harness selects unlocked Infinite mode.
  let p = globalThis.probe;
  const options = { zone: "zone-1", width: 940, height: 392, head: { x: 400, y: 196 } };
  const step = (n, head = options.head) => { for (let i = 0; i < n; i++) p.actionEvents.update(0.01, { ...options, head }); };
  step(7501); assert.equal(p.actionEvents.snapshot().event.phase, "warning");
  frame(); // Establish actual display baseline.
  app.children.find(e => e.className === "return-menu").emit("click");
  const paused = p.actionEvents.snapshot(); for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.actionEvents.snapshot(), paused, "real pause freezes new events");
  app.children.find(e => e.className === "pause-overlay").children[1].emit("click");
  step(151); let meteor = p.actionEvents.snapshot().event.meteors[0];
  const before = p.stability.snapshot().stability;
  step(1, { x: meteor.x + meteor.vx * 0.01, y: meteor.y + meteor.vy * 0.01 });
  assert.equal(p.stability.snapshot().stability, before - 25);
  assert.equal(p.runStatistics.snapshot().damageEvents, 1);
  assert.equal(p.runStatistics.snapshot().stabilityLost, 25);
  p.actionEvents.reset("zone-1"); step(7501); step(151);
  meteor = p.actionEvents.snapshot().event.meteors[0];
  const beforeScore = p.score.snapshot().points;
  const beforeCombo = p.combo.snapshot();
  step(1, { x: meteor.x + meteor.vx * 0.01 + (meteor.vy ? 40 : 0), y: meteor.y + meteor.vy * 0.01 + (meteor.vx ? 40 : 0) });
  step(2000, { x: 10000, y: 10000 });
  assert.equal(p.score.snapshot().points, beforeScore + 100);
  assert.deepEqual(p.combo.snapshot(), beforeCombo, "dodge never multiplies or changes combo");
  p.actionEvents.reset("zone-1"); step(7501);
  for (let i = 0; i < 25; i++) p.progression.recordNormalFragmentAbsorption();
  p.portal.unlock(25, 940, 392, p.movement.snapshot(), [], null);
  p.portal.update(p.portal.snapshot());
  assert.equal(p.actionEvents.snapshot().event, null, "actual portal callback clears events");
  // Quit/restart clears events and uses a fresh manager.
  app.children.find(e => e.className === "return-menu").emit("click");
  app.children.find(e => e.className === "pause-overlay").children[2].emit("click");
  assert.equal(p.actionEvents.snapshot().event, null);
  menu().children[1].emit("click");
  assert.notEqual(globalThis.probe.actionEvents, p.actionEvents);
  assert.equal(globalThis.probe.actionEvents.snapshot().event, null);
  p = globalThis.probe;
  for (let i = 0; i < 4; i++) {
    p.actionEvents.reset("zone-1"); step(7501); step(151);
    meteor = p.actionEvents.snapshot().event.meteors[0];
    step(1, { x: meteor.x + meteor.vx * 0.01, y: meteor.y + meteor.vy * 0.01 });
  }
  assert.equal(getRuntimeState().gameOver, true);
  assert.equal(p.actionEvents.snapshot().event, null, "fatal damage clears event inside callback");
  assert.equal(p.stability.snapshot().stability, 0);
  frame(); p.stabilityDisplay.gameOverElement.children[2].emit("click");
  assert.equal(globalThis.probe.stability.snapshot().stability, 100);
  assert.equal(globalThis.probe.actionEvents.snapshot().event, null);
}
if (!process.env.NYR_ACTION_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_ACTION_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("Action runtime: real main callbacks, score, damage statistics, pause and session cleanup OK");
}
