import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { formatScore } from "../../src/ui/scoreDisplay.js";
import {
  createNyrZoneProgression,
  NYR_ZONES
} from "../../src/gameplay/nyrZoneProgression.js";

for (const refreshRate of [30, 60, 120]) {
  for (const dpr of [1, 2]) {
    let zoneTwoSignals = 0;
    let spectreSignals = 0;
    const progression = createNyrProgression({
      onSpectreThresholdReached() {
        spectreSignals += 1;
      }
    });
    const zoneProgression = createNyrZoneProgression({
      onZoneTwoReached() {
        zoneTwoSignals += 1;
      }
    });
    const score = createNyrScore();

    assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_1);
    assert.equal(progression.snapshot().normalFragmentsAbsorbed, 0);

    for (let absorption = 1; absorption <= 24; absorption += 1) {
      const progressionState = progression.recordNormalFragmentAbsorption();
      zoneProgression.sync(progressionState, true);
      score.awardNormalFragment();
    }

    assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_1);
    assert.equal(zoneTwoSignals, 0);
    assert.equal(score.snapshot().points, 2400);
    assert.equal(formatScore(score.snapshot()), "SCORE 002400");
    assert.equal(progression.snapshot().currentForm, "spectre");
    assert.equal(spectreSignals, 1);

    const atTwentyFive = progression.recordNormalFragmentAbsorption();
    zoneProgression.sync(atTwentyFive, true);
    score.awardNormalFragment();
    assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_2);
    assert.equal(zoneTwoSignals, 1);
    assert.equal(score.snapshot().points, 2500);
    assert.equal(formatScore(score.snapshot()), "SCORE 002500");

    const atTwentySix = progression.recordNormalFragmentAbsorption();
    zoneProgression.sync(atTwentySix, true);
    score.awardNormalFragment();
    assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_2);
    assert.equal(zoneTwoSignals, 1);
    assert.equal(score.snapshot().points, 2600);
    assert.equal(formatScore(score.snapshot()), "SCORE 002600");

    const frozenZone = zoneProgression.snapshot();
    for (let suspendedFrame = 0; suspendedFrame < refreshRate * 3; suspendedFrame += 1) {
      zoneProgression.snapshot();
    }
    assert.deepEqual(zoneProgression.snapshot(), frozenZone, `${refreshRate} Hz DPR ${dpr}`);

    zoneProgression.sync(progression.snapshot(), true);
    assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_2);
    assert.equal(zoneTwoSignals, 1, `${refreshRate} Hz DPR ${dpr} reprise`);
    assert.equal(score.snapshot().points, 2600);
  }
}

const zoneSource = await readFile(
  new URL("../../src/gameplay/nyrZoneProgression.js", import.meta.url),
  "utf8"
);
const mainSource = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
const backgroundSource = await readFile(
  new URL("../../src/core/zoneOneBackground.js", import.meta.url),
  "utf8"
);

assert.doesNotMatch(zoneSource, /score|segmentCount|addSegments/);
assert.doesNotMatch(zoneSource, /state\.normalFragmentsAbsorbed/);
assert.equal((mainSource.match(/zoneProgression\.sync\(/g) ?? []).length, 2);
assert.match(mainSource, /zoneProgression\.sync\(progressionState\)/);
assert.match(backgroundSource, /NYR_ZONE_01_ESPACE_NOCTURNE_V1\.png/);
assert.doesNotMatch(mainSource, /NYR_ZONE_02_NEBULEUSE_V1/);
assert.doesNotMatch([zoneSource, mainSource].join("\n"), /(?:https?:)?\/\//);

console.log("PACK 18 zone progression: tests OK");
