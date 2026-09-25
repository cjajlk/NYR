import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { endGame, getRuntimeState } from "../../src/core/runtimeState.js";

export function verifyZoneTwoExit({ app, frame, snapshot, hz, setBounds }) {
  const initial = snapshot(globalThis.probe);
  const fullscreen = document.fullscreenElement;
  for (const entry of [27, 130]) {
    const p = globalThis.probe;
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 0; i < entry; i++) normal();
    assert.equal(p.zoneTwoObjective.snapshot().entryCount, null);
    assert.equal(p.exitPortal.snapshot().active, false);
    p.stability.applyAsteroidContact();
    const retained = { movement: p.movement.snapshot(), stability: p.stability.snapshot(),
      score: p.score.snapshot(), progression: p.progression.snapshot() };
    p.portal.update(p.portal.snapshot());
    assert.deepEqual({ movement: p.movement.snapshot(), stability: p.stability.snapshot(),
      score: p.score.snapshot(), progression: p.progression.snapshot() }, retained);
    assert.deepEqual(p.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
    assert.deepEqual(p.zoneTwoObjective.snapshot(), { entryCount: entry, absorbed: 0 });
    assert.equal(p.movement.snapshot().segmentCount, Math.min(120, entry + 4));
    const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
    p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
    assert.deepEqual(p.zoneTwoObjective.snapshot(), { entryCount: entry, absorbed: 0 });
    for (let i = 0; i < 14; i++) normal();
    assert.equal(p.exitPortal.snapshot().active, false);
    assert.equal(p.zoneTwoObjective.snapshot().absorbed, 14);
    normal();
    const portal = p.exitPortal.snapshot();
    assert.equal(portal.active, true);
    assert.equal(p.zoneTwoObjective.snapshot().absorbed, 15);
    assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, entry + 15);
    assert.ok(portal.x >= 56 && portal.x <= 884 && portal.y >= 56 && portal.y <= 336);
    assert.ok(Math.hypot(portal.x - p.movement.snapshot().x, portal.y - p.movement.snapshot().y) > 100);
    normal(); assert.deepEqual(p.exitPortal.snapshot(), portal, "only one exit");
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize");
    for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(p.exitPortal.snapshot(), portal);
    assert.equal(getRuntimeState().journeyComplete, false);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.equal(getRuntimeState().journeyComplete, false);
    const conserved = { score: p.score.snapshot(), stability: p.stability.snapshot(),
      movement: p.movement.snapshot(), progression: p.progression.snapshot() };
    // Put the exit at the real head for a controlled contact through the actual gameplay loop.
    const head = p.movement.snapshot();
    p.exitPortal.translate({ x: head.x - portal.x, y: head.y - portal.y });
    frame(); frame();
    assert.equal(getRuntimeState().journeyComplete, false);
    assert.equal(getRuntimeState().phase, "PLAYING");
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-3");
    assert.equal(p.score.snapshot().points, conserved.score.points);
    assert.equal(p.movement.snapshot().segmentCount, conserved.movement.segmentCount);
    assert.deepEqual(p.progression.snapshot(), conserved.progression);
    assert.deepEqual(p.combo.snapshot(), { chain: 0, remaining: 0, multiplier: 1 });
    // PACK 39 replaces the provisional completion screen with Zone 3.
    endGame(); frame();
    if (entry === 27) p.stabilityDisplay.gameOverElement.children[2].emit("click");
    else {
      globalThis.quitToMenu();
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    }
    assert.deepEqual(snapshot(globalThis.probe), initial);
    assert.equal(getRuntimeState().journeyComplete, false);
    assert.equal(document.fullscreenElement, fullscreen);
  }
}
if (!process.env.NYR_ZONE_TWO_EXIT_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_ZONE_TWO_EXIT_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 38 zone two exit: tests OK");
}
