import assert from "node:assert/strict";
import { MAX_VISIBLE_SEGMENTS, NYR_PROTOTYPE_CONFIG } from "../../src/gameplay/nyrPrototypeConfig.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";

assert.equal(MAX_VISIBLE_SEGMENTS, 120);
const movement = createNyrMovement();
movement.reset(956, 440);
assert.equal(movement.snapshot().segmentCount, NYR_PROTOTYPE_CONFIG.initialSegmentCount);
movement.addSegments(119 - movement.snapshot().segmentCount);
assert.equal(movement.snapshot().segmentCount, 119);
assert.equal(movement.addSegments(), 120);
const capped = movement.snapshot();
assert.equal(movement.addSegments(), 120);
assert.equal(movement.addSegments(1000), 120);
assert.deepEqual(movement.snapshot(), capped, "growth at cap changes neither body nor movement history");

const progression = createNyrProgression();
const score = createNyrScore();
let absorbed = 0;
const fragments = createFragmentSystem({ random: () => 0.4, onAbsorbed() {
  absorbed++;
  movement.addSegments(1);
  progression.recordNormalFragmentAbsorption();
  score.awardNormalFragment();
} });
fragments.initialize(956, 440, movement.snapshot());
for (let i = 1; i <= 200; i++) {
  // Exercise the real absorption and respawn, placing the test head at a fragment.
  const target = fragments.snapshot()[0];
  fragments.update({ ...movement.snapshot(), x: target.x, y: target.y }, 956, 440);
  assert.equal(absorbed, i);
  assert.equal(movement.snapshot().segmentCount, 120);
  assert.equal(progression.snapshot().normalFragmentsAbsorbed, i);
  assert.equal(score.snapshot().points, i * 100);
  assert.equal(progression.snapshot().currentForm, i < 50 ? "eclat" : i < 150 ? "spectre" : i < 300 ? "nocturne" : "devoreur");
  assert.notDeepEqual(fragments.snapshot()[0], target, "absorbed fragment respawns after the body cap");
}

for (const hz of [30, 60, 120]) {
  const runner = createNyrMovement();
  runner.reset(100000, 1000);
  runner.addSegments(1000);
  const limit = Math.ceil((MAX_VISIBLE_SEGMENTS * NYR_PROTOTYPE_CONFIG.segmentSpacingPixels +
    NYR_PROTOTYPE_CONFIG.trailSafetyMarginPixels) / NYR_PROTOTYPE_CONFIG.trailSampleSpacingPixels) + 3;
  let matureLength = 0;
  for (let frame = 1; frame <= hz * 60; frame++) {
    runner.addSegments();
    runner.update(1 / hz, 100000, 1000);
    const state = runner.snapshot();
    assert.equal(state.segmentCount, 120);
    assert.ok(state.trail.length <= limit, `${hz} Hz: bounded history despite continued growth requests`);
    if (frame === hz * 30) matureLength = state.trail.length;
  }
  assert.ok(Math.abs(runner.snapshot().trail.length - matureLength) <= 1,
    "history no longer grows after reaching the useful body length");
}
console.log("PACK 26 visible segment cap: tests OK");
