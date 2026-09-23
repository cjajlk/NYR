import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyNavigation({ app, frame, snapshot, setBounds }) {
  const p = globalThis.probe;
  const menu = app.children.find(item => item.className === "main-menu");
  const [title, play, options, about, name, back] = menu.children;
  const initial = snapshot(p);
  const root = document.fullscreenElement;
  assert.deepEqual([play, options, about].map(b => b.textContent), ["JOUER", "OPTIONS", "À PROPOS"]);
  for (const b of [play, options, about, back]) assert.equal(b.type, "button");
  for (const [button, heading] of [[options, "OPTIONS"], [about, "À PROPOS"]]) {
    button.emit("click");
    assert.equal(title.textContent, heading);
    assert.equal(back.hidden, false);
    assert.equal(play.hidden, true);
    assert.equal(name.hidden, button !== about);
    assert.equal(name.textContent, "NYR");
    for (let i = 0; i < 120; i++) frame();
    play.emit("click");
    assert.equal(globalThis.probe, p, "hidden JOUER cannot start gameplay");
    assert.equal(isRuntimeActive(), false);
    assert.equal(getRuntimeState().phase, "MENU");
    assert.deepEqual(snapshot(p), initial);
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 });
    window.emit("resize"); frame();
    assert.equal(menu.hidden, true);
    back.emit("click");
    assert.equal(title.textContent, heading, "portrait cannot navigate");
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 });
    window.emit("resize"); frame();
    assert.equal(menu.hidden, false);
    assert.equal(title.textContent, heading);
    document.fullscreenElement = null;
    document.emit("fullscreenchange"); frame();
    assert.equal(title.textContent, heading);
    document.fullscreenElement = root;
    document.emit("fullscreenchange"); frame();
    assert.deepEqual(snapshot(p), initial);
    assert.equal(document.fullscreenElement, root);
    back.emit("click");
    assert.equal(title.textContent, "NYR");
    assert.equal(back.hidden, true);
    for (const b of [play, options, about]) assert.equal(b.hidden, false);
  }
  // The shared harness now tests JOUER and three full Game Over/REJOUER cycles.
}
if (!process.env.NYR_NAVIGATION_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_NAVIGATION_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 32 menu navigation: tests OK");
}
