import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

const hz = Number(process.argv[2]);
if (!hz) {
  for (const rate of [30, 60, 120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(rate)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 30 replay: tests OK");
} else {
  class Surface {
    listeners = new Map();
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name) { for (const fn of [...(this.listeners.get(name) ?? [])]) fn(); }
  }
  let bounds = { width: 940, height: 392 };
  const context = new Proxy({}, { get: (target, key) => target[key] ?? (() => ({ addColorStop() {} })) });
  class Element extends Surface {
    style = {}; children = []; hidden = false;
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    setAttribute() {}
    getBoundingClientRect() { return { ...bounds, left: 0, top: 0 }; }
    getContext() { return context; }
  }
  const app = new Element(), root = new Element();
  globalThis.document = Object.assign(new Surface(), { body: { dataset: {} }, documentElement: root,
    fullscreenElement: root, fullscreenEnabled: true, createElement: () => new Element(), querySelector: () => app });
  root.requestFullscreen = () => { throw Error("replay must not request fullscreen"); };
  document.exitFullscreen = () => { throw Error("replay must not exit fullscreen"); };
  globalThis.window = Object.assign(new Surface(), { innerWidth: 956, innerHeight: 440, devicePixelRatio: 2, visualViewport: new Surface() });
  globalThis.Image = class extends Surface {};
  let queue = [], timestamp = 0;
  globalThis.requestAnimationFrame = fn => queue.push(fn);
  Math.random = () => 0.4;
  const url = new URL("../../src/main.js", import.meta.url);
  let source = readFileSync(url, "utf8").replace(/from "(\.\/[^"]+)"/g, (_, path) => `from "${new URL(path, url).href}"`);
  source = source.replace("  gameLoop.start();", `
    globalThis.probe = { readWeekly: weeklyChallenges.snapshot, runStatistics, readTotals: statisticsStore.snapshot, timeDisplay, zoneFourObjective, zoneOneObjective, zoneFourPortal, voidDifficulty, zoneThreeObjective, zoneThreePortal, zoneTwoObjective, exitPortal, pocket, portal, combo, comboDisplay, movement, stability, progression, zoneProgression, score, fragmentSystem, mobileAsteroid,
      absorptionFeedback, zoneBackgroundTransition, farStarsParallax, midNebulaParallax,
      nearParticlesParallax, decorativeAsteroidsParallax, stabilityDisplay, gameLoop, canvas };
    gameLoop.start();`);
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const snapshot = p => Object.fromEntries(Object.entries(p).filter(([, value]) => value.snapshot).map(([key, value]) => [key, value.snapshot()]));
  const frame = () => { timestamp += 1000 / hz; const callbacks = queue; queue = []; callbacks.forEach(fn => fn(timestamp)); };
  const button = p => p.stabilityDisplay.gameOverElement.children[2];
  if (process.env.NYR_MENU_TEST) {
    const { verifyMenu } = await import("./pack31MainMenu.test.mjs");
    verifyMenu({ app, frame, snapshot, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_NAVIGATION_TEST) {
    const { verifyNavigation } = await import("./pack32MenuNavigation.test.mjs");
    verifyNavigation({ app, frame, snapshot, setBounds: value => { bounds = value; } });
  }
  app.children.find(item => item.className === "main-menu").children[1].emit("click");
  if (process.env.NYR_RETURN_MENU_TEST) {
    const { verifyReturnMenu } = await import("./pack33ReturnMenu.test.mjs");
    verifyReturnMenu({ app, frame, snapshot, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_COMBO_TEST) {
    const { verifyCombo } = await import("./pack34Combo.test.mjs");
    verifyCombo({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_CORRUPTION_MOTION_TEST) {
    const { verifyMotion } = await import("./pack35CorruptionMotion.test.mjs");
    verifyMotion({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_PORTAL_TEST) {
    const { verifyPortal } = await import("./pack36ZonePortal.test.mjs");
    verifyPortal({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_POCKET_TEST) {
    const { verifyPocket } = await import("./pack37CorruptionPocket.test.mjs");
    verifyPocket({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_ZONE_TWO_EXIT_TEST) {
    const { verifyZoneTwoExit } = await import("./pack38ZoneTwoExit.test.mjs");
    verifyZoneTwoExit({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_ZONE_THREE_TEST) {
    const { verifyZoneThree } = await import("./pack39ZoneThree.test.mjs");
    verifyZoneThree({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_INTENSITY_TEST) {
    const { verifyIntensity } = await import("./pack40ZoneThreeIntensity.test.mjs");
    verifyIntensity({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_NOCTURNE_TEST) {
    const { verifyNocturne } = await import("./pack41Nocturne.test.mjs");
    verifyNocturne({ app, frame, snapshot, hz });
  }
  if (process.env.NYR_ZONE_FOUR_TEST) {
    const { verifyZoneFour } = await import("./pack42ZoneFourEntry.test.mjs");
    verifyZoneFour({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_DEVOREUR_TEST) {
    const { verifyDevoreur } = await import("./pack43Devoreur.test.mjs");
    verifyDevoreur({ app, frame, snapshot, hz });
  }
  if (process.env.NYR_VOID_TEST) {
    const { verifyVoid } = await import("./pack44VoidSurvival.test.mjs");
    verifyVoid({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_INFINITE_TEST) {
    const { verifyInfinite } = await import("./pack45InfiniteJourney.test.mjs");
    verifyInfinite({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_STATS_TEST) {
    const { verifyStatistics } = await import("./pack46Statistics.test.mjs");
    verifyStatistics({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  if (process.env.NYR_WEEKLY_TEST) {
    const { verifyWeeklyRuntime } = await import("./pack47WeeklyChallenges.test.mjs");
    verifyWeeklyRuntime({ app, frame, snapshot, hz, setBounds: value => { bounds = value; } });
  }
  const initial = snapshot(globalThis.probe);
  for (let run = 0; run < 3; run++) {
    const p = globalThis.probe;
    assert.equal(button(p).hidden, true);
    button(p).emit("click"); assert.equal(globalThis.probe, p, "no restart during play");
    frame(); frame();
    assert.ok(p.movement.snapshot().simulationTime > 0);
    for (let i = 0; i < 65; i++) {
      p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail: [] }, bounds.width, bounds.height);
      if (p.portal.snapshot().active) p.portal.update(p.portal.snapshot());
    }
    assert.equal(p.score.snapshot().points, 23600);
    assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 65);
    assert.equal(p.progression.snapshot().currentForm, "spectre");
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-2");
    assert.equal(p.movement.snapshot().segmentCount, 69);
    assert.equal(p.mobileAsteroid.snapshot().active, true);
    p.stability.applyAsteroidContact();
    const pure = p.fragmentSystem.snapshot().find(item => item.kind === "pure");
    p.fragmentSystem.update({ ...pure, trail: [] }, bounds.width, bounds.height);
    assert.equal(p.stability.snapshot().stability, 95);
    const corruption = p.fragmentSystem.snapshot().find(item => item.kind === "corruption");
    while (p.stability.snapshot().stability > 0) {
      p.fragmentSystem.update({ x: -1000, y: -1000, trail: [] }, bounds.width, bounds.height);
      p.fragmentSystem.update({ ...corruption, trail: [] }, bounds.width, bounds.height);
    }
    frame(); assert.equal(button(p).hidden, false);
    assert.equal(getRuntimeState().gameOver, true);
    window.innerWidth = 440; window.innerHeight = 956;
    bounds = { width: 424, height: 908 }; window.emit("resize"); frame();
    assert.equal(button(p).hidden, true);
    button(p).emit("click"); assert.equal(globalThis.probe, p);
    window.innerWidth = 956; window.innerHeight = 440;
    bounds = { width: 940, height: 392 }; window.emit("resize"); frame();
    assert.equal(globalThis.probe, p, "rotation does not replay");
    assert.equal(button(p).hidden, false);
    button(p).emit("click");
    const fresh = globalThis.probe;
    assert.notEqual(fresh, p);
    assert.deepEqual(snapshot(fresh), initial, "all session state equals a fresh game");
    assert.equal(getRuntimeState().gameOver, false);
    assert.equal(isRuntimeActive(), true);
    assert.equal(fresh.stabilityDisplay.element.children[0].textContent, "STABILITÉ 100/100");
    assert.equal(fresh.stabilityDisplay.gameOverElement.hidden, true);
    button(p).emit("click"); assert.equal(globalThis.probe, fresh, "double click cannot replay twice");
    assert.equal(document.fullscreenElement, root);
    for (const event of ["resize", "orientationchange"]) assert.equal(window.listeners.get(event).size, 1);
    assert.equal(window.visualViewport.listeners.get("resize").size, 1);
    assert.equal(document.listeners.get("fullscreenchange").size, 1);
    assert.ok([...p.canvas.listeners.values()].every(listeners => listeners.size === 0));
    frame(); assert.deepEqual(snapshot(fresh), initial, "fresh baseline has no phantom simulation");
    assert.equal(queue.length, 1, "old loop is stopped");
    frame();
    assert.ok(fresh.movement.snapshot().simulationTime > 0);
    assert.equal(fresh.score.snapshot().points, 0);
    assert.equal(fresh.stability.snapshot().stability, 100);
  }
  globalThis.probe.gameLoop.stop(); frame(); assert.equal(queue.length, 0);
}
