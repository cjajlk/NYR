import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyMenu({ app, frame, snapshot, setBounds }) {
  const p = globalThis.probe;
  const menu = app.children.find(item => item.className === "main-menu");
  const button = menu.children[1];
  assert.equal(getRuntimeState().phase, "MENU");
  assert.equal(isRuntimeActive(), false);
  assert.equal(menu.hidden, false);
  assert.equal(menu.children[0].textContent, "NYR");
  assert.equal(button.textContent, "JOUER");
  assert.equal(button.type, "button", "native click supports mouse, touch and keyboard");
  const initial = snapshot(p);
  for (let i = 0; i < 120; i++) frame();
  assert.deepEqual(snapshot(p), initial, "no gameplay behind menu");
  assert.equal(p.score.snapshot().points, 0);
  assert.equal(p.stability.snapshot().stability, 100);
  assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, 0);
  assert.equal(p.mobileAsteroid.snapshot().active, false);
  assert.equal(p.fragmentSystem.snapshot().length, 0);
  assert.equal(p.stabilityDisplay.element.hidden, true);
  window.innerWidth = 440; window.innerHeight = 956;
  setBounds({ width: 424, height: 908 });
  window.emit("resize"); frame();
  assert.equal(menu.hidden, true);
  button.emit("click");
  assert.equal(globalThis.probe, p);
  assert.equal(getRuntimeState().phase, "MENU");
  assert.ok(getRuntimeState().suspensionReasons.includes("portrait-orientation"));
  window.innerWidth = 956; window.innerHeight = 440;
  setBounds({ width: 940, height: 392 });
  window.emit("resize"); frame();
  document.emit("fullscreenchange"); frame();
  assert.equal(menu.hidden, false);
  assert.equal(globalThis.probe, p, "rotation/fullscreen never starts play");
  assert.deepEqual(snapshot(p), initial);
  // The shared integration harness then clicks JOUER and checks three complete
  // gameplay/Game Over/replay cycles, fresh snapshots and fullscreen preservation.
}

if (!process.env.NYR_MENU_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_MENU_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 31 main menu: tests OK");
}
