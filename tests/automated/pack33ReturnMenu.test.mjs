import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { endGame, getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyReturnMenu({ app, frame, snapshot, setBounds }) {
  const initial = snapshot(globalThis.probe);
  const root = document.fullscreenElement;
  for (const dead of [false, true]) {
    const old = globalThis.probe;
    const button = app.children.find(e => e.className === "return-menu");
    assert.equal(button.hidden, false);
    assert.equal(button.type, "button");
    frame(); frame();
    for (let i = 0; i < 65; i++) old.fragmentSystem.update(
      { ...old.fragmentSystem.snapshot()[0], trail: [] }, 940, 392);
    old.stability.applyAsteroidContact();
    assert.equal(old.score.snapshot().points, 24800);
    assert.equal(old.progression.snapshot().currentForm, "spectre");
    assert.ok(old.fragmentSystem.snapshot().some(f => f.kind === "corruption"));
    if (dead) {
      while (old.stability.snapshot().stability) old.stability.applyAsteroidContact();
      endGame(); frame();
      assert.equal(old.stabilityDisplay.gameOverElement.hidden, false);
      assert.equal(button.hidden, false);
    }
    window.innerWidth = 440; window.innerHeight = 956;
    setBounds({ width: 424, height: 908 }); window.emit("resize"); frame();
    assert.equal(button.hidden, true);
    button.emit("click"); assert.equal(globalThis.probe, old);
    window.innerWidth = 956; window.innerHeight = 440;
    setBounds({ width: 940, height: 392 }); window.emit("resize"); frame();
    assert.equal(globalThis.probe, old, "rotation does not return to menu");
    button.emit("click");
    const menuSession = globalThis.probe;
    assert.notEqual(menuSession, old);
    assert.equal(getRuntimeState().phase, "MENU");
    assert.equal(getRuntimeState().gameOver, false);
    assert.equal(isRuntimeActive(), false);
    const frozen = snapshot(menuSession);
    for (let i = 0; i < 120; i++) frame();
    assert.deepEqual(snapshot(menuSession), frozen);
    assert.equal(menuSession.score.snapshot().points, 0);
    assert.equal(menuSession.stability.snapshot().stability, 100);
    assert.equal(menuSession.fragmentSystem.snapshot().length, 0);
    assert.equal(app.children.find(e => e.className === "return-menu").hidden, true);
    const menu = app.children.find(e => e.className === "main-menu");
    for (const index of [2, 3]) {
      menu.children[index].emit("click");
      assert.equal(menu.children[5].hidden, false);
      menu.children[5].emit("click");
    }
    menu.children[1].emit("click");
    assert.deepEqual(snapshot(globalThis.probe), initial);
    assert.equal(getRuntimeState().phase, "PLAYING");
    assert.equal(document.fullscreenElement, root);
    button.emit("click");
    assert.equal(getRuntimeState().phase, "PLAYING", "detached controls cannot abandon a new session");
  }
  // The shared harness next verifies three full REJOUER cycles.
}
if (!process.env.NYR_RETURN_MENU_TEST) {
  for (const hz of [30, 60, 120]) {
    const result = spawnSync(process.execPath,
      [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: { ...process.env, NYR_RETURN_MENU_TEST: "1" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  console.log("PACK 33 return menu: tests OK");
}
