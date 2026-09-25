import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
import { renderNyr } from "../../src/gameplay/nyrRenderer.js";
import { createNyrAbsorptionFeedback } from "../../src/gameplay/nyrAbsorptionFeedback.js";
import { endGame } from "../../src/core/runtimeState.js";

export function verifyDevoreur({ app, frame, snapshot, hz }) {
  const progression = createNyrProgression();
  for (let i = 0; i <= 125; i++) {
    assert.equal(progression.snapshot().currentForm, i < 20 ? "eclat" : i < 50 ? "spectre" : i < 100 ? "nocturne" : "devoreur");
    progression.recordNormalFragmentAbsorption();
  }
  const initial = snapshot(globalThis.probe);
  for (const earlyPortals of [false, true]) {
    const p = globalThis.probe;
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 1; i <= 125; i++) {
      const before = snapshot(p);
      normal();
      assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, i);
      assert.equal(p.progression.snapshot().currentForm, i < 20 ? "eclat" : i < 50 ? "spectre" : i < 100 ? "nocturne" : "devoreur");
      assert.equal(p.movement.snapshot().segmentCount, Math.min(120, 4 + i));
      assert.equal(p.stability.snapshot().stability, before.stability.stability);
      assert.equal(p.movement.snapshot().heading, before.movement.heading);
      assert.equal(p.movement.snapshot().x, before.movement.x);
      assert.equal(p.score.snapshot().points - before.score.points, 100 * (before.combo.chain < 2 ? 1 : before.combo.chain < 4 ? 2 : before.combo.chain < 6 ? 3 : 4));
      if (i === 100) {
        assert.equal(p.combo.snapshot().chain, before.combo.chain + 1);
        assert.equal(p.absorptionFeedback.snapshot().form, "devoreur");
      }
      if (earlyPortals && i === 62) {
        const before = p.progression.snapshot();
        p.zoneThreePortal.update(p.zoneThreePortal.snapshot());
        assert.deepEqual(p.progression.snapshot(), before);
      }
      if (earlyPortals && (i === 27 || i === 42)) {
        const conserved = p.progression.snapshot();
        (i === 27 ? p.portal : p.exitPortal).update((i === 27 ? p.portal : p.exitPortal).snapshot());
        assert.deepEqual(p.progression.snapshot(), conserved);
      }
    }
    assert.equal(p.zoneProgression.snapshot().currentZone, earlyPortals ? "zone-4" : "zone-1");
    const protectedState = () => ({ progression: p.progression.snapshot(), score: p.score.snapshot(), movement: p.movement.snapshot(), combo: p.combo.snapshot() });
    const beforeSpecial = protectedState();
    for (const kind of ["pure", "corruption"]) {
      const item = p.fragmentSystem.snapshot().find(item => item.kind === kind);
      if (item) p.fragmentSystem.update({ ...item, trail: [] }, 940, 392);
    }
    assert.deepEqual(protectedState(), beforeSpecial);
    const traces = new Map();
    for (const form of ["eclat", "spectre", "nocturne", "devoreur"]) {
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
    assert.notDeepEqual(traces.get("devoreur"), traces.get("nocturne"));
    assert.ok(traces.get("nocturne").some(call => call[0] === "quadraticCurveTo"));
    const colors = traces.get("devoreur").filter(call => /Style|Color/.test(call[0])).map(call => call[1]);
    const gold = colors.filter(color => color.includes("203, 177, 114"));
    assert.ok(gold.length > 0 && gold.length / colors.length < 0.15, "gold stays an accent");
    const traceAt = time => {
      const calls = [];
      const context = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]),
        set: (_, key, value) => { calls.push([key, value]); return true; } });
      renderNyr(context, { ...p.movement.snapshot(), simulationTime: time }, { currentForm: "devoreur" });
      return calls;
    };
    assert.notDeepEqual(traceAt(0), traceAt(1), "energy travels along the body");
    assert.deepEqual(traceAt(1), traceAt(1), "same active time gives identical render");

    const feedback = createNyrAbsorptionFeedback();
    feedback.trigger("devoreur");
    assert.equal(feedback.snapshot().active, true);
    const arcs = [];
    const context = new Proxy({}, { get: (_, key) => (...args) => { if (key === "arc") arcs.push(args); }, set: () => true });
    renderNyr(context, p.movement.snapshot(), p.progression.snapshot(), feedback.snapshot());
    assert.equal(arcs.length, 5, "two pulse rings, pulse core and two eyes");
    for (let i = 0; i < hz; i++) feedback.update(1 / hz);
    assert.equal(feedback.snapshot().active, false);
    frame(); frame();
    const beforeMove = p.movement.snapshot(); frame();
    const afterMove = p.movement.snapshot();
    assert.ok(Math.abs(Math.hypot(afterMove.x - beforeMove.x, afterMove.y - beforeMove.y) - (earlyPortals ? 109.25 : 95) / hz) < 1e-8);
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
if (!process.env.NYR_DEVOREUR_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_DEVOREUR_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 43 Devoreur: tests OK");
}
