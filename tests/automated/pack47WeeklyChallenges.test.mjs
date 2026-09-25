import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { endGame } from "../../src/core/runtimeState.js";
import { createWeeklyChallenges, getLocalWeek, WEEKLY_KEY } from "../../src/gameplay/weeklyChallenges.js";

const challenge = (weekly, id) => weekly.snapshot().challenges.find(c => c.id === id);
function verifyStore() {
  assert.deepEqual(getLocalWeek(new Date(2021, 0, 3, 23, 59, 59)), { id:"2020-W53",start:"2020-12-28",end:"2021-01-03" });
  assert.equal(getLocalWeek(new Date(2021,0,4)).id,"2021-W01");
  assert.equal(getLocalWeek(new Date(2024,11,30)).id,"2025-W01");
  assert.equal(getLocalWeek(new Date(2026,2,29,23,59)).start,"2026-03-23");
  assert.equal(getLocalWeek(new Date(2026,2,30)).start,"2026-03-30");
  let date = new Date(2026,8,27,23,59,59);
  const data = new Map([["nyrStatisticsV1",'{"records":"unchanged"}']]);
  const storage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const options = {now:()=>date,getStorage:()=>storage};
  const weekly=createWeeklyChallenges(options);
  const metrics={normalFragments:0,cycles:0,activeTime:0,maxForm:"eclat",pureFragments:0};
  const observe=weekly.trackRun(()=>metrics);
  assert.equal(weekly.snapshot().balance,0);
  metrics.pureFragments=100;observe();assert.equal(challenge(weekly,"contact").progress,0);
  metrics.normalFragments=249;observe();assert.equal(challenge(weekly,"contact").completed,false);
  metrics.normalFragments=250;metrics.cycles=5;metrics.activeTime=1800;metrics.maxForm="devoreur";observe();
  assert.equal(challenge(weekly,"contact").completed,true);
  assert.equal(challenge(weekly,"traveler").completed,true);
  assert.equal(challenge(weekly,"endurance").completed,true);
  assert.equal(challenge(weekly,"master").completed,false);
  assert.equal(challenge(weekly,"master").progress,1800);
  for(let i=0;i<20;i++)observe();
  assert.equal(challenge(weekly,"evolution").progress,1);
  for(let i=0;i<2;i++)weekly.trackRun(()=>({normalFragments:300,cycles:2,activeTime:900,maxForm:"devoreur"}))();
  assert.ok(weekly.snapshot().challenges.every(c=>c.completed));
  assert.equal(challenge(weekly,"endurance").progress,1800,"completed goal remains capped at 30/30 minutes");
  assert.equal(weekly.snapshot().balance,0,"no automatic reward");
  const week=weekly.snapshot().week.id;
  assert.equal(weekly.claim("contact",week),true);
  assert.equal(weekly.snapshot().balance,50);
  const reloaded=createWeeklyChallenges(options);
  assert.equal(reloaded.claim("contact",week),false);
  for(const c of weekly.snapshot().challenges.slice(1)) {
    assert.equal(weekly.claim(c.id,week),true);
    assert.equal(weekly.claim(c.id,week),false);
  }
  assert.equal(weekly.snapshot().balance,500);
  assert.ok(createWeeklyChallenges(options).snapshot().challenges.every(c=>c.claimed));
  assert.equal(reloaded.claim("master",week),false,"another instance rereads the claim marker");
  date=new Date(2026,8,28);
  assert.equal(weekly.claim("master",week),false);
  assert.equal(weekly.snapshot().balance,500);
  assert.ok(weekly.snapshot().challenges.every(c=>c.progress===0&&!c.completed&&!c.claimed));
  observe();assert.equal(challenge(weekly,"evolution").progress,0,"old run cannot award Devoreur again");
  metrics.activeTime+=20;metrics.normalFragments+=2;observe();weekly.flush();
  assert.equal(challenge(weekly,"contact").progress,2);
  assert.equal(challenge(weekly,"master").progress,20);
  assert.equal(data.get("nyrStatisticsV1"),'{"records":"unchanged"}');
  assert.deepEqual(createWeeklyChallenges(options).snapshot(),weekly.snapshot());
  const expired=createWeeklyChallenges(options);
  expired.trackRun(()=>({normalFragments:250,cycles:0,activeTime:0,maxForm:"eclat"}))();
  const oldWeek=expired.snapshot().week.id;date=new Date(2026,9,5);
  const freshWeek=createWeeklyChallenges(options);
  assert.ok(freshWeek.snapshot().challenges.every(c=>c.progress===0&&!c.claimed));
  assert.equal(JSON.parse(data.get(WEEKLY_KEY)).weekId,freshWeek.snapshot().week.id,"rollover is saved on first launch");
  assert.equal(expired.claim("contact",oldWeek),false,"unclaimed expired reward");
  assert.equal(expired.snapshot().balance,500);
  const unavailable=createWeeklyChallenges({getStorage:()=>{throw Error("denied");}});
  unavailable.trackRun(()=>({normalFragments:250,cycles:0,activeTime:0,maxForm:"eclat"}))();
  assert.equal(unavailable.claim("contact",unavailable.snapshot().week.id),false);
  assert.equal(unavailable.snapshot().balance,0);
  data.set(WEEKLY_KEY,"invalid JSON");assert.equal(createWeeklyChallenges(options).snapshot().balance,0);
}

