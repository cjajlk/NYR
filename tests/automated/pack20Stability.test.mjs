import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import {
  createNyrStability,
  NYR_STABILITY_CONFIG
} from "../../src/gameplay/nyrStability.js";
import { createNyrZoneProgression } from "../../src/gameplay/nyrZoneProgression.js";
import { createZoneBackgroundTransition } from "../../src/core/zoneBackgroundTransition.js";

function createReadyImage() {
  const listeners = new Map();
  return {
    naturalWidth: 1672,
    naturalHeight: 941,
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    set src(value) {
      this.loadedSource = value;
      listeners.get("load")?.();
    }
  };
}

assert.equal(NYR_STABILITY_CONFIG.initial, 100);
assert.equal(NYR_STABILITY_CONFIG.maximum, 100);
assert.ok(Object.isFrozen(NYR_STABILITY_CONFIG));

for (const refreshRate of [30, 60, 120]) {
  for (const dpr of [1, 2]) {
    const stability = createNyrStability();
    const score = createNyrScore();
    const progression = createNyrProgression();
    const transition = createZoneBackgroundTransition({
      zoneOneBackground: { render: () => ({ mode: "image" }) },
      createImage: createReadyImage
    });
    const zoneProgression = createNyrZoneProgression({
      onZoneTwoReached(zoneState) {
        transition.sync(zoneState);
      }
    });

    assert.deepEqual(Object.keys(stability), ["snapshot", "applyAsteroidContact", "applyPureFragment"]);
    assert.deepEqual(stability.snapshot(), { stability: 100 });

    for (let absorption = 1; absorption <= 26; absorption += 1) {
      const progressionState = progression.recordNormalFragmentAbsorption();
      zoneProgression.sync(progressionState);
      score.awardNormalFragment();

      if (absorption === 25) {
        for (let frame = 0; frame < refreshRate / 2; frame += 1) {
          transition.update(1 / refreshRate);
        }
        assert.equal(stability.snapshot().stability, 100);

        const frozenTransition = transition.snapshot();
        const frozenStability = stability.snapshot();
        for (let portraitFrame = 0; portraitFrame < refreshRate * 3; portraitFrame += 1) {
          stability.snapshot();
        }
        assert.deepEqual(transition.snapshot(), frozenTransition, `${refreshRate} Hz DPR ${dpr}`);
        assert.deepEqual(stability.snapshot(), frozenStability, `${refreshRate} Hz DPR ${dpr}`);

        for (let frame = 0; frame < refreshRate / 2; frame += 1) {
          transition.update(1 / refreshRate);
        }
        assert.equal(transition.snapshot().progress, 1);
        assert.equal(stability.snapshot().stability, 100);
      }

      if ([1, 20, 24, 25, 26].includes(absorption)) {
        assert.equal(stability.snapshot().stability, 100);
      }
    }

    assert.equal(score.snapshot().points, 2600);
    assert.equal(progression.snapshot().currentForm, "spectre");
    assert.equal(zoneProgression.snapshot().currentZone, "zone-2");
    assert.equal(stability.snapshot().stability, 100);
  }
}

const stabilitySource = await readFile(
  new URL("../../src/gameplay/nyrStability.js", import.meta.url),
  "utf8"
);
const mainSource = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../../index.html", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../../assets/css/main.css", import.meta.url), "utf8");
const scoreDisplaySource = await readFile(
  new URL("../../src/ui/scoreDisplay.js", import.meta.url),
  "utf8"
);

assert.match(mainSource, /const stability = createNyrStability\(\)/);
// PACK 22 adds asteroid damage; the no-contact foundation stays unchanged.
assert.doesNotMatch(stabilitySource, /heal|recover|gameOver/);
assert.doesNotMatch([indexSource, cssSource, scoreDisplaySource].join("\n"), /stabilit/i);
assert.doesNotMatch([stabilitySource, mainSource].join("\n"), /https?:\/\/|file:\/\//);

console.log("PACK 20 stability foundation: tests OK");
