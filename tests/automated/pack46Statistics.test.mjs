import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createStatisticsStore, createRunStatistics, STATISTICS_KEY } from "../../src/gameplay/runStatistics.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";
export function verifyStatistics({ app, frame, snapshot, hz, setBounds }) {
  const progression = createNyrProgression();
  for (let i = 0; i <= 350; i++) {
    assert.equal(progression.snapshot().currentForm, i < 50 ? "eclat" : i < 150 ? "spectre" : i < 300 ? "nocturne" : "devoreur");
    progression.recordNormalFragmentAbsorption();
  }
  const data = new Map(); let writes = 0;
  const storage = { getItem: k => data.get(k) ?? null, setItem(k,v) { writes++; data.set(k,v); } };
  const store = createStatisticsStore(() => storage);
  const metrics = { score: 1000, activeTime: 72, normalFragments: 300, combo: 4, form: "devoreur" };
  const run = createRunStatistics(() => metrics, store);
  run.progress(); run.pure(); run.cycle(); run.damage(10,0); run.damage(0,0);
  metrics.combo = 1; run.progress(); run.finish(); run.finish(); run.finish();
  assert.equal(writes, 1);
  assert.equal(store.snapshot().damageEvents, 1); assert.equal(store.snapshot().stabilityLost, 10);
  assert.equal(store.snapshot().bestCombo, 4);
  for (const key of ["spectreReached","nocturneReached","devoreurReached"]) assert.equal(store.snapshot()[key], 1);
  assert.deepEqual(createStatisticsStore(() => storage).snapshot(), store.snapshot());
  const fresh = createRunStatistics(() => ({ score:0,activeTime:0,normalFragments:0,combo:1,form:"eclat" }), store);
  assert.equal(fresh.snapshot().pureFragments,0); assert.equal(store.snapshot().completedRuns,1);
  for (const raw of ["bad JSON", "null", '{"version":1,"totals":{"bestScore":-1,"bestCombo":99,"cycles":"bad"}}']) {
    const safe = createStatisticsStore(() => ({ getItem: () => raw }));
    assert.equal(safe.snapshot().bestScore,0); assert.equal(safe.snapshot().cycles,0);
  }
  const blocked = createStatisticsStore(() => { throw Error("denied"); });
  createRunStatistics(() => metrics, blocked).finish(); assert.equal(blocked.snapshot().completedRuns,1);
  assert.ok(data.has(STATISTICS_KEY));
  const initial = snapshot(globalThis.probe);
  const totals = globalThis.probe.readTotals();
  const p = globalThis.probe;
  frame(); frame();
  for (let i=0;i<hz;i++) frame();
  const normal = () => p.fragmentSystem.update({ ...p.fragmentSystem.snapshot()[0], trail:[] },940,392);
  for (const [count, portal] of [[25,p.portal],[15,p.exitPortal],[20,p.zoneThreePortal],[25,p.zoneFourPortal]]) {
    for(let i=0;i<count;i++) normal();
    const before = p.runStatistics.snapshot().cycles;
    portal.update(portal.snapshot());
    assert.equal(p.runStatistics.snapshot().cycles, before + (portal===p.zoneFourPortal ? 1:0));
  }
  for(let i=85;i<325;i++) normal();
  assert.equal(p.runStatistics.snapshot().normalFragments,325);
  assert.equal(p.runStatistics.snapshot().maxForm,"devoreur");
  assert.equal(p.runStatistics.snapshot().bestCombo,4);
  p.portal.update(p.portal.snapshot());
  const asteroid = p.mobileAsteroid.snapshot();
  p.mobileAsteroid.update(0,940,392,asteroid,p.fragmentSystem.snapshot());
  const hit = p.runStatistics.snapshot();
  p.mobileAsteroid.update(0,940,392,asteroid,p.fragmentSystem.snapshot());
  assert.deepEqual(p.runStatistics.snapshot(),hit);
  p.mobileAsteroid.update(0,940,392,{x:-1000,y:-1000},p.fragmentSystem.snapshot());
  p.mobileAsteroid.update(0,940,392,asteroid,p.fragmentSystem.snapshot());
  assert.equal(p.stability.snapshot().stability,50);
  const pure = p.fragmentSystem.snapshot().find(f=>f.kind==="pure");
  p.fragmentSystem.update({...pure,trail:[]},940,392);
  assert.equal(p.runStatistics.snapshot().pureFragments,1);
  assert.equal(p.runStatistics.snapshot().normalFragments,325);
  assert.equal(p.stability.snapshot().stability,70);
  window.innerWidth=440;window.innerHeight=956;
  setBounds({width:424,height:908});window.emit("resize");frame();
  const frozen=snapshot(p);for(let i=0;i<hz;i++)frame();assert.deepEqual(snapshot(p),frozen);
  window.innerWidth=956;window.innerHeight=440;
  setBounds({width:940,height:392});window.emit("resize");frame();
  for(let i=0;i<3;i++)p.stability.applyCorruptionContact();
  assert.equal(p.stability.snapshot().stability,10);
  normal(); // Ensures a Zone 2 corruption is present at the next canonical replacement if needed.
  while(!p.fragmentSystem.snapshot().some(f=>f.kind==="corruption"))normal();
  const corruption=p.fragmentSystem.snapshot().find(f=>f.kind==="corruption");
  p.fragmentSystem.update({x:-1000,y:-1000,trail:[]},940,392);
  p.fragmentSystem.update({...corruption,trail:[]},940,392);frame();
  const final=p.runStatistics.snapshot();
  assert.equal(final.damageEvents,6);assert.equal(final.stabilityLost,120);
  assert.equal(final.maxForm,"devoreur");assert.equal(final.cycles,1);
  assert.equal(final.bestCombo,4);
  const persistent=p.readTotals();assert.equal(persistent.completedRuns,totals.completedRuns+1);
  for(const key of ["spectreReached","nocturneReached","devoreurReached"])assert.equal(persistent[key],totals[key]+1);
  for(let i=0;i<hz;i++)frame();assert.deepEqual(p.runStatistics.snapshot(),final);assert.deepEqual(p.readTotals(),persistent);
  const summary=p.stabilityDisplay.gameOverElement.children[4];
  assert.equal(summary.hidden,false);assert.ok(summary.textContent.includes("Dévoreur"));assert.ok(summary.textContent.includes(String(final.score)));
  p.stabilityDisplay.gameOverElement.children[2].emit("click");
  assert.deepEqual(snapshot(globalThis.probe),initial);assert.deepEqual(globalThis.probe.readTotals(),persistent);
  const abandoned=globalThis.probe;
  abandoned.fragmentSystem.update({...abandoned.fragmentSystem.snapshot()[0],trail:[]},940,392);
  globalThis.quitToMenu();
  assert.equal(globalThis.probe.readTotals().completedRuns,persistent.completedRuns+1,"explicit quit records the run since PACK 48");
  assert.equal(globalThis.probe.readTotals().normalFragments,persistent.normalFragments+1);
  const menu=app.children.find(e=>e.className==="main-menu");
  menu.children.find(e=>e.textContent==="STATISTIQUES").emit("click");
  const panel=menu.children.find(e=>e.className==="statistics-grid");
  assert.equal(panel.hidden,false);assert.equal(panel.children.length,7);
  assert.equal(panel.children[0].children[1].textContent,String(persistent.bestScore));
  const idle=snapshot(globalThis.probe);for(let i=0;i<hz;i++)frame();assert.deepEqual(snapshot(globalThis.probe),idle);
  menu.children.find(e=>e.textContent==="RETOUR").emit("click");assert.equal(panel.hidden,true);
  menu.children[1].emit("click");assert.deepEqual(snapshot(globalThis.probe),initial);
}
if(!process.env.NYR_STATS_TEST){
  for(const hz of [30,60,120]){
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],
      {encoding:"utf8",env:{...process.env,NYR_STATS_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 46 forms and statistics: tests OK");
}
