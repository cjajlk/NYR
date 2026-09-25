import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { renderNyr } from "../../src/gameplay/nyrRenderer.js";
import { createNyrAbsorptionFeedback } from "../../src/gameplay/nyrAbsorptionFeedback.js";
import { endGame } from "../../src/core/runtimeState.js";

export function verifyNocturne({ app, frame, snapshot, hz }) {
  const progression = createNyrProgression();
  for (let i = 0; i <= 175; i++) {
    assert.equal(progression.snapshot().currentForm, i < 50 ? "eclat" : i < 150 ? "spectre" : i < 300 ? "nocturne" : "devoreur");
    progression.recordNormalFragmentAbsorption();
  }
  const initial = snapshot(globalThis.probe);
  for (const earlyPortals of [false, true]) {
    const p = globalThis.probe;
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 1; i <= 175; i++) {
      const before = snapshot(p);
      normal();
      assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, i);
      assert.equal(p.progression.snapshot().currentForm, i < 50 ? "eclat" : i < 150 ? "spectre" : i < 300 ? "nocturne" : "devoreur");
      assert.equal(p.movement.snapshot().segmentCount, Math.min(120, 4 + i));
      assert.equal(p.stability.snapshot().stability, before.stability.stability);
      assert.equal(p.movement.snapshot().heading, before.movement.heading);
      assert.equal(p.movement.snapshot().x, before.movement.x);
      assert.equal(p.score.snapshot().points - before.score.points, 100 * (before.combo.chain < 2 ? 1 : before.combo.chain < 4 ? 2 : before.combo.chain < 6 ? 3 : 4));
      if (i === 150) {
        assert.equal(p.combo.snapshot().chain, before.combo.chain + 1);
        assert.equal(p.absorptionFeedback.snapshot().form, "nocturne");
      }
      if (earlyPortals && (i === 27 || i === 42)) {
        const conserved = p.progression.snapshot();
        (i === 27 ? p.portal : p.exitPortal).update((i === 27 ? p.portal : p.exitPortal).snapshot());
        assert.deepEqual(p.progression.snapshot(), conserved);
      }
    }
    assert.equal(p.zoneProgression.snapshot().currentZone, earlyPortals ? "zone-3" : "zone-1");
    const protectedState = () => ({ progression: p.progression.snapshot(), score: p.score.snapshot(), movement: p.movement.snapshot(), combo: p.combo.snapshot() });
    const beforeSpecial = protectedState();
    for (const kind of ["pure", "corruption"]) {
      const item = p.fragmentSystem.snapshot().find(item => item.kind === kind);
      if (item) p.fragmentSystem.update({ ...item, trail: [] }, 940, 392);
    }
    assert.deepEqual(protectedState(), beforeSpecial);
    const traces = new Map();
    for (const form of ["eclat", "spectre", "nocturne"]) {
      const calls = [];
      const context = new Proxy({}, {
        get: (_, key) => (...args) => calls.push([key, ...args]),
        set: (_, key, value) => { calls.push([key, value]); return true; }
      });
      const state = p.movement.snapshot();
      const copy = structuredClone(state);
      renderNyr(context, state, { currentForm: form });
      assert.deepEqual(state, copy, "renderer cannot change physics");
      traces.set(form, calls);
    }
    assert.notDeepEqual(traces.get("nocturne"), traces.get("spectre"));
    assert.ok(traces.get("nocturne").some(call => call[0] === "quadraticCurveTo"));
    const colors = traces.get("nocturne").filter(call => /Style|Color/.test(call[0])).map(call => call[1]);
    for (const color of colors) {
      const rgb = color.startsWith("#") ? color.slice(1).match(/../g).map(v => parseInt(v, 16)) : color.match(/[\d.]+/g).slice(0, 3).map(Number);
      assert.ok(rgb[2] >= rgb[0], `cool palette: ${color}`);
    }
    const feedback = createNyrAbsorptionFeedback();
    feedback.trigger("nocturne");
    assert.equal(feedback.snapshot().active, true);
    const arcs = [];
    const context = new Proxy({}, { get: (_, key) => (...args) => { if (key === "arc") arcs.push(args); }, set: () => true });
    renderNyr(context, p.movement.snapshot(), p.progression.snapshot(), feedback.snapshot());
    assert.equal(arcs.length, 5, "two pulse rings, pulse core and two eyes");
    for (let i = 0; i < hz; i++) feedback.update(1 / hz);
    assert.equal(feedback.snapshot().active, false);
    endGame(); frame();
    const frozen = snapshot(p);
    for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), frozen);
    if (earlyPortals) {
      app.children.find(e => e.className === "return-menu").emit("click");
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
    assert.equal(globalThis.probe.progression.snapshot().currentForm, "eclat");
  }
}
if (!process.env.NYR_NOCTURNE_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_NOCTURNE_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 41 Nocturne: tests OK");
}
