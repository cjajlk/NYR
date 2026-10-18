import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyImpulseRuntime({ app, frame, hz, setBounds }) {
  const mode = process.env.NYR_IMPULSE_MODE;
  const label = { story: "HISTOIRE", infinite: "VOYAGE INFINI", survival: "SURVIE" }[mode];
  const menu = () => app.children.find(e => e.className === "main-menu");
  function launch() {
    if (menu().children[0].textContent === "NYR") menu().children[1].emit("click");
    menu().children.find(e => e.className === "mode-selection").children.find(e => e.textContent === label).emit("click");
    if (mode === "story") globalThis.probe.storyDisplay.element.children[0].children[4].emit("click");
  }
  const writes = [];
  const originalWrite = localStorage.setItem;
  localStorage.setItem = (key, value) => { writes.push({key, value}); originalWrite(key, value); };
  launch(); let p = globalThis.probe;
  assert.equal(p.mode, mode);
  assert.equal(p.astralImpulse.snapshot().energy, 0);
  function absorb() {
    const before = p.progression.snapshot().normalFragmentsAbsorbed;
    const fragment = p.fragmentSystem.snapshot().find(f => !f.kind);
    // Real absorption geometry → original fragment callback → original main closure.
    p.fragmentSystem.update({ ...fragment, trail: [] }, 940, 392);
    const delta = p.progression.snapshot().normalFragmentsAbsorbed - before;
    assert.ok(delta > 0, "actual absorption happened");
    return delta;
  }
  for (const target of [1, 10, 19]) {
    while (p.progression.snapshot().normalFragmentsAbsorbed < target) absorb();
    assert.equal(p.astralImpulse.snapshot().energy, target);
    assert.equal(p.astralImpulse.isReady(), false);
  }
  const beforeRefusal = p.astralImpulse.snapshot();
  assert.equal(p.astralImpulse.consume(), false);
  assert.deepEqual(p.astralImpulse.snapshot(), beforeRefusal);
  absorb(); assert.equal(p.astralImpulse.isReady(), true);
  absorb(); assert.equal(p.astralImpulse.snapshot().energy, 20);
  const points = p.score.snapshot(), feedback = p.absorptionFeedback.snapshot(), writeCount = writes.length;
  assert.equal(p.astralImpulse.consume(), true);
  assert.equal(p.astralImpulse.snapshot().energy, 0);
  assert.deepEqual(p.score.snapshot(), points, "internal consumption creates no points");
  assert.deepEqual(p.absorptionFeedback.snapshot(), feedback, "internal consumption creates no effects");
  assert.equal(writes.length, writeCount, "no persistence for consumption");
  assert.equal(p.astralImpulse.consume(), false);
  const pure = p.fragmentSystem.snapshot().find(f => f.kind === "pure");
  assert.ok(pure);
  const pureCount = p.runStatistics.snapshot().pureFragments;
  const normalCount = p.progression.snapshot().normalFragmentsAbsorbed;
  p.fragmentSystem.update({ ...pure, trail: [] }, 940, 392);
  assert.equal(p.runStatistics.snapshot().pureFragments, pureCount + 1);
  assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, normalCount);
  assert.equal(p.astralImpulse.snapshot().energy, 0, "pure fragment does not charge");
  p.score.awardDodge();
  assert.equal(p.astralImpulse.snapshot().energy, 0, "score bonus does not charge");
  // Real manager event/geometry invokes main's onDodge (not a mocked callback).
  const options = { zone: "zone-1", width: 940, height: 392, head: {x: 400, y: 196} };
  const step = (n, head = options.head) => { for (let i = 0; i < n; i++) p.actionEvents.update(0.01, {...options, head}); };
  p.actionEvents.reset("zone-1"); step(7501); step(151);
  const meteor = p.actionEvents.snapshot().event.meteors[0];
  const scoreBeforeDodge = p.score.snapshot().points;
  step(1, {x:meteor.x + meteor.vx * 0.01 + (meteor.vy ? 40 : 0), y:meteor.y + meteor.vy * 0.01 + (meteor.vx ? 40 : 0)});
  step(2000, {x:10000,y:10000});
  assert.equal(p.score.snapshot().points, scoreBeforeDodge + 100);
  assert.equal(p.astralImpulse.snapshot().energy, 0, "real dodge callback does not charge");
  p.actionEvents.reset();
  // One complete set of actual portal callbacks; preserve a partial charge at each.
  for (const [index, key] of ["portal", "exitPortal", "zoneThreePortal", "zoneFourPortal"].entries()) {
    let attempts = 0;
    while (!p[key].snapshot().active && attempts++ < 100) absorb();
    assert.equal(p[key].snapshot().active, true);
    if (p.astralImpulse.isReady()) p.astralImpulse.consume();
    if (p.astralImpulse.snapshot().energy === 0) absorb();
    const savedEnergy = p.astralImpulse.snapshot().energy;
    assert.ok(savedEnergy > 0 && savedEnergy < 20);
    const stored = writes.length;
    p[key].update(p[key].snapshot());
    if (mode === "story" && index === 3) {
      assert.equal(getRuntimeState().journeyComplete, true);
      assert.equal(p.astralImpulse.snapshot().energy, 0, "completed Story releases charge");
      break;
    }
    assert.equal(p.astralImpulse.snapshot().energy, savedEnergy, `preserved across ${key}`);
    if (mode === "story") {
      assert.equal(isRuntimeActive(), false);
      for (let i = 0; i < hz; i++) frame();
      assert.equal(p.astralImpulse.snapshot().energy, savedEnergy);
      p.storyDisplay.element.children[0].children[4].emit("click");
    }
    assert.ok(writes.slice(stored).every(w => !/impulse|energy/i.test(w.key)), "portals never persist energy");
  }
  if (mode === "story") {
    p.storyDisplay.element.children[0].children[4].emit("click"); launch(); p = globalThis.probe;
    assert.equal(p.astralImpulse.snapshot().energy, 0);
    absorb();
  } else {
    assert.equal(p.zoneProgression.snapshot().currentZone, "zone-1");
    assert.ok(p.runStatistics.snapshot().cycles > 0);
    // A corruption object is cleared on zone-1 update; first enter zone 2 again.
    while (!p.portal.snapshot().active) absorb();
    p.portal.update(p.portal.snapshot());
    let attempts = 0;
    while (!p.fragmentSystem.snapshot().some(f => f.kind === "corruption") && attempts++ < 100) absorb();
    const target = p.fragmentSystem.snapshot().find(f => f.kind === "corruption");
    assert.ok(target);
    if (p.astralImpulse.isReady()) p.astralImpulse.consume();
    const before = p.astralImpulse.snapshot(), normalBefore = p.progression.snapshot().normalFragmentsAbsorbed;
    p.fragmentSystem.update({...target,trail:[]},940,392);
    assert.equal(p.progression.snapshot().normalFragmentsAbsorbed, normalBefore);
    assert.deepEqual(p.astralImpulse.snapshot(), before, "actual corruption contact does not charge");
  }
  if (p.astralImpulse.isReady()) p.astralImpulse.consume();
  while (p.astralImpulse.snapshot().energy < 7) absorb();
  const activeEnergy = p.astralImpulse.snapshot();
  assert.ok(activeEnergy.energy > 0 && activeEnergy.energy < 20);
  window.innerWidth = 390; window.innerHeight = 844; setBounds({width:374,height:796}); window.emit("resize"); frame();
  assert.ok(getRuntimeState().suspensionReasons.includes("portrait-orientation"));
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.astralImpulse.snapshot(), activeEnergy, "active game's partial charge survives portrait");
  window.innerWidth = 956; window.innerHeight = 440; setBounds({width:940,height:392}); window.emit("resize"); frame();
  assert.deepEqual(p.astralImpulse.snapshot(), activeEnergy);
  app.children.find(e => e.className === "return-menu").emit("click");
  const pausedEnergy = p.astralImpulse.snapshot();
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.astralImpulse.snapshot(), pausedEnergy);
  window.innerWidth = 390; window.innerHeight = 844; setBounds({width:374,height:796}); window.emit("resize"); frame();
  assert.ok(getRuntimeState().suspensionReasons.includes("portrait-orientation"));
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.astralImpulse.snapshot(), pausedEnergy);
  window.innerWidth = 956; window.innerHeight = 440; setBounds({width:940,height:392}); window.emit("resize"); frame();
  assert.deepEqual(p.astralImpulse.snapshot(), pausedEnergy);
  assert.ok(getRuntimeState().suspensionReasons.includes("user-pause"));
  const old = p.astralImpulse;
  app.children.find(e => e.className === "pause-overlay").children[2].emit("click");
  assert.equal(old.snapshot().energy, 0, "quit explicitly releases old session energy");
  launch(); p = globalThis.probe;
  assert.notEqual(p.astralImpulse, old);
  assert.equal(p.astralImpulse.snapshot().energy, 0);
  absorb();
  // Real classic asteroid contact → main's damage callback → local endGame cleanup.
  p.zoneProgression.sync({normalFragmentsAbsorbed:25}, true);
  p.mobileAsteroid.syncZone(p.zoneProgression.snapshot(),940,392,p.movement.snapshot(),[]);
  while (p.stability.snapshot().stability < 100) p.stability.applyPureFragment();
  for (let i = 0; i < 4; i++) {
    p.mobileAsteroid.update(0,940,392,{x:10000,y:10000},[]);
    const obstacle = p.mobileAsteroid.snapshot();
    p.mobileAsteroid.update(0,940,392,{x:obstacle.x,y:obstacle.y},[]);
  }
  assert.equal(getRuntimeState().gameOver, true);
  assert.equal(p.astralImpulse.snapshot().energy, 0);
  frame(); p.stabilityDisplay.gameOverElement.children[2].emit("click");
  p = globalThis.probe;
  if (mode === "story") p.storyDisplay.element.children[0].children[4].emit("click");
  assert.equal(p.astralImpulse.snapshot().energy, 0);
  const allowed = new Set(["nyrWeeklyChallengesV1", "nyrStatisticsV1", "nyrStoryStatisticsV1", "nyrSurvivalStatisticsV1"]);
  assert.ok(writes.every(w => allowed.has(w.key)), "no new storage key or global profile write");
  assert.ok(writes.every(w => !/"(?:energy|astralImpulse|impulse)"\s*:/.test(w.value)), "no energy in saved payloads");
}

if (!process.env.NYR_IMPULSE_TEST) {
  for (const mode of ["story", "infinite", "survival"]) for (const hz of [30,60,120]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./pack30Replay.test.mjs", import.meta.url)), String(hz)],
      { encoding: "utf8", env: {...process.env, NYR_IMPULSE_TEST:"1", NYR_IMPULSE_MODE:mode} });
    assert.equal(result.status,0,`${mode} ${hz}Hz\n${result.stdout}${result.stderr}`);
  }
  console.log("Astral impulse Lot 1 runtime: three modes, real absorptions/dodges/contacts/portals, cycles, pause, portrait, quit/death/replay and no persistence OK");
}
