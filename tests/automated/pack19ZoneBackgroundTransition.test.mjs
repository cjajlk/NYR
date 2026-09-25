import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createNyrZoneProgression, NYR_ZONES } from "../../src/gameplay/nyrZoneProgression.js";
import {
  createZoneBackgroundTransition,
  ZONE_BACKGROUND_TRANSITION_CONFIG,
  ZONE_TWO_BACKGROUND_SOURCE
} from "../../src/core/zoneBackgroundTransition.js";

function createFakeImage({ succeeds = true } = {}) {
  const listeners = new Map();
  return {
    naturalWidth: succeeds ? 1600 : 0,
    naturalHeight: succeeds ? 900 : 0,
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    set src(value) {
      this.loadedSource = value;
      listeners.get(succeeds ? "load" : "error")?.();
    }
  };
}

function createFakeContext() {
  return {
    drawCalls: [],
    globalAlpha: 1,
    save() {},
    restore() {
      this.globalAlpha = 1;
    },
    drawImage(image, x, y, width, height) {
      this.drawCalls.push({ image, x, y, width, height, alpha: this.globalAlpha });
    }
  };
}

function createZoneOneStub() {
  return {
    renderCalls: 0,
    render() {
      this.renderCalls += 1;
      return Object.freeze({ mode: "image", status: "ready" });
    }
  };
}

assert.equal(ZONE_BACKGROUND_TRANSITION_CONFIG.durationSeconds, 1);
assert.equal(ZONE_TWO_BACKGROUND_SOURCE, "./assets/images/zones/NYR_ZONE_02_NEBULEUSE_V1.png");

for (const refreshRate of [30, 60, 120]) {
  for (const dpr of [1, 2]) {
    for (const viewport of [
      { name: "desktop", width: 1366, height: 768 },
      { name: "mobile-landscape", width: 844, height: 390 }
    ]) {
      let transitionSignals = 0;
      const zoneOneBackground = createZoneOneStub();
      const zoneTwoImage = createFakeImage();
      const transition = createZoneBackgroundTransition({
        zoneOneBackground,
        createImage: () => zoneTwoImage.loadedSource ? createFakeImage() : zoneTwoImage,
        onTransitionStarted() {
          transitionSignals += 1;
        }
      });
      let zoneTwoSignals = 0;
      const zoneProgression = createNyrZoneProgression({
        onZoneTwoReached(zoneState) {
          zoneTwoSignals += 1;
          transition.sync(zoneState);
        }
      });
      const progression = createNyrProgression();
      const score = createNyrScore();

      for (let absorption = 1; absorption <= 24; absorption += 1) {
        zoneProgression.sync(progression.recordNormalFragmentAbsorption(), true);
        score.awardNormalFragment();
      }

      assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_1);
      assert.equal(transition.snapshot().targetZone, NYR_ZONES.ZONE_1);
      assert.equal(score.snapshot().points, 2400);

      zoneProgression.sync(progression.recordNormalFragmentAbsorption(), true);
      score.awardNormalFragment();
      assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_2);
      assert.equal(transitionSignals, 1);
      assert.equal(zoneTwoSignals, 1);
      assert.equal(score.snapshot().points, 2500);
      assert.equal(progression.snapshot().currentForm, "eclat");

      const activeFramesBeforePortrait = Math.round(refreshRate * 0.4);
      for (let frame = 0; frame < activeFramesBeforePortrait; frame += 1) {
        transition.update(1 / refreshRate);
      }
      const frozenState = transition.snapshot();

      for (let portraitFrame = 0; portraitFrame < refreshRate * 3; portraitFrame += 1) {
        transition.snapshot();
      }
      assert.deepEqual(
        transition.snapshot(),
        frozenState,
        `${viewport.name} ${refreshRate} Hz DPR ${dpr} portrait`
      );

      const activeFramesAfterPortrait = Math.round(refreshRate * 0.6);
      for (let frame = 0; frame < activeFramesAfterPortrait; frame += 1) {
        transition.update(1 / refreshRate);
      }
      assert.equal(transition.snapshot().progress, 1);
      assert.equal(transition.snapshot().activeTransitionSeconds, 1);

      zoneProgression.sync(progression.recordNormalFragmentAbsorption(), true);
      score.awardNormalFragment();
      assert.equal(zoneProgression.snapshot().currentZone, NYR_ZONES.ZONE_2);
      assert.equal(transitionSignals, 1);
      assert.equal(zoneTwoSignals, 1);
      assert.equal(score.snapshot().points, 2600);

      const context = createFakeContext();
      const rendered = transition.render(context, viewport.width, viewport.height);
      assert.equal(rendered.mode, "zone-two");
      assert.equal(zoneOneBackground.renderCalls, 1);
      assert.equal(context.drawCalls.length, 1);
      assert.equal(context.drawCalls[0].alpha, 1);
      assert.ok(rendered.rect.width >= viewport.width);
      assert.ok(rendered.rect.height >= viewport.height);
      assert.ok(Math.abs(rendered.rect.x * 2 + rendered.rect.width - viewport.width) < 1e-9);
      assert.ok(Math.abs(rendered.rect.y * 2 + rendered.rect.height - viewport.height) < 1e-9);
      assert.equal(zoneTwoImage.loadedSource, ZONE_TWO_BACKGROUND_SOURCE);
    }
  }
}

const fallbackZoneOne = createZoneOneStub();
const failedTransition = createZoneBackgroundTransition({
  zoneOneBackground: fallbackZoneOne,
  createImage: () => createFakeImage({ succeeds: false })
});
failedTransition.sync({ currentZone: NYR_ZONES.ZONE_2 });
failedTransition.update(10);
const fallbackContext = createFakeContext();
const fallbackRender = failedTransition.render(fallbackContext, 1366, 768);
assert.equal(failedTransition.snapshot().zoneTwoStatus, "failed");
assert.equal(failedTransition.snapshot().progress, 0);
assert.equal(fallbackRender.mode, "zone-one-fallback");
assert.equal(fallbackZoneOne.renderCalls, 1);
assert.equal(fallbackContext.drawCalls.length, 0);

const mainSource = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
const transitionSource = await readFile(
  new URL("../../src/core/zoneBackgroundTransition.js", import.meta.url),
  "utf8"
);
assert.doesNotMatch(transitionSource, /score|segmentCount|normalFragmentsAbsorbed/);
assert.equal((mainSource.match(/zoneBackgroundTransition\.update\(/g) ?? []).length, 1);
assert.equal((mainSource.match(/zoneBackgroundTransition\.render\(/g) ?? []).length, 1);
assert.ok(
  mainSource.indexOf("zoneBackgroundTransition.render(") <
    mainSource.indexOf("farStarsParallax.render(")
);
assert.ok(
  mainSource.indexOf("decorativeAsteroidsParallax.render(") <
    mainSource.indexOf("renderNormalFragments(")
);
assert.doesNotMatch([mainSource, transitionSource].join("\n"), /https?:\/\/|file:\/\//);

console.log("PACK 19 zone background transition: tests OK");