export function verifyWeeklyRuntime({app,frame,snapshot,hz,setBounds}) {
  const p=globalThis.probe, initial=snapshot(p);
  frame();frame();for(let i=0;i<hz;i++)frame();
  assert.ok(p.readWeekly().challenges.find(c=>c.id==="master").progress>0);
  const normal=()=>p.fragmentSystem.update({...p.fragmentSystem.snapshot()[0],trail:[]},940,392);
  for(const [count,portal] of [[25,p.portal],[15,p.exitPortal],[20,p.zoneThreePortal],[25,p.zoneFourPortal]]) {
    for(let i=0;i<count;i++)normal();
    frame();const before=p.readWeekly().challenges.find(c=>c.id==="traveler").progress;
    portal.update(portal.snapshot());frame();
    assert.equal(p.readWeekly().challenges.find(c=>c.id==="traveler").progress,before+(portal===p.zoneFourPortal?1:0));
  }
  const pure=p.fragmentSystem.snapshot().find(f=>f.kind==="pure");
  const fragments=p.readWeekly().challenges[0].progress;
  if(pure){p.fragmentSystem.update({...pure,trail:[]},940,392);frame();assert.equal(p.readWeekly().challenges[0].progress,fragments);}
  window.innerWidth=440;window.innerHeight=956;setBounds({width:424,height:908});window.emit("resize");frame();
  const frozen=p.readWeekly();for(let i=0;i<hz;i++)frame();assert.deepEqual(p.readWeekly(),frozen);
  window.innerWidth=956;window.innerHeight=440;setBounds({width:940,height:392});window.emit("resize");frame();
  const totals=p.readTotals();
  app.children.find(e=>e.className==="return-menu").emit("click");
  const menu=app.children.find(e=>e.className==="main-menu");
  const saved=globalThis.probe.readWeekly();assert.equal(saved.challenges[0].progress,85);
  menu.children.find(e=>e.textContent==="DÉFIS").emit("click");
  const panel=menu.children.find(e=>e.className==="challenges-panel");assert.equal(panel.hidden,false);
  for(let i=0;i<hz;i++)frame();assert.deepEqual(globalThis.probe.readWeekly(),saved);
  assert.deepEqual(globalThis.probe.readTotals(),totals,"abandon does not record a finished run");
  menu.children.find(e=>e.textContent==="RETOUR").emit("click");assert.equal(panel.hidden,true);
  menu.children[1].emit("click");assert.deepEqual(snapshot(globalThis.probe),initial);
  const next=globalThis.probe;
  for(let i=0;i<4;i++)next.stability.applyAsteroidContact();
  endGame();frame();
  const stopped=next.readWeekly();for(let i=0;i<hz;i++)frame();assert.deepEqual(next.readWeekly(),stopped);
  next.stabilityDisplay.gameOverElement.children[2].emit("click");
  assert.deepEqual(snapshot(globalThis.probe),initial);
}
if(!process.env.NYR_WEEKLY_TEST) {
  verifyStore();
  for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],{encoding:"utf8",env:{...process.env,NYR_WEEKLY_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 47 weekly challenges: tests OK");
}
