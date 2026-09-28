import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createWeeklyChallenges, WEEKLY_KEY, getLocalWeek } from "../../src/gameplay/weeklyChallenges.js";
import { createCosmeticsStore, COSMETICS_KEY } from "../../src/gameplay/cosmetics.js";
import { endGame, getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

function verifyPersistence() {
  let date = new Date(2026, 8, 28), fail = false;
  const original = {version:1,weekId:getLocalWeek(date).id,balance:800,ownedSkins:["test"],
    progress:{normalFragments:250,cycles:5,devoreurRuns:3,activeTime:3600},claimed:{contact:true}};
  const cosmetics = JSON.stringify({version:2,equipped:{skin:"test"}});
  const stats = '{"version":1,"totals":{"cycles":50,"completedRuns":100}}';
  const saved = new Map([[WEEKLY_KEY,JSON.stringify(original)],[COSMETICS_KEY,cosmetics],["nyrStatisticsV1",stats]]);
  const storage = {getItem:key=>saved.get(key)??null,setItem(key,value){if(fail)throw Error("quota");saved.set(key,value);}};
  const options = {getStorage:()=>storage,now:()=>date};
  const wallet = createWeeklyChallenges(options), stale = createWeeklyChallenges(options);
  assert.equal(wallet.storySnapshot().completed,false,"old infinite runs never unlock Story");
  assert.equal(createCosmeticsStore(wallet,()=>storage).snapshot().equipped.skin,"test");
  assert.equal(saved.get(COSMETICS_KEY),cosmetics); assert.equal(saved.get("nyrStatisticsV1"),stats);
  assert.equal(wallet.snapshot().balance,800);
  assert.equal(wallet.recordStoryChapter(1,{time:240,score:100,stability:50,combo:1}),true);
  assert.equal(wallet.snapshot().balance,800,"completion alone earns nothing");
  assert.equal(wallet.recordStoryChapter(1,{time:170,score:200,stability:50,combo:1}),true);
  assert.equal(wallet.snapshot().balance,825,"one real objective pays 25");
  fail=true;
  assert.equal(wallet.recordStoryChapter(4,{time:100,score:400,stability:100,combo:4}),false);
  assert.equal(wallet.storySnapshot().completed,false); assert.equal(wallet.snapshot().balance,825);
  fail=false;
  const beforeChallenges = wallet.snapshot().challenges;
  for(let chapter=1;chapter<=4;chapter++) {
    assert.equal(wallet.recordStoryChapter(chapter,{time:90,score:1000,stability:100,combo:4}),true);
  }
  assert.equal(wallet.snapshot().balance,1100,"12 unique objectives cap Story rewards at 300");
  assert.equal(Object.keys(wallet.storySnapshot().rewarded).length,12);
  for(let chapter=1;chapter<=4;chapter++) stale.recordStoryChapter(chapter,{time:100,score:2000,stability:100,combo:4});
  assert.equal(wallet.snapshot().balance,1100,"stale instance cannot pay twice");
  assert.deepEqual(wallet.snapshot().challenges,beforeChallenges);
  const reloaded = createWeeklyChallenges(options);
  assert.equal(reloaded.storySnapshot().completed,true);
  assert.deepEqual(reloaded.storySnapshot().records[1],{time:90,score:2000});
  assert.equal(reloaded.snapshot().balance,1100);
  assert.equal(reloaded.recordStoryChapter(2,{time:0,score:0,stability:0,combo:4}),false);
  date=new Date(2026,9,5); reloaded.flush();
  assert.equal(reloaded.storySnapshot().completed,true);
  assert.equal(Object.keys(reloaded.storySnapshot().rewarded).length,12);
  assert.equal(reloaded.snapshot().balance,1100);
  assert.deepEqual(reloaded.snapshot().ownedSkins,["test"]);
  assert.equal(saved.get(COSMETICS_KEY),cosmetics); assert.equal(saved.get("nyrStatisticsV1"),stats);
  // The same wallet is spendable in the unchanged shop.
  const poor = new Map(); const store={getItem:k=>poor.get(k)??null,setItem:(k,v)=>poor.set(k,v)};
  const w=createWeeklyChallenges({getStorage:()=>store});
  store.setItem(WEEKLY_KEY,JSON.stringify({version:1,balance:725}));
  w.recordStoryChapter(1,{time:100,score:100,stability:50,combo:1});
  assert.equal(w.snapshot().balance,750);
  assert.equal(createCosmeticsStore(w,()=>store).purchase("test"),true);
  assert.equal(w.snapshot().balance,0);
  assert.equal(w.storySnapshot().rewarded["1:time"],true);
}

export function verifyStoryRuntime({app,frame,snapshot,hz,setBounds}) {
  const menu=()=>app.children.find(e=>e.className==="main-menu");
  const modes=()=>menu().children.find(e=>e.className==="mode-selection");
  const action=label=>modes().children.find(e=>e.textContent===label);
  const continueStory=()=>globalThis.probe.storyDisplay.element.children[0].children[4].emit("click");
  const playStory=()=>{if(modes().hidden)menu().children[1].emit("click");action("HISTOIRE").emit("click");};
  const spin=()=>{for(let i=0;i<hz;i++)frame();};
  const first=globalThis.probe;
  menu().children[1].emit("click");
  assert.equal(menu().children[0].textContent,"MODES");
  assert.equal(action("HISTOIRE").disabled,false);
  assert.equal(action("VOYAGE INFINI").disabled,true);
  action("VOYAGE INFINI").disabled=false;
  action("VOYAGE INFINI").emit("click");
  assert.equal(globalThis.probe,first,"runtime guard refuses a forced locked click");
  const idle=snapshot(first);spin();assert.deepEqual(snapshot(first),idle);
  playStory();
  let p=globalThis.probe;
  assert.equal(p.mode,"story");assert.equal(isRuntimeActive(),false);
  assert.equal(p.readCosmetics().equipped.skin,"test","equipped PACK 50 skin preserved in Story");
  const intro=snapshot(p);spin();assert.deepEqual(snapshot(p),intro);
  assert.equal(p.storyDisplay.element.hidden,false);
  window.innerWidth=360;window.innerHeight=800;setBounds({width:344,height:760});window.emit("resize");frame();
  assert.equal(p.storyDisplay.element.hidden,true);continueStory();assert.equal(isRuntimeActive(),false);
  window.innerWidth=956;window.innerHeight=440;setBounds({width:940,height:392});window.emit("resize");frame();
  assert.equal(p.storyDisplay.element.hidden,false);continueStory();
  assert.equal(isRuntimeActive(),true);assert.equal(p.stability.snapshot().stability,100);
  frame();frame();assert.ok(p.movement.snapshot().simulationTime>0);
  // Quit and death never complete Story or pay incomplete objectives.
  app.children.find(e=>e.className==="return-menu").emit("click");
  const paused=snapshot(p);spin();assert.deepEqual(snapshot(p),paused);
  app.children.find(e=>e.className==="pause-overlay").children[2].emit("click");
  assert.equal(globalThis.probe.readStory().completed,false);assert.equal(globalThis.probe.readWeekly().balance,0);
  assert.equal(menu().children[0].textContent,"MODES");
  playStory();continueStory();p=globalThis.probe;
  endGame();frame();
  assert.equal(p.readStory().completed,false);
  assert.deepEqual(p.readStory().rewarded,{});
  p.stabilityDisplay.gameOverElement.children[2].emit("click");
  p=globalThis.probe;assert.equal(p.mode,"story");continueStory();
  const infiniteTotals=p.readTotals();
  for(let chapter=1;chapter<=4;chapter++) {
    const count=[25,15,20,25][chapter-1];
    for(let i=0;i<count;i++)p.fragmentSystem.update({...p.fragmentSystem.snapshot()[0],trail:[]},940,392);
    const portal=[p.portal,p.exitPortal,p.zoneThreePortal,p.zoneFourPortal][chapter-1];
    assert.equal(portal.snapshot().active,true);
    const before={score:p.score.snapshot(),stability:p.stability.snapshot(),movement:p.movement.snapshot(),progression:p.progression.snapshot()};
    portal.update(portal.snapshot());
    assert.equal(isRuntimeActive(),false);assert.equal(p.storyDisplay.element.hidden,false);
    assert.deepEqual({score:p.score.snapshot(),stability:p.stability.snapshot(),movement:p.movement.snapshot(),progression:p.progression.snapshot()},before);
    assert.equal(p.readWeekly().balance,chapter*75);
    const frozen=snapshot(p);spin();assert.deepEqual(snapshot(p),frozen);
    assert.equal(p.zoneProgression.snapshot().currentZone,`zone-${Math.min(chapter+1,4)}`);
    if(chapter<4)continueStory();
  }
  assert.equal(getRuntimeState().journeyComplete,true);
  assert.equal(p.readStory().completed,true);assert.equal(p.readWeekly().balance,300);
  assert.equal(p.zoneProgression.snapshot().currentZone,"zone-4","Story never loops");
  assert.deepEqual(p.readTotals(),infiniteTotals,"Story runs never alter Infinite records");
  assert.equal(p.readCosmetics().equipped.skin,"test");
  assert.equal(JSON.parse(localStorage.getItem("nyrStoryStatisticsV1")).totals.completedRuns,3,"quit, death, completion counted exactly once");
  continueStory();
  assert.equal(menu().children[0].textContent,"MODES");
  assert.equal(action("VOYAGE INFINI").disabled,false);
  playStory();continueStory();
  assert.equal(globalThis.probe.progression.snapshot().normalFragmentsAbsorbed,0);
  assert.equal(globalThis.probe.stability.snapshot().stability,100);
  assert.equal(globalThis.probe.readWeekly().balance,300);
  app.children.find(e=>e.className==="return-menu").emit("click");
  app.children.find(e=>e.className==="pause-overlay").children[2].emit("click");
  action("VOYAGE INFINI").emit("click");p=globalThis.probe;
  assert.equal(p.mode,"infinite");assert.equal(isRuntimeActive(),true);
  assert.equal(p.readCosmetics().equipped.skin,"test","same equipped skin in Infinite");
  for(const [count,key] of [[25,"portal"],[15,"exitPortal"],[20,"zoneThreePortal"],[25,"zoneFourPortal"]]) {
    for(let i=0;i<count;i++)p.fragmentSystem.update({...p.fragmentSystem.snapshot()[0],trail:[]},940,392);
    p[key].update(p[key].snapshot());
    assert.equal(isRuntimeActive(),true);
  }
  assert.equal(p.zoneProgression.snapshot().currentZone,"zone-1");
  assert.equal(getRuntimeState().journeyComplete,false);
  assert.equal(p.readWeekly().balance,300);
}
if(!process.env.NYR_STORY_TEST) {
  verifyPersistence();
  for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],
      {encoding:"utf8",env:{...process.env,NYR_STORY_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 51 Story, modes, persistence and unique rewards: tests OK");
}
