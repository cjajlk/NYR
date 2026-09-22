import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createMobileAsteroidSystem } from "../../src/gameplay/mobileAsteroidSystem.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { isRuntimeActive, suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";

for (const [width, height] of [[1366, 768], [844, 390]]) {
  for (const hz of [30, 60, 120]) {
    const stability = createNyrStability();
    const initialSnapshot = stability.snapshot();
    const score = createNyrScore();
    const progression = createNyrProgression();
    score.awardNormalFragment();
    progression.recordNormalFragmentAbsorption();
    const initialScore = score.snapshot();
    const initialProgression = progression.snapshot();
    const asteroid = createMobileAsteroidSystem({
      random: () => 0.1,
      onHeadContactStarted: () => stability.applyAsteroidContact()
    });
    const distantHead = { x: width / 2, y: height / 2, trail: [] };
    asteroid.syncZone({ currentZone: "zone-1" }, width, height, distantHead);
    asteroid.update(1, width, height, { x: 0, y: 0 });
    assert.equal(stability.snapshot().stability, 100);
    asteroid.syncZone({ currentZone: "zone-2" }, width, height, distantHead);
    // Bring the asteroid inside the playfield before arranging a contact.
    for (let frame = 0; frame < hz * 3; frame++) {
      asteroid.update(1 / hz, width, height, distantHead);
    }
    assert.equal(stability.snapshot().stability, 100);
    const contact = () => asteroid.update(0, width, height, asteroid.snapshot());
    const separate = () => asteroid.update(0, width, height, {
      ...distantHead, trail: [asteroid.snapshot()]
    });
    contact();
    assert.equal(stability.snapshot().stability, 75);
    for (let frame = 0; frame < hz * 3; frame++) {
      const state = asteroid.snapshot();
      asteroid.update(1 / hz, width, height, {
        x: state.x + state.velocityX / hz,
        y: state.y + state.velocityY / hz
      });
    }
    assert.equal(stability.snapshot().stability, 75, "continuous contact damages once");
    const beforePause = asteroid.snapshot();
    suspendRuntime("portrait-orientation");
    for (let frame = 0; frame < hz * 3; frame++) {
      if (isRuntimeActive()) separate();
    }
    assert.deepEqual(asteroid.snapshot(), beforePause);
    assert.equal(stability.snapshot().stability, 75);
    resumeRuntime("portrait-orientation");
    contact();
    assert.equal(stability.snapshot().stability, 75, "resume does not rearm contact");
    for (const expected of [50, 25, 0, 0]) {
      separate();
      const before = stability.snapshot();
      asteroid.revalidate(width, height, distantHead);
      assert.deepEqual(stability.snapshot(), before, "body-only contact and resize do no damage");
      contact();
      assert.equal(stability.snapshot().stability, expected);
    }
    assert.deepEqual(initialSnapshot, { stability: 100 }, "old snapshots stay immutable");
    assert.ok(Object.isFrozen(stability.snapshot()));
    assert.deepEqual(score.snapshot(), initialScore);
    assert.deepEqual(progression.snapshot(), initialProgression);
  }
}

const partial = createNyrStability({ initial: 10, maximum: 100 });
assert.equal(partial.applyAsteroidContact().stability, 0);
const main = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
assert.match(main, /createMobileAsteroidSystem\(\{\s*onHeadContactStarted\(\)\s*\{\s*stability\.applyAsteroidContact\(\);/);
assert.ok(main.indexOf("const stability =") < main.indexOf("const mobileAsteroid ="));
console.log("PACK 22 asteroid damage: tests OK");
