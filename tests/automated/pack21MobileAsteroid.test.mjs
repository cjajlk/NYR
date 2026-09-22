import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createNyrZoneProgression } from "../../src/gameplay/nyrZoneProgression.js";
import {
  createMobileAsteroidSystem,
  MOBILE_ASTEROID_CONFIG
} from "../../src/gameplay/mobileAsteroidSystem.js";
import { renderMobileAsteroid } from "../../src/gameplay/mobileAsteroidRenderer.js";

const viewports = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "mobile-portrait", width: 390, height: 844 }
];

function fixedRandom() {
  return 0.1;
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

assert.equal(MOBILE_ASTEROID_CONFIG.speedPixelsPerSecond, 42);
assert.equal(MOBILE_ASTEROID_CONFIG.radiusPixels, 24);
assert.equal(MOBILE_ASTEROID_CONFIG.spawnMarginPixels, 36);

for (const viewport of viewports) {
  for (const dpr of [1, 2]) {
    for (const refreshRate of [30, 60, 120]) {
      let contacts = 0;
      const asteroid = createMobileAsteroidSystem({
        random: fixedRandom,
        onHeadContactStarted() {
          contacts += 1;
        }
      });
      const progression = createNyrProgression();
      const zoneProgression = createNyrZoneProgression();
      const score = createNyrScore();
      const stability = createNyrStability();
      const head = { x: viewport.width * 0.5, y: viewport.height * 0.5, trail: [] };
      const fragments = [
        { x: viewport.width * 0.25, y: viewport.height * 0.25 },
        { x: viewport.width * 0.75, y: viewport.height * 0.75 }
      ];

      for (let absorption = 1; absorption <= 24; absorption += 1) {
        const zoneState = zoneProgression.sync(progression.recordNormalFragmentAbsorption());
        asteroid.syncZone(zoneState, viewport.width, viewport.height, head, fragments);
        score.awardNormalFragment();
      }
      assert.equal(asteroid.snapshot().active, false);
      assert.equal(score.snapshot().points, 2400);

      const zoneAtTwentyFive = zoneProgression.sync(
        progression.recordNormalFragmentAbsorption()
      );
      asteroid.syncZone(zoneAtTwentyFive, viewport.width, viewport.height, head, fragments);
      score.awardNormalFragment();
      const spawnState = asteroid.snapshot();
      assert.equal(spawnState.active, true);
      assert.equal(score.snapshot().points, 2500);
      assert.equal(progression.snapshot().currentForm, "spectre");
      assert.ok(distance(spawnState, head) >= MOBILE_ASTEROID_CONFIG.minimumHeadSpawnDistancePixels);
      assert.ok(fragments.every((fragment) =>
        distance(spawnState, fragment) >= MOBILE_ASTEROID_CONFIG.minimumFragmentSpawnDistancePixels
      ));

      for (let frame = 0; frame < refreshRate * 0.4; frame += 1) {
        asteroid.update(1 / refreshRate, viewport.width, viewport.height, head, fragments);
      }
      const beforePortrait = asteroid.snapshot();
      for (let frame = 0; frame < refreshRate * 3; frame += 1) {
        asteroid.snapshot();
      }
      assert.deepEqual(
        asteroid.snapshot(),
        beforePortrait,
        `${viewport.name} ${refreshRate} Hz DPR ${dpr} portrait`
      );

      for (let frame = 0; frame < refreshRate * 0.6; frame += 1) {
        asteroid.update(1 / refreshRate, viewport.width, viewport.height, head, fragments);
      }
      const afterOneActiveSecond = asteroid.snapshot();
      assert.ok(Math.abs(
        distance(spawnState, afterOneActiveSecond) - MOBILE_ASTEROID_CONFIG.speedPixelsPerSecond
      ) < 1e-8, `${viewport.name} ${refreshRate} Hz DPR ${dpr} movement`);

      asteroid.syncZone(
        zoneProgression.sync(progression.recordNormalFragmentAbsorption()),
        viewport.width,
        viewport.height,
        head,
        fragments
      );
      score.awardNormalFragment();
      assert.equal(asteroid.snapshot().active, true);
      assert.equal(score.snapshot().points, 2600);
      assert.equal(stability.snapshot().stability, 100);

      const asteroidPosition = asteroid.snapshot();
      const touchingHead = { x: asteroidPosition.x, y: asteroidPosition.y, trail: [] };
      asteroid.update(0, viewport.width, viewport.height, touchingHead, fragments);
      assert.equal(contacts, 1);
      asteroid.update(0, viewport.width, viewport.height, touchingHead, fragments);
      assert.equal(contacts, 1);

      const bodyOnly = {
        x: viewport.width * 0.5,
        y: viewport.height * 0.5,
        trail: [{ x: asteroidPosition.x, y: asteroidPosition.y }]
      };
      asteroid.update(0, viewport.width, viewport.height, bodyOnly, fragments);
      assert.equal(contacts, 1);
      asteroid.update(0, viewport.width, viewport.height, touchingHead, fragments);
      assert.equal(contacts, 2);
      assert.equal(stability.snapshot().stability, 100);
      assert.equal(score.snapshot().points, 2600);
    }
  }
}

const drawingCalls = [];
const fakeContext = {
  save() {}, restore() {}, translate() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
  moveTo() {}, lineTo() {}, arc() {},
  set shadowColor(value) { drawingCalls.push(["shadowColor", value]); },
  set shadowBlur(value) { drawingCalls.push(["shadowBlur", value]); },
  set fillStyle(value) { drawingCalls.push(["fillStyle", value]); },
  set strokeStyle(value) { drawingCalls.push(["strokeStyle", value]); },
  set lineWidth(value) { drawingCalls.push(["lineWidth", value]); }
};
assert.equal(renderMobileAsteroid(fakeContext, { active: false }), false);
assert.equal(renderMobileAsteroid(fakeContext, { active: true, x: 100, y: 100 }), true);
assert.ok(drawingCalls.length > 0);

const mainSource = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
const systemSource = await readFile(
  new URL("../../src/gameplay/mobileAsteroidSystem.js", import.meta.url),
  "utf8"
);
const rendererSource = await readFile(
  new URL("../../src/gameplay/mobileAsteroidRenderer.js", import.meta.url),
  "utf8"
);
assert.doesNotMatch(systemSource, /stability|score|segmentCount/);
assert.doesNotMatch(rendererSource, /fillText|strokeText|NYR_HAZARD_ASTEROIDE_V1/);
assert.match(mainSource, /mobileAsteroid\.syncZone\(\s*zoneState/);
assert.match(mainSource, /mobileAsteroid\.update\(\s*deltaSeconds/);
assert.ok(
  mainSource.indexOf("renderMobileAsteroid(") < mainSource.indexOf("renderNormalFragments(")
);
assert.doesNotMatch([mainSource, systemSource, rendererSource].join("\n"), /https?:\/\/|file:\/\//);

console.log("PACK 21 mobile asteroid: tests OK");
