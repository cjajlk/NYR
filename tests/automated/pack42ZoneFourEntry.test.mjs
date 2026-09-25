import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createZoneBackgroundTransition, ZONE_FOUR_BACKGROUND_SOURCE } from "../../src/core/zoneBackgroundTransition.js";
import { endGame, getRuntimeState } from "../../src/core/runtimeState.js";

export function verifyZoneFour({ app, frame, snapshot, hz, setBounds }) {
  for (const fail of [false, true]) {
    const sources = [];
    const background = createZoneBackgroundTransition({ zoneOneBackground: { render() {} }, createImage() {
      const events = {};
      return { naturalWidth: 1600, naturalHeight: 900, addEventListener(n, fn) { events[n] = fn; },
        set src(s) { sources.push(s); events[fail && s === ZONE_FOUR_BACKGROUND_SOURCE ? "error" : "load"](); } };
    } });
    assert.equal(sources[2], "./assets/images/zones/NYR_ZONE_04_LE_VIDE_V1.png");
    background.sync({ currentZone: "zone-2" }); background.update(1);
    background.sync({ currentZone: "zone-3" }); background.update(1);
    background.sync({ currentZone: "zone-4" });
    const context = { save() {}, restore() {}, drawImage() {} };
    for (let i = 0; i < hz / 2; i++) background.update(1 / hz);
    assert.ok(Math.abs(background.snapshot().progress - (fail ? 0 : 0.5)) < 1e-8);
    const frozen = background.snapshot();
    for (let i = 0; i < hz; i++) background.render(context, 956, 440);
    assert.deepEqual(background.snapshot(), frozen);
    for (let i = 0; i < hz / 2; i++) background.update(1 / hz);
    assert.equal(background.render(context, 956, 440).mode, fail ? "zone-three-fallback" : "zone-four");
  }
  const initial = snapshot(globalThis.probe);
  for (const entry of [42, 57]) {
    const p = globalThis.probe;
    const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    for (let i = 0; i < 27; i++) normal();
    p.portal.update(p.portal.snapshot());
    for (let i = 27; i < entry; i++) normal();
    p.exitPortal.update(p.exitPortal.snapshot());
    assert.deepEqual(p.zoneThreeObjective.snapshot(), { entryCount: entry, absorbed: 0 });
    const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
    p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
    assert.equal(p.zoneThreeObjective.snapshot().absorbed, 0);
    for (let i = 0; i < 19; i++) normal();
    assert.equal(p.zoneThreePortal.snapshot().active, false);
    normal();
    const portal = p.zoneThreePortal.snapshot();
    assert.equal(portal.active, true);
    assert.ok(Math.hypot(portal.x - p.movement.snapshot().x, portal.y - p.movement.snapshot().y) >= 140);
    assert.ok(portal.x >= 56 && portal.x <= 884 && portal.y >= 56 && portal.y <= 336);
    normal(); assert.deepEqual(p.zoneThreePortal.snapshot(), portal);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    const frozen = snapshot(p);
    for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), frozen);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.deepEqual(snapshot(p), frozen);
    const conserved = () => ({ movement: p.movement.snapshot(), stability: p.stability.snapshot(), score: p.score.snapshot(),
      progression: p.progression.snapshot(), fragments: p.fragmentSystem.snapshot(), asteroid: p.mobileAsteroid.snapshot(), pocket: p.pocket.snapshot() });
    p.stability.applyAsteroidContact();
    const touchingCorruption = p.fragmentSystem.snapshot().find(f => f.kind === "corruption");
    p.fragmentSystem.update({ ...touchingCorruption, trail: [] }, 940, 392);
    const before = conserved();
    p.zoneThreePortal.update(portal);
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-4");
    assert.equal(getRuntimeState().phase, "PLAYING");
    assert.equal(getRuntimeState().journeyComplete, false);
    assert.deepEqual(conserved(), before);
    assert.equal(p.progression.snapshot().currentForm, "nocturne");
    assert.equal(p.combo.snapshot().chain, 0);
    p.zoneThreePortal.update(portal); assert.deepEqual(conserved(), before);
    p.fragmentSystem.update({ ...touchingCorruption, trail: [] }, 940, 392);
    assert.deepEqual(conserved(), before, "continuous corruption contact is not rearmed by the portal");
    const corruption = p.fragmentSystem.snapshot().find(f => f.kind === "corruption");
    p.fragmentSystem.advanceCorruption(0.1, 940, 392);
    assert.notEqual(p.fragmentSystem.snapshot().find(f => f.kind === "corruption").x, corruption.x);
    p.pocket.update(0.1, "zone-4", 940, 392, { x: -1000, y: -1000 });
    assert.notEqual(p.pocket.snapshot().phase, "inactive");
    const asteroid = p.mobileAsteroid.snapshot();
    p.mobileAsteroid.update(0.1, 940, 392, { x: -1000, y: -1000 }, p.fragmentSystem.snapshot());
    assert.notEqual(p.mobileAsteroid.snapshot().x, asteroid.x);
    frame(); frame();
    const moved = p.movement.snapshot(); frame();
    assert.ok(Math.abs(Math.hypot(p.movement.snapshot().x - moved.x, p.movement.snapshot().y - moved.y) - 109.25 / hz) < 1e-8);
    endGame(); frame(); const dead = snapshot(p);
    for (let i = 0; i < hz; i++) frame();
    assert.deepEqual(snapshot(p), dead);
    if (entry === 57) {
      app.children.find(e => e.className === "return-menu").emit("click");
      app.children.find(e => e.className === "main-menu").children[1].emit("click");
    } else p.stabilityDisplay.gameOverElement.children[2].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
  }
}
if (!process.env.NYR_ZONE_FOUR_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_ZONE_FOUR_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 42 Zone four entry: tests OK");
}
