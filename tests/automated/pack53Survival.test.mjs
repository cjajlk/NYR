import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hasSelfCollision, survivalSpeed } from "../../src/gameplay/survival.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createWeeklyChallenges, WEEKLY_KEY } from "../../src/gameplay/weeklyChallenges.js";
import { getRuntimeState } from "../../src/core/runtimeState.js";

function verifyPhysics() {
  const movement = createNyrMovement(); movement.reset(10000,10000); movement.addSegments(200);
  assert.equal(movement.snapshot().segmentCount,120);
  // Sustained maximum-turn circles at all five speeds: no neighbour false positives.
  for (let cycles=0; cycles<5; cycles++) {
    movement.reset(10000,10000); movement.addSegments(4);
    for (let i=0;i<90;i++) {
      const p=movement.snapshot();
      movement.aimAt(p.x+Math.cos(p.heading+Math.PI/2)*100,p.y+Math.sin(p.heading+Math.PI/2)*100);
      movement.update(1/60,10000,10000,survivalSpeed(cycles));
      assert.equal(hasSelfCollision(movement.snapshot()),false);
    }
  }
  // Long physical trajectory loops into the head; appearance fields never affect collision.
  const crossing={x:0,y:0,segmentCount:120,trail:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100},{x:0,y:0}]};
  for (const skin of ["classic","test","other"]) assert.equal(hasSelfCollision({...crossing,skin}),true);
  assert.equal(hasSelfCollision({...crossing,segmentCount:4}),false);
  assert.equal(hasSelfCollision({...crossing,trail:[{x:0,y:0}]}),false);
  for (let c=0;c<100;c++) assert.equal(survivalSpeed(c),[1,1.05,1.1,1.15,1.2][Math.min(4,c)]);
  // Technical recenter discards old trail, so never creates a ghost-body death.
  movement.reset(200,100); movement.addSegments(200);
  for (let i=0;i<300;i++) {movement.update(1/60,200,100);assert.equal(hasSelfCollision(movement.snapshot()),false);}
}
function verifyWallet() {
  let date=new Date(2026,9,11), fail=false;
  const saved=new Map([[WEEKLY_KEY,JSON.stringify({version:1,balance:750,ownedSkins:["test"],story:{completed:true}})]]);
  const storage={getItem:k=>saved.get(k)??null,setItem(k,v){if(fail)throw Error("quota");saved.set(k,v);}};
  const options={getStorage:()=>storage,now:()=>date};
  const w=createWeeklyChallenges(options), stale=createWeeklyChallenges(options);
  const week=w.snapshot().challenges;
  assert.deepEqual(w.recordSurvival({activeTime:299,maxLength:79,cycles:0}),[]);
  fail=true; assert.deepEqual(w.recordSurvival({activeTime:300,maxLength:80,cycles:1}),[]);
  assert.equal(w.snapshot().balance,750); fail=false;
  assert.equal(w.recordSurvival({activeTime:300,maxLength:80,cycles:1}).length,3);
  assert.equal(w.snapshot().balance,1000);
  assert.deepEqual(stale.recordSurvival({activeTime:999,maxLength:120,cycles:10}),[]);
  assert.deepEqual(w.snapshot().challenges,week);
  assert.equal(w.purchaseSkin("test"),false);
  date=new Date(2026,9,19); w.flush();
  const reload=createWeeklyChallenges(options);
  assert.equal(reload.survivalSnapshot().filter(c=>c.completed).length,3);
  assert.deepEqual(reload.recordSurvival({activeTime:999,maxLength:120,cycles:10}),[]);
  assert.equal(reload.snapshot().balance,1000);
  assert.deepEqual(reload.snapshot().ownedSkins,["test"]);
  assert.equal(reload.storySnapshot().completed,true);
}
export function verifySurvivalRuntime({app,frame,snapshot,hz}) {
  const menu=()=>app.children.find(e=>e.className==="main-menu");
  const modes=()=>menu().children.find(e=>e.className==="mode-selection");
  const walletBefore=localStorage.getItem(WEEKLY_KEY);
  localStorage.setItem(WEEKLY_KEY,JSON.stringify({version:1,balance:0,story:{completed:false}}));
  menu().children[1].emit("click");
  const locked=modes().children.find(e=>e.textContent==="SURVIE");
  assert.equal(locked.disabled,true);
  locked.disabled=false;const beforeLaunch=globalThis.probe;locked.emit("click");
  assert.equal(globalThis.probe,beforeLaunch,"forced locked click cannot start Survie");
  localStorage.setItem(WEEKLY_KEY,walletBefore);
  frame();
  modes().children.find(e=>e.textContent==="SURVIE").emit("click");
  let p=globalThis.probe;
  assert.equal(p.mode,"survival");
  const week=p.readWeekly().challenges;
  const initialTotals=p.readTotals();
  frame();frame();
  for(let cycle=0;cycle<6;cycle++) {
    for(const [count,key] of [[25,"portal"],[15,"exitPortal"],[20,"zoneThreePortal"],[25,"zoneFourPortal"]]) {
      for(let i=0;i<count;i++)p.fragmentSystem.update({...p.fragmentSystem.snapshot()[0],trail:[]},940,392);
      p[key].update(p[key].snapshot());
      assert.equal(getRuntimeState().gameOver,false);
    }
    assert.equal(p.zoneProgression.snapshot().currentZone,"zone-1");
    const before=p.movement.snapshot();frame();const after=p.movement.snapshot();
    assert.ok(Math.abs(Math.hypot(after.x-before.x,after.y-before.y)/(after.simulationTime-before.simulationTime)-95*survivalSpeed(cycle+1))<1e-6);
  }
  assert.equal(p.readWeekly().balance,200,"length and cycle rewards once");
  assert.deepEqual(p.readWeekly().challenges,week,"permanent challenges independent of weekly");
  // Pause freezes every simulation component, including time and collisions.
  app.children.find(e=>e.className==="return-menu").emit("click");
  const paused=snapshot(p);for(let i=0;i<hz;i++)frame();assert.deepEqual(snapshot(p),paused);
  app.children.find(e=>e.className==="pause-overlay").children[1].emit("click");
  frame();assert.equal(getRuntimeState().gameOver,false);
  // Five minutes of real active frames (technical edge recenter preserves elapsed time).
  for(let i=0;i<hz*301;i++) { p.stability.applyPureFragment(); frame(); }
  assert.equal(p.readWeekly().balance,250);
  assert.deepEqual(p.readWeekly().challenges,week);
  // Runtime receives a physical self-contact; summary and one finalization survive repeated frames.
  // Movement API is frozen: induce a loop with actual steering instead of replacing it.
  p.movement.addSegments(116);
  let died=false;
  for(let i=0;i<hz*5;i++) {
    const s=p.movement.snapshot();p.movement.aimAt(s.x+Math.cos(s.heading+Math.PI/2)*100,s.y+Math.sin(s.heading+Math.PI/2)*100);
    frame(); if(getRuntimeState().gameOver){died=true;break;}
  }
  assert.equal(died,true);assert.equal(p.stabilityDisplay.gameOverElement.children[1].textContent,"Autocollision");
  assert.deepEqual(p.readTotals(),initialTotals,"infinite records untouched");
  const stats=JSON.parse(localStorage.getItem("nyrSurvivalStatisticsV1")).totals;
  assert.equal(stats.completedRuns,1);assert.equal(stats.bestCycles,6);assert.equal(stats.bestLength,120);
  assert.ok(stats.bestTime>=300);
  for(let i=0;i<hz;i++)frame();assert.equal(JSON.parse(localStorage.getItem("nyrSurvivalStatisticsV1")).totals.completedRuns,1);
  p.stabilityDisplay.gameOverElement.children[3].emit("click");
  assert.equal(menu().children[0].textContent,"MODES");
  modes().children.find(e=>e.textContent==="SURVIE").emit("click");p=globalThis.probe;
  assert.equal(p.stability.snapshot().stability,100);assert.equal(p.movement.snapshot().segmentCount,4);
}
if(!process.env.NYR_SURVIVAL_TEST) {
  verifyPhysics();verifyWallet();
  for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],{encoding:"utf8",env:{...process.env,NYR_SURVIVAL_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 53 Survie: physics, runtime, cycles, pause, migration and rewards OK");
}
