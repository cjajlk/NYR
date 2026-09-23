import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createGameLoop } from "../../src/core/gameLoop.js";
import { endGame, getRuntimeState, isRuntimeActive, suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createMobileAsteroidSystem } from "../../src/gameplay/mobileAsteroidSystem.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { createPointerInput } from "../../src/systems/pointerInput.js";

const hz = Number(process.argv[2]);
if (!hz) {
  // Each session has its own irreversible runtime state; no test-only reset API.
  for (const rate of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(rate)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const main = readFileSync(new URL("../../src/main.js", import.meta.url), "utf8");
  assert.match(main, /stability\.applyAsteroidContact\(\);\s*if \(stability\.snapshot\(\).stability === 0\) endGame\(\);/);
  assert.match(main, /isActive: isRuntimeActive/);
  assert.match(main, /if \(isRuntimeActive\(\) && movement\.snapshot\(\).trail.length\)/);
  console.log("PACK 24 irreversible game over: tests OK");
} else {
  const width = 844, height = 390;
  const movement = createNyrMovement();
  movement.reset(width, height);
  const stability = createNyrStability();
  let damageEvents = 0, absorptions = 0, updates = 0, renders = 0;
  const asteroid = createMobileAsteroidSystem({ random: () => 0.1, onHeadContactStarted() {
    damageEvents++;
    stability.applyAsteroidContact();
    if (stability.snapshot().stability === 0) endGame();
  } });
  const fragments = createFragmentSystem({ random: () => 0.4, onAbsorbed() { absorptions++; } });
  fragments.initialize(width, height, movement.snapshot());
  asteroid.syncZone({ currentZone: "zone-2" }, width, height, movement.snapshot());
  let touching = false, collect = false, timestamp = 0;
  const queue = [];
  const loop = createGameLoop({ isActive: isRuntimeActive, requestFrame: fn => queue.push(fn),
    render() { renders++; }, update(delta) {
      updates++;
      movement.update(delta, width, height);
      fragments.update(collect ? { ...fragments.snapshot()[0], trail: [] } : movement.snapshot(), width, height);
      const a = asteroid.snapshot();
      asteroid.update(delta, width, height, touching
        ? { x: a.x + a.velocityX * delta, y: a.y + a.velocityY * delta }
        : { x: width / 2, y: height / 2 });
    }
  });
  const frame = (elapsed = 1000 / hz) => { timestamp += elapsed; assert.equal(queue.length, 1); queue.shift()(timestamp); };
  loop.start(); frame();
  for (let i = 0; i < hz * 3; i++) frame();
  assert.equal(getRuntimeState().gameOver, false);
  assert.equal(isRuntimeActive(), true);
  assert.ok(movement.snapshot().simulationTime > 0);
  collect = true; frame(); collect = false;
  assert.ok(absorptions > 0, "real fragment collection works before game over");
  for (const expected of [75, 50, 25, 0]) {
    touching = false; frame(); touching = true; frame();
    assert.equal(stability.snapshot().stability, expected);
    assert.equal(getRuntimeState().gameOver, expected === 0);
    assert.equal(isRuntimeActive(), expected > 0);
  }
  assert.equal(damageEvents, 4);
  assert.deepEqual(getRuntimeState().suspensionReasons, []);
  const snapshot = () => ({ movement: movement.snapshot(), asteroid: asteroid.snapshot(),
    stability: stability.snapshot(), fragments: fragments.snapshot(), damageEvents, absorptions, updates });
  const frozen = snapshot();
  const handlers = {};
  const input = createPointerInput({ addEventListener: (name, fn) => handlers[name] = fn,
    removeEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) }, movement);
  const event = { pointerType: "touch", pointerId: 1, clientX: 0, clientY: 0, preventDefault() {} };
  handlers.pointerdown(event); handlers.pointermove(event); handlers.pointerup(event);
  handlers.pointermove({ ...event, pointerType: "mouse" });
  collect = true;
  for (const portrait of [false, true, false, true, false]) {
    if (portrait) suspendRuntime("portrait-orientation"); else resumeRuntime("portrait-orientation");
    frame(10000);
    for (let i = 0; i < hz; i++) { touching = !touching; frame(); }
    assert.equal(getRuntimeState().gameOver, true);
    assert.equal(isRuntimeActive(), false);
    assert.deepEqual(snapshot(), frozen, "simulation, contacts, fragments and input stay frozen");
  }
  endGame(); resumeRuntime("game-over");
  assert.equal(isRuntimeActive(), false, "no resume reason can clear game over");
  assert.equal(stability.snapshot().stability, 0);
  assert.ok(renders > updates, "rendering remains available while simulation is frozen");
  input.destroy(); loop.stop(); frame(); assert.equal(queue.length, 0);
}
