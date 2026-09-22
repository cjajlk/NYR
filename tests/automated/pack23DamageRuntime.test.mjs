import assert from "node:assert/strict";
import { createGameLoop } from "../../src/core/gameLoop.js";
import { isRuntimeActive, suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";
import { createMobileAsteroidSystem } from "../../src/gameplay/mobileAsteroidSystem.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";

// Exercise the real scheduling/suspension path, rather than gating update in the test.
for (const [width, height] of [[1366, 768], [844, 390]]) {
  for (const hz of [30, 60, 120]) {
    const stability = createNyrStability();
    let contacts = 0;
    const asteroid = createMobileAsteroidSystem({
      random: () => 0.1,
      onHeadContactStarted() { contacts++; stability.applyAsteroidContact(); }
    });
    const distantHead = { x: width / 2, y: height / 2 };
    asteroid.syncZone({ currentZone: "zone-2" }, width, height, distantHead);
    let touching = false;
    let updates = 0;
    let timestamp = 0;
    const callbacks = [];
    const loop = createGameLoop({
      isActive: isRuntimeActive,
      requestFrame: callback => callbacks.push(callback),
      render() {},
      update(delta) {
        updates++;
        const before = asteroid.snapshot();
        const head = touching ? {
          x: before.x + before.velocityX * delta,
          y: before.y + before.velocityY * delta
        } : distantHead;
        asteroid.update(delta, width, height, head);
      }
    });
    const frame = (elapsed = 1000 / hz) => {
      timestamp += elapsed;
      assert.equal(callbacks.length, 1, "one scheduled frame");
      callbacks.shift()(timestamp);
    };
    try {
      loop.start();
      frame();
      for (let i = 0; i < hz * 3; i++) frame();
      assert.equal(stability.snapshot().stability, 100, "no collision means no damage");
      touching = true;
      frame();
      assert.equal(stability.snapshot().stability, 75);
      for (let i = 0; i < hz * 2; i++) frame();
      assert.equal(contacts, 1, "continuous contact emits one damage event");

      const pausedAsteroid = asteroid.snapshot();
      const pausedStability = stability.snapshot();
      const pausedUpdates = updates;
      suspendRuntime("portrait-orientation");
      touching = false;
      for (let i = 0; i < hz * 2; i++) frame();
      assert.equal(updates, pausedUpdates, "portrait prevents real loop updates");
      assert.deepEqual(asteroid.snapshot(), pausedAsteroid);
      assert.deepEqual(stability.snapshot(), pausedStability);
      touching = true;
      resumeRuntime("portrait-orientation");
      frame(10000);
      assert.equal(updates, pausedUpdates, "resume establishes baseline without catch-up");
      frame();
      assert.equal(contacts, 1, "pause does not rearm an existing contact");
      assert.equal(stability.snapshot().stability, 75);

      for (const expected of [50, 25, 0, 0]) {
        touching = false;
        frame();
        touching = true;
        frame();
        assert.equal(stability.snapshot().stability, expected);
      }
      assert.equal(contacts, 5);
      const atZero = asteroid.snapshot();
      frame();
      assert.notEqual(asteroid.snapshot().x, atZero.x, "zero stability does not add game over");
      assert.equal(stability.snapshot().stability, 0);
    } finally {
      resumeRuntime("portrait-orientation");
      loop.stop();
      callbacks.shift()?.(timestamp + 1000);
      assert.equal(callbacks.length, 0, "stopped loop does not schedule another frame");
    }
  }
}
console.log("PACK 23 damage through runtime loop: tests OK");
