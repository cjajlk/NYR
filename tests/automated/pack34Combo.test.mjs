import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createNyrCombo } from "../../src/gameplay/nyrCombo.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";

export function verifyCombo({ app, frame, snapshot, hz, setBounds }) {
  const c = createNyrCombo(), score = createNyrScore();
  for (const expected of [1, 1, 2, 2, 3, 3, 4, 4]) {
    assert.equal(c.absorb(), expected);
    const before = score.snapshot().points;
    score.awardNormalFragment(expected);
    assert.equal(score.snapshot().points - before, expected * 100);
  }
  for (let i = 0; i < hz * 2; i++) c.update(1 / hz);
  assert.ok(Math.abs(c.snapshot().remaining - 1) < 1e-8);
  c.absorb(); assert.equal(c.snapshot().remaining, 3);
  for (let i = 0; i < hz * 3; i++) c.update(1 / hz);
  assert.deepEqual(c.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
  assert.equal(c.absorb(), 1);

  const initial = snapshot(globalThis.probe);
  const p = globalThis.probe;
  const normal = () => { p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    if (p.portal.snapshot().active) p.portal.update(p.portal.snapshot()); };
  for (let i = 0; i < 10; i++) normal();
  assert.equal(p.combo.snapshot().chain, 10);
  assert.equal(p.score.snapshot().points, 2800);
  assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 10);
  const before = p.combo.snapshot(), points = p.score.snapshot().points;
  const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
  p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
  assert.deepEqual(p.combo.snapshot(), before);
  assert.equal(p.score.snapshot().points, points);
  frame(); frame();
  assert.equal(p.comboDisplay.element.textContent, "COMBO x4");
  assert.equal(p.comboDisplay.element.hidden, false);
  const activeTime = p.combo.snapshot().remaining;
  frame();
  assert.ok(Math.abs(p.combo.snapshot().remaining - (activeTime - 1 / hz)) < 1e-8);
  window.innerWidth = 440; window.innerHeight = 956;
  setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
  const frozen = p.combo.snapshot();
  for (let i = 0; i < hz * 10; i++) frame();
  assert.deepEqual(p.combo.snapshot(), frozen);
  assert.equal(p.comboDisplay.element.hidden, true);
  window.innerWidth = 956; window.innerHeight = 440;
  setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
  assert.deepEqual(p.combo.snapshot(), frozen);
  suspendRuntime("test-pause");
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.combo.snapshot(), frozen);
  resumeRuntime("test-pause");
  for (let i = 10; i < 35; i++) normal();
  const danger = p.fragmentSystem.snapshot().find(f => f.kind === "corruption");
  const beforeDanger = p.combo.snapshot(), beforeScore = p.score.snapshot().points;
  p.fragmentSystem.update({ ...danger, trail: [] }, 940, 392);
  assert.deepEqual(p.combo.snapshot(), beforeDanger);
  assert.equal(p.score.snapshot().points, beforeScore);
  while (p.stability.snapshot().stability > 0) {
    p.fragmentSystem.update({ x: -1000, y: -1000, trail: [] }, 940, 392);
    p.fragmentSystem.update({ ...danger, trail: [] }, 940, 392);
  }
  assert.deepEqual(p.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
  frame(); assert.equal(p.comboDisplay.element.hidden, true);
  app.children.find(e => e.className === "return-menu").emit("click");
  assert.deepEqual(globalThis.probe.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
  app.children.find(e => e.className === "main-menu").children[1].emit("click");
  assert.deepEqual(snapshot(globalThis.probe), initial);
  // Shared harness verifies repeated REJOUER with combo included in all snapshots.
}
if (!process.env.NYR_COMBO_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_COMBO_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 34 combo: tests OK");
}
