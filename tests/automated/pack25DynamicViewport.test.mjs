import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";

const hz = Number(process.argv[2]);
if (!hz) {
  const css = readFileSync(new URL("../../assets/css/main.css", import.meta.url), "utf8");
  for (const selector of ["body", ".app-shell", ".preproduction-screen"]) {
    const block = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .find(([, selectors, declarations]) => selectors.trim() === selector && declarations.includes("100vh"))?.[2];
    assert.ok(block);
    assert.ok(block.indexOf("100vh") < block.indexOf("100svh"));
    assert.ok(block.indexOf("100svh") < block.indexOf("100dvh"));
  }
  const landscape = css.slice(css.indexOf("@media (max-height: 420px)"));
  assert.match(landscape, /padding: 0\.125rem 0\.5rem/);
  assert.match(landscape, /100vh - 0\.25rem[\s\S]*100svh - 0\.25rem[\s\S]*100dvh - 0\.25rem/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /border: 1px solid/);
  const main = readFileSync(new URL("../../src/main.js", import.meta.url), "utf8");
  assert.doesNotMatch(main, /visualViewport\.(?:height|width|scale)|requestFullscreen|screen\.height/);
  for (const rate of [30, 60, 120]) {
    const movement = createNyrMovement();
    movement.reset(844, 700);
    const before = movement.snapshot();
    const offset = movement.fitViewport(844, 280);
    assert.deepEqual(offset, { x: 0, y: 256 - before.y });
    movement.update(1 / rate, 844, 280);
    const after = movement.snapshot();
    assert.equal(after.y, 256, "head is kept visible at the nearest safe edge, not recentered");
    assert.ok(after.x > before.x && after.x - before.x < 10);
    assert.equal(after.segmentCount, before.segmentCount);
    assert.equal(after.simulationTime, 1 / rate);
    let recentered = false;
    for (let i = 0; i < rate * 10; i++) {
      const oldX = movement.snapshot().x;
      movement.update(1 / rate, 844, 280);
      if (movement.snapshot().x < oldX) { recentered = true; break; }
    }
    assert.ok(recentered, "actual subsequent edge crossing retains the technical fallback");
    for (const viewport of ["available", "absent", "portrait-start"]) {
      const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(rate), viewport], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
  }
  console.log("PACK 25 dynamic viewport: tests OK");
} else {
  // Run the real main module and gameplay modules with only browser surfaces stubbed.
  // The in-memory insertion exposes existing closures for observation; no disk fixture.
  class Surface {
    listeners = new Map();
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, []);
      this.listeners.get(name).push(fn);
    }
    emit(name) { return Promise.all((this.listeners.get(name) ?? []).map(fn => fn())); }
  }
  const portraitStart = process.argv[3] === "portrait-start";
  let bounds = portraitStart ? { width: 424, height: 908 } : { width: 828, height: 326 };
  let measurements = 0, bitmapWrites = 0;
  const context = new Proxy({}, { get(target, key) {
    return target[key] ?? (() => ({ addColorStop() {} }));
  } });
  class Element extends Surface {
    style = {}; children = []; hidden = false;
    append(...elements) { this.children.push(...elements); }
    replaceChildren(...elements) { this.children = elements; }
    setAttribute() {}
    getBoundingClientRect() { measurements++; return { ...bounds, left: 0, top: 0 }; }
    getContext() { return context; }
    set width(value) { this.bitmapWidth = value; bitmapWrites++; }
    set height(value) { this.bitmapHeight = value; bitmapWrites++; }
  }
  const app = new Element();
  globalThis.document = Object.assign(new Surface(), { body: { dataset: {} },
    createElement: () => new Element(), querySelector: () => app, documentElement: new Element(),
    fullscreenEnabled: process.argv[3] !== "absent", fullscreenElement: null });
  let interaction = false, fullscreenCalls = 0, rejectFullscreen = false, throwFullscreen = false;
  document.documentElement.requestFullscreen = function () {
    assert.equal(this, document.documentElement, "fullscreen target includes canvas and overlays");
    assert.equal(interaction, true, "request must happen inside the user interaction");
    fullscreenCalls++;
    if (throwFullscreen) throw new Error("Synchronous refusal");
    if (rejectFullscreen) return Promise.reject(new Error("Permission denied"));
    return Promise.resolve();
  };
  document.exitFullscreen = () => Promise.resolve();
  globalThis.window = Object.assign(new Surface(), { innerWidth: portraitStart ? 440 : 844, innerHeight: portraitStart ? 956 : 330, devicePixelRatio: 2 });
  if (process.argv[3] === "available") window.visualViewport = Object.assign(new Surface(), { width: 1, height: 1 });
  globalThis.Image = class extends Surface {};
  const frames = [];
  globalThis.requestAnimationFrame = fn => frames.push(fn);
  Math.random = () => 0.4;
  const url = new URL("../../src/main.js", import.meta.url);
  let source = readFileSync(url, "utf8").replace(/from "(\.\/[^"]+)"/g, (_, path) => `from "${new URL(path, url).href}"`);
  source = source.replace("  gameLoop.start();", `
    globalThis.probe = { canvas, movement, mobileAsteroid, stability, fragmentSystem, progression, score,
      farStarsParallax, midNebulaParallax, nearParticlesParallax, decorativeAsteroidsParallax,
      zoneBackgroundTransition, absorptionFeedback, orientationOverlay, gameLoop };
    gameLoop.start();`);
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const p = globalThis.probe;
  const fullscreenButton = app.children.find(element => element.className === "fullscreen-control");
  assert.ok(fullscreenButton);
  assert.equal(fullscreenCalls, 0, "no automatic fullscreen request");
  const clickFullscreen = () => {
    interaction = true;
    const result = fullscreenButton.emit("click");
    interaction = false;
    return result;
  };
  const snapshot = () => Object.fromEntries(Object.entries(p)
    .filter(([, value]) => typeof value.snapshot === "function")
    .map(([name, value]) => [name, value.snapshot()]));
  let timestamp = 0;
  const frame = (delta = 1000 / hz) => { timestamp += delta; assert.equal(frames.length, 1); frames.shift()(timestamp); };
  const resize = (width, height) => {
    window.innerWidth = width; window.innerHeight = height;
    bounds = { width: width - 16, height: height - 4 };
    window.emit("resize"); window.emit("orientationchange"); window.visualViewport?.emit("resize");
  };
  if (portraitStart) {
    const before = snapshot();
    for (let i = 0; i < hz; i++) frame();
    assert.equal(isRuntimeActive(), false);
    assert.deepEqual(snapshot(), before);
    resize(844, 330); frame(); frame();
    assert.ok(p.movement.snapshot().y < 326, "portrait startup must not leave the head below the landscape canvas");
  }
  frame(); frame();
  assert.ok(p.movement.snapshot().simulationTime > 0);
  assert.equal(p.canvas.bitmapHeight, 326 * 2, "container rect, never visualViewport dimensions");
  if (!document.fullscreenEnabled) {
    assert.equal(fullscreenButton.hidden, true);
    await clickFullscreen();
    assert.equal(fullscreenCalls, 0);
  } else {
    const before = snapshot();
    assert.equal(fullscreenButton.hidden, false);
    rejectFullscreen = true;
    await clickFullscreen();
    assert.equal(fullscreenButton.textContent, "RÉESSAYER PLEIN ÉCRAN");
    assert.equal(fullscreenButton.disabled, false);
    rejectFullscreen = false; throwFullscreen = true;
    await clickFullscreen();
    assert.equal(fullscreenButton.disabled, false);
    throwFullscreen = false;
    const clicked = clickFullscreen();
    assert.equal(fullscreenButton.disabled, true);
    const calls = fullscreenCalls;
    await clickFullscreen();
    assert.equal(fullscreenCalls, calls, "pending request ignores repeated taps");
    await clicked;
    document.fullscreenElement = document.documentElement;
    bounds.height = 400;
    const measured = measurements;
    await document.emit("fullscreenchange");
    window.emit("resize"); window.visualViewport?.emit("resize");
    frame(0);
    assert.equal(measurements, measured + 1);
    assert.equal(p.canvas.bitmapHeight, 800);
    assert.equal(fullscreenButton.textContent, "QUITTER PLEIN ÉCRAN");
    assert.deepEqual(snapshot(), before);
    await clickFullscreen();
    document.fullscreenElement = null;
    bounds.height = 326;
    await document.emit("fullscreenchange"); frame(0);
    assert.equal(p.canvas.bitmapHeight, 652, "fullscreenchange alone resizes after exit");
    assert.deepEqual(snapshot(), before, "entry and exit preserve gameplay");
    const request = document.documentElement.requestFullscreen;
    delete document.documentElement.requestFullscreen;
    await clickFullscreen();
    assert.equal(fullscreenButton.hidden, true, "missing method is handled even with fullscreenEnabled");
    document.documentElement.requestFullscreen = request;
    await document.emit("fullscreenchange"); frame(0);
  }
  for (const height of [380, 350, 390, 330, 370]) {
    const before = snapshot(), measured = measurements;
    resize(844, height);
    assert.deepEqual(snapshot(), before, "events never mutate gameplay");
    frame(0);
    assert.equal(measurements, measured + 1, "one measurement for three events");
    assert.equal(p.canvas.bitmapHeight, (height - 4) * 2);
    assert.deepEqual(snapshot(), before, "resizing does not reset Nyr, absorb or damage");
  }
  const writes = bitmapWrites;
  resize(844, 370); frame(0);
  assert.equal(bitmapWrites, writes, "unchanged size does not clear the canvas bitmap");
  if (window.visualViewport) {
    const before = snapshot();
    bounds.height = 360;
    window.visualViewport.emit("resize"); frame(0);
    assert.equal(p.canvas.bitmapHeight, 720, "visual viewport event alone triggers rect measurement");
    assert.deepEqual(snapshot(), before);
  }
  const frozen = snapshot();
  resize(390, 844);
  assert.equal(isRuntimeActive(), false, "portrait suspends before a frame can update");
  assert.equal(p.orientationOverlay.element.hidden, false);
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(snapshot(), frozen);
  resize(390, 800); frame(10000);
  if (document.fullscreenEnabled) {
    await clickFullscreen();
    document.fullscreenElement = document.documentElement;
    await document.emit("fullscreenchange"); frame(10000);
    assert.equal(isRuntimeActive(), false, "fullscreen never unlocks portrait");
    document.fullscreenElement = null;
    await document.emit("fullscreenchange"); frame(10000);
  }
  assert.deepEqual(snapshot(), frozen);
  resize(844, 370); frame(10000);
  assert.equal(isRuntimeActive(), true);
  assert.deepEqual(snapshot(), frozen, "resume frame establishes baseline without catch-up");
  frame();
  assert.deepEqual(snapshot(), frozen, "first active frame establishes the time baseline");
  frame();
  assert.ok(Math.abs(p.movement.snapshot().simulationTime - frozen.movement.simulationTime - 1 / hz) < 1e-9);
  assert.equal(p.stability.snapshot().stability, 100);
  assert.equal(p.score.snapshot().points, frozen.score.points);

  // Rotate after moving towards the bottom of a tall landscape world.
  resize(956, 440); frame(0);
  p.movement.aimAt(p.movement.snapshot().x, 10000);
  for (let i = 0; i < hz * 2; i++) frame();
  p.mobileAsteroid.syncZone({ currentZone: "zone-2" }, bounds.width, bounds.height, p.movement.snapshot());
  const contactHead = p.movement.snapshot(), contactAsteroid = p.mobileAsteroid.snapshot();
  p.mobileAsteroid.translate({ x: contactHead.x - contactAsteroid.x, y: contactHead.y - contactAsteroid.y });
  p.mobileAsteroid.update(0, bounds.width, bounds.height, contactHead);
  assert.equal(p.stability.snapshot().stability, 75);
  if (document.fullscreenEnabled) {
    const before = snapshot(), previousHeight = bounds.height;
    await clickFullscreen();
    document.fullscreenElement = document.documentElement;
    bounds.height += 60;
    await document.emit("fullscreenchange"); frame(0);
    assert.deepEqual(snapshot(), before, "fullscreen preserves a continuous asteroid contact");
    await clickFullscreen();
    document.fullscreenElement = null;
    bounds.height = previousHeight;
    await document.emit("fullscreenchange"); frame(0);
    assert.deepEqual(snapshot(), before, "exiting fullscreen cannot add a damage event or absorption");
  }
  for (const [width, height] of [[800, 360], [740, 260], [956, 440]]) {
    const before = snapshot();
    resize(440, 956); frame(10000);
    resize(700, 1100); frame(10000);
    assert.equal(isRuntimeActive(), false, "portrait is suspended even with large CSS viewport dimensions");
    assert.deepEqual(snapshot(), before);
    // Android can announce landscape before layout has finished rotating.
    window.innerWidth = width; window.innerHeight = height;
    window.emit("orientationchange"); frame(10000);
    assert.equal(isRuntimeActive(), false, "do not resume into a still-portrait container");
    assert.deepEqual(snapshot(), before);
    resize(width, height); frame(10000);
    const after = snapshot();
    assert.equal(isRuntimeActive(), true);
    assert.ok(after.movement.x >= 24 && after.movement.x <= bounds.width - 24);
    assert.ok(after.movement.y >= 24 && after.movement.y <= bounds.height - 24);
    for (const key of ["heading", "desiredHeading", "simulationTime", "segmentCount"]) {
      assert.equal(after.movement[key], before.movement[key], `rotation preserves ${key}`);
    }
    const dx = after.movement.x - before.movement.x, dy = after.movement.y - before.movement.y;
    assert.deepEqual(after.movement.trail, before.movement.trail.map(point => ({ x: point.x + dx, y: point.y + dy })), "whole trail translates rigidly, never resets or compresses");
    assert.deepEqual(after.mobileAsteroid, { ...before.mobileAsteroid,
      x: before.mobileAsteroid.x + dx, y: before.mobileAsteroid.y + dy }, "contact geometry and latch survive rotation");
    assert.deepEqual(after.stability, before.stability);
    assert.deepEqual(after.score, before.score);
    assert.deepEqual(after.progression, before.progression);
    frame(0); frame(0);
    assert.deepEqual(p.stability.snapshot(), before.stability, "no resize-generated contact");
    assert.deepEqual(p.score.snapshot(), before.score, "no resize-generated absorption");
  }

  // Trigger actual fatal-contact wiring in main, without adding a production reset API.
  p.mobileAsteroid.syncZone({ currentZone: "zone-2" }, 828, 366, p.movement.snapshot());
  while (p.stability.snapshot().stability > 0) {
    p.mobileAsteroid.update(0, 828, 366, { x: 10000, y: 10000 });
    p.mobileAsteroid.update(0, 828, 366, p.mobileAsteroid.snapshot());
  }
  assert.equal(getRuntimeState().gameOver, true);
  assert.equal(p.stability.snapshot().stability, 0);
  const ended = snapshot();
  if (document.fullscreenEnabled) {
    await clickFullscreen();
    document.fullscreenElement = document.documentElement;
    bounds.height += 40;
    await document.emit("fullscreenchange"); frame(10000);
    assert.deepEqual(snapshot(), ended);
    await clickFullscreen();
    document.fullscreenElement = null;
    bounds.height -= 40;
    await document.emit("fullscreenchange"); frame(10000);
    assert.equal(getRuntimeState().gameOver, true);
    assert.deepEqual(snapshot(), ended, "fullscreen entry/exit never unlocks Game Over");
  }
  for (const [width, height] of [[844, 330], [844, 390], [390, 844], [844, 370]]) {
    resize(width, height); frame(10000);
    for (let i = 0; i < hz; i++) frame();
    assert.equal(getRuntimeState().gameOver, true);
    assert.equal(isRuntimeActive(), false);
    assert.deepEqual(snapshot(), ended, "all gameplay remains frozen after Game Over");
  }
  p.gameLoop.stop(); frame(); assert.equal(frames.length, 0);
}
