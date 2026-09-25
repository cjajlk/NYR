import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { createScoreDisplay, formatScore } from "../../src/ui/scoreDisplay.js";

function createFakeOutput() {
  return {
    attributes: {},
    className: "",
    textContent: "",
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
}

const expectedLabels = new Map([
  [0, "SCORE 000000"],
  [100, "SCORE 000100"],
  [1000, "SCORE 001000"],
  [1900, "SCORE 001900"],
  [2000, "SCORE 002000"],
  [2100, "SCORE 002100"]
]);

const requiredViewports = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "mobile-portrait", width: 390, height: 844 }
];

for (const viewport of requiredViewports) {
  for (const dpr of [1, 2]) {
    const approximateScoreWidth = 141;
    const approximateScoreHeight = 26;
    const occupiedRatio = approximateScoreWidth * approximateScoreHeight /
      (viewport.width * viewport.height);

    assert.ok(approximateScoreWidth < viewport.width * 0.4, `${viewport.name} DPR ${dpr}`);
    assert.ok(occupiedRatio < 0.025, `${viewport.name} DPR ${dpr}`);
  }
}

for (const [points, label] of expectedLabels) {
  assert.equal(formatScore({ points }), label);
}

for (const refreshRate of [30, 60, 120]) {
  const score = createNyrScore();
  let spectreThresholdSignals = 0;
  const progression = createNyrProgression({
    onSpectreThresholdReached() {
      spectreThresholdSignals += 1;
    }
  });
  const output = createFakeOutput();
  const display = createScoreDisplay(() => output);
  display.update(score.snapshot());
  assert.equal(output.textContent, expectedLabels.get(0));

  for (let absorption = 1; absorption <= 21; absorption += 1) {
    progression.recordNormalFragmentAbsorption();
    display.update(score.awardNormalFragment());

    if (expectedLabels.has(absorption * 100)) {
      assert.equal(output.textContent, expectedLabels.get(absorption * 100));
    }
  }

  assert.equal(score.snapshot().points, 2100, `${refreshRate} Hz`);
  assert.equal(progression.snapshot().currentForm, "eclat", `${refreshRate} Hz`);
  assert.equal(spectreThresholdSignals, 0, `${refreshRate} Hz`);

  const frozenLabel = output.textContent;
  for (let suspendedFrame = 0; suspendedFrame < refreshRate * 3; suspendedFrame += 1) {
    display.update(score.snapshot());
  }
  assert.equal(output.textContent, frozenLabel, `${refreshRate} Hz suspension`);
  assert.equal(score.snapshot().points, 2100, `${refreshRate} Hz reprise`);
}

const mainSource = await readFile(new URL("../../src/main.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../../assets/css/main.css", import.meta.url), "utf8");
const projectFiles = [mainSource, cssSource];

assert.equal((mainSource.match(/score\.awardNormalFragment\(combo\.absorb\(\)\)/g) ?? []).length, 1);
assert.match(mainSource, /scoreDisplay\.update\(updatedScore\)/);
assert.match(mainSource, /scoreDisplay\.update\(score\.snapshot\(\)\)/);
assert.match(cssSource, /\.score-display\s*\{[\s\S]*?z-index:\s*11;/);
assert.match(cssSource, /\.orientation-overlay\s*\{[\s\S]*?z-index:\s*10;/);
assert.doesNotMatch(projectFiles.join("\n"), /(?:https?:)?\/\//);

console.log("PACK 17 score display: tests OK");
