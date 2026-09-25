import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyPause({app,frame,snapshot,hz,setBounds}) {
  const p=globalThis.probe, initial=snapshot(p), totals=p.readTotals();
  const find=cls=>app.children.find(e=>e.className===cls);
  const fullscreen=find("fullscreen-control");
  assert.equal(fullscreen.hidden,true);
  fullscreen.emit("click"); // fake API throws if a hidden control ever calls it
  frame();frame();
  const normal=()=>p.fragmentSystem.update({...p.fragmentSystem.snapshot()[0],trail:[]},940,392);
  for(const [count,portal] of [[25,p.portal],[15,p.exitPortal],[20,p.zoneThreePortal],[25,p.zoneFourPortal]]) {
    for(let i=0;i<count;i++)normal();
    portal.update(portal.snapshot());
  }
  for(let i=85;i<450;i++)normal();
  p.stability.applyAsteroidContact();
  const pure=p.fragmentSystem.snapshot().find(f=>f.kind==="pure");
  assert.ok(pure);p.fragmentSystem.update({...pure,trail:[]},940,392);frame();
  assert.equal(find("fragments-display").textContent,"FRAGMENTS 450");
  assert.equal(p.runStatistics.snapshot().normalFragments,450);
  assert.equal(p.runStatistics.snapshot().maxForm,"devoreur");
  const pauseButton=find("return-menu"), pause=find("pause-overlay");
  assert.equal(pauseButton.textContent,"PAUSE");
  assert.equal(pause.hidden,true);
  pauseButton.emit("click");
  assert.equal(isRuntimeActive(),false);assert.equal(pause.hidden,false);
  assert.equal(p.stabilityDisplay.gameOverElement.hidden,true);
  const frozen=snapshot(p), weekly=p.readWeekly(), timer=p.timeDisplay.element.textContent;
  for(let i=0;i<hz*3;i++)frame();
  assert.deepEqual(snapshot(p),frozen,"all timers, dangers, movement and contacts freeze");
  assert.deepEqual(p.readWeekly(),weekly);assert.equal(p.timeDisplay.element.textContent,timer);
  assert.deepEqual(p.readTotals(),totals,"pause does not finalize");
  assert.equal(fullscreen.hidden,true);
  window.innerWidth=440;window.innerHeight=956;setBounds({width:424,height:908});window.emit("resize");frame();
  assert.equal(pause.hidden,true);pause.children[1].emit("click");pause.children[2].emit("click");
  assert.equal(globalThis.probe,p);assert.equal(isRuntimeActive(),false);
  window.innerWidth=956;window.innerHeight=440;setBounds({width:940,height:392});window.emit("resize");frame();
  assert.equal(pause.hidden,false);assert.equal(isRuntimeActive(),false);
  assert.deepEqual(snapshot(p),frozen);assert.deepEqual(p.readWeekly(),weekly);
  pause.children[1].emit("click");
  assert.equal(isRuntimeActive(),true);assert.equal(pause.hidden,true);
  assert.deepEqual(snapshot(p),frozen,"resume preserves exact session");
  frame();assert.deepEqual(snapshot(p),frozen,"first resumed frame has no catch-up");
  frame();assert.ok(p.movement.snapshot().simulationTime>frozen.movement.simulationTime);
  pauseButton.emit("click");
  const run=p.runStatistics.snapshot(), acquired=p.readWeekly();
  pause.children[2].emit("click");
  assert.equal(getRuntimeState().phase,"MENU");assert.equal(getRuntimeState().gameOver,false);
  const recorded=globalThis.probe.readTotals();
  assert.equal(recorded.completedRuns,totals.completedRuns+1);
  assert.equal(recorded.bestScore,Math.max(totals.bestScore,run.score));
  assert.equal(recorded.bestTime,Math.max(totals.bestTime,run.activeTime));
  assert.equal(recorded.bestCombo,Math.max(totals.bestCombo,run.bestCombo));
  for(const key of ["normalFragments","pureFragments","cycles","damageEvents","stabilityLost"])
    assert.equal(recorded[key],totals[key]+run[key],key);
  for(const key of ["spectreReached","nocturneReached","devoreurReached"])assert.equal(recorded[key],totals[key]+1);
  assert.deepEqual(globalThis.probe.readWeekly(),acquired,"quit never duplicates weekly increments");
  pause.children[2].emit("click");pauseButton.emit("click");p.runStatistics.finish();
  assert.deepEqual(globalThis.probe.readTotals(),recorded,"finalization is idempotent");
  assert.equal(find("fullscreen-control").hidden,false);
  const menu=find("main-menu");menu.children.find(e=>e.textContent==="DÉFIS").emit("click");
  assert.equal(find("main-menu").children.find(e=>e.className==="challenges-panel").hidden,false);
  for(let i=0;i<hz;i++)frame();assert.deepEqual(globalThis.probe.readWeekly(),acquired);
  menu.children.find(e=>e.textContent==="RETOUR").emit("click");menu.children[1].emit("click");
  assert.deepEqual(snapshot(globalThis.probe),initial);
  assert.equal(find("fragments-display").textContent,"FRAGMENTS 0");
  assert.equal(find("fullscreen-control").hidden,true);
}
if(!process.env.NYR_PAUSE_TEST) {
  for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],{encoding:"utf8",env:{...process.env,NYR_PAUSE_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 48 pause and voluntary completion: tests OK");
}
