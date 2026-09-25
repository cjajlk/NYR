import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { formatTime } from "../../src/ui/timeDisplay.js";
import { createZoneBackgroundTransition } from "../../src/core/zoneBackgroundTransition.js";
import { endGame, getRuntimeState } from "../../src/core/runtimeState.js";
export function verifyInfinite({ app, frame, snapshot, hz, setBounds }) {
  for (const [seconds, label] of [[0,"00:00"],[59.99,"00:59"],[60,"01:00"],[522,"08:42"],[3600,"1:00:00"],[4122,"1:08:42"]]) {
    assert.equal(formatTime(seconds), "TEMPS " + label);
  }
  for (const failOne of [false, true]) {
    const sources = [];
    const transition = createZoneBackgroundTransition({ zoneOneBackground: { render() {} }, createImage() {
      const events = {};
      return { naturalWidth: 1600, naturalHeight: 900, addEventListener(n, fn) { events[n] = fn; },
        set src(value) { sources.push(value); events[failOne && value.includes("ZONE_01") ? "error" : "load"](); } };
    } });
    const context = { save() {}, restore() {}, drawImage() {} };
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const zone of ["zone-2", "zone-3", "zone-4", "zone-1"]) {
        transition.sync({ currentZone: zone });
        for (let i = 0; i < hz / 2; i++) transition.update(1 / hz);
        if (zone === "zone-1") {
          assert.ok(Math.abs(transition.snapshot().progress - (failOne ? 0 : 0.5)) < 1e-8);
          const frozen = transition.snapshot();
          transition.render(context, 800, 360); assert.deepEqual(transition.snapshot(), frozen);
        }
        for (let i = 0; i < hz / 2; i++) transition.update(1 / hz);
        if (zone === "zone-1") assert.equal(transition.render(context, 956, 440).mode, failOne ? "zone-four-fallback" : "zone-one");
      }
    }
    assert.equal(sources.length, 4, "images preloaded once across cycles");
  }
  const initial = snapshot(globalThis.probe);
  for (const menu of [false, true]) {
    const p = globalThis.probe;
    assert.equal(p.timeDisplay.element.textContent, "TEMPS 00:00");
    frame(); frame();
    for (let i = 0; i < hz; i++) frame();
    assert.ok(p.movement.snapshot().simulationTime >= 1);
    assert.notEqual(p.timeDisplay.element.textContent, "TEMPS 00:00");
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let cycle = 0; cycle < 2; cycle++) {
      const entry = p.progression.snapshot().normalFragmentsAbsorbed;
      assert.equal(p.zoneOneObjective.snapshot().entryCount, entry);
      for (const [count, portal, zone] of [[25,p.portal,"zone-2"],[15,p.exitPortal,"zone-3"],[20,p.zoneThreePortal,"zone-4"],[25,p.zoneFourPortal,"zone-1"]]) {
        assert.equal(portal.snapshot().active, false);
        const start = p.progression.snapshot().normalFragmentsAbsorbed;
        for (let i = 0; i < count - 1; i++) normal();
        assert.equal(portal.snapshot().active, false);
        if (zone === "zone-1") {
          assert.equal(p.zoneFourObjective.snapshot().entryCount, start);
          const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
          if (pure) p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
          assert.equal(p.zoneFourObjective.snapshot().absorbed, 24);
        }
        normal();
        assert.equal(portal.snapshot().active, true);
        const conserved = () => ({ movement: p.movement.snapshot(), progression: p.progression.snapshot(),
          score: p.score.snapshot(), stability: p.stability.snapshot() });
        const before = conserved();
        portal.update(portal.snapshot());
        assert.deepEqual(conserved(), before);
        assert.equal(p.zoneProgression.snapshot().currentZone, zone);
        assert.equal(p.combo.snapshot().chain, 0);
        assert.equal(getRuntimeState().phase, "PLAYING");
        assert.equal(getRuntimeState().journeyComplete, false);
        portal.update(portal.snapshot()); assert.deepEqual(conserved(), before);
        if (zone === "zone-4") assert.equal(p.voidDifficulty.snapshot().elapsed, 0);
      }
      assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, entry + 85);
    }
    assert.equal(p.progression.snapshot().currentForm, "nocturne");
    assert.equal(p.movement.snapshot().segmentCount, 120);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const frozen = snapshot(p); for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), frozen); assert.equal(p.timeDisplay.element.hidden, true);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.deepEqual(snapshot(p), frozen);
    endGame(); frame(); const finalLabel = p.timeDisplay.element.textContent;
    const dead = snapshot(p); for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), dead); assert.equal(p.timeDisplay.element.textContent, finalLabel);
    assert.equal(p.timeDisplay.element.hidden, false);
    if (menu) {
      globalThis.quitToMenu();
      const idle = snapshot(globalThis.probe); for (let i = 0; i < hz; i++) frame();
      assert.deepEqual(snapshot(globalThis.probe), idle);
      assert.equal(globalThis.probe.timeDisplay.element.hidden, true);
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
    assert.equal(globalThis.probe.timeDisplay.element.textContent, "TEMPS 00:00");
  }
}
if (!process.env.NYR_INFINITE_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_INFINITE_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 45 infinite journey and timer: tests OK");
}
