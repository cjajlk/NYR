import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, isRuntimeActive } from "../../src/core/runtimeState.js";

export function verifyCombatRuntime({app,frame,hz,setBounds}) {
  const mode=process.env.NYR_COMBAT_MODE;
  const menu=()=>app.children.find(e=>e.className==="main-menu");
  const label={story:"HISTOIRE",infinite:"VOYAGE INFINI",survival:"SURVIE"}[mode];
  function continueStory(){if(getRuntimeState().suspensionReasons.includes("story-narrative"))globalThis.probe.storyDisplay.element.children[0].children[4].emit("click");}
  function launch(){if(menu().children[0].textContent==="NYR")menu().children[1].emit("click");menu().children.find(e=>e.className==="mode-selection").children.find(e=>e.textContent===label).emit("click");continueStory();}
  let p=globalThis.probe;
  assert.equal(p.impulseCombat.trigger(),false,"menu rejects internal trigger");
  const writes=[];const save=localStorage.setItem;localStorage.setItem=(key,value)=>{writes.push({key,value});save(key,value);};
  launch();p=globalThis.probe;frame();
  function absorb(){p.fragmentSystem.update({...p.fragmentSystem.snapshot().find(f=>!f.kind),trail:[]},940,392);}
  function fill(){while(!p.astralImpulse.isReady())absorb();}
  function stageHead(at) {
    const previous=p.movement.snapshot();
    p.movement.reset(at.x/.38,at.y/.5);
    p.movement.addSegments(Math.max(0,previous.segmentCount-4));
    p.movement.update(previous.simulationTime,1e6,1e6,0); // Preserve Story's elapsed-time accounting.
  }
  fill();const head=p.movement.snapshot(),points=p.score.snapshot().points;
  assert.equal(p.impulseCombat.trigger(),true);
  assert.equal(p.astralImpulse.snapshot().energy,0);
  for(let i=0;i<hz*.45+2;i++)frame();
  assert.equal(p.impulseCombat.snapshot().active,false);
  assert.equal(p.impulseCombat.snapshot().x,head.x);assert.equal(p.impulseCombat.snapshot().y,head.y);
  assert.ok(p.movement.snapshot().simulationTime>0,"Nyr keeps moving normally");
  assert.ok(p.movement.snapshot().x>head.x);
  assert.equal(p.score.snapshot().points,points,"empty attack gives no reward");
  fill();p.impulseCombat.trigger();frame();frame();
  app.children.find(e=>e.className==="return-menu").emit("click");
  const paused=p.impulseCombat.snapshot();for(let i=0;i<hz;i++)frame();
  assert.deepEqual(p.impulseCombat.snapshot(),paused);
  assert.equal(p.impulseCombat.trigger(),false);
  app.children.find(e=>e.className==="pause-overlay").children[1].emit("click");frame();frame();
  assert.ok(p.impulseCombat.snapshot().elapsed>=paused.elapsed);
  while(!p.astralImpulse.isReady())absorb();
  const unused=p.astralImpulse.snapshot().energy;
  window.innerWidth=1000;window.innerHeight=450;setBounds({width:984,height:402});window.emit("resize");frame();
  assert.equal(p.impulseCombat.snapshot().active,false,"terrain dimensions cancel in-flight attack");
  assert.equal(p.astralImpulse.snapshot().energy,unused);
  // Put the actual logical head onto an unlocked portal using the movement API.
  while(!p.portal.snapshot().active)absorb();fill();
  const portal=p.portal.snapshot();stageHead(portal);
  assert.equal(p.impulseCombat.trigger(),true);
  const scoreAtPortal=p.score.snapshot().points;
  frame();
  assert.equal(p.zoneProgression.snapshot().currentZone,"zone-2");
  assert.equal(p.impulseCombat.snapshot().active,false,"portal has priority over offensive collision");
  assert.equal(p.astralImpulse.snapshot().energy,0,"no refund across portal");
  assert.equal(p.score.snapshot().points,scoreAtPortal);
  continueStory();fill();
  assert.equal(p.impulseCombat.trigger(),false,"fade blocks even when all images remain unloaded");
  assert.equal(p.astralImpulse.snapshot().energy,20);
  for(let i=0;i<hz*1.2+2;i++)frame();
  assert.equal(p.zoneBackgroundTransition.isCombatTransitioning(),false);
  // Generate a real corruption, then stage the logical head at its actual position.
  let attempts=0;
  while(!p.fragmentSystem.snapshot().some(f=>f.kind==="corruption")&&attempts++<100)absorb();
  const target=p.fragmentSystem.snapshot().find(f=>f.kind==="corruption");assert.ok(target);
  stageHead(target);fill();
  const before={score:p.score.snapshot().points,stability:p.stability.snapshot().stability,
    fragments:p.progression.snapshot().normalFragmentsAbsorbed,combo:p.combo.snapshot(),wallet:p.readWeekly().balance,
    damage:p.runStatistics.snapshot().damageEvents,energy:p.astralImpulse.snapshot().energy,writes:writes.length};
  assert.equal(p.impulseCombat.trigger(),true);p.impulseCombat.update(.01);
  p.fragmentSystem.advanceCorruption(.01,940,392);
  p.fragmentSystem.update(p.movement.snapshot(),940,392,p.impulseCombat);
  assert.equal(p.fragmentSystem.snapshot().some(f=>f.kind==="corruption"),false);
  assert.equal(p.score.snapshot().points,before.score+50);
  assert.equal(p.runStatistics.snapshot().score,before.score+50,"normal records read combat score");
  assert.equal(p.stability.snapshot().stability,before.stability);
  assert.equal(p.progression.snapshot().normalFragmentsAbsorbed,before.fragments);
  assert.deepEqual(p.combo.snapshot(),before.combo);
  assert.equal(p.readWeekly().balance,before.wallet);assert.equal(writes.length,before.writes);
  assert.equal(p.runStatistics.snapshot().damageEvents,before.damage);
  assert.equal(p.astralImpulse.snapshot().energy,0,"destruction never recharges");
  if(mode==="survival")assert.equal(p.actionEvents.snapshot().event,null,"new weather remains disabled in Survival");
  // A fresh charge can remain unused through the next actual portal; active pulse is cancelled.
  p.impulseCombat.cancel();fill();
  while(!p.exitPortal.snapshot().active)absorb();
  assert.equal(p.impulseCombat.trigger(),true);
  const chargeBefore=p.astralImpulse.snapshot().energy;
  p.exitPortal.update(p.exitPortal.snapshot());
  assert.equal(p.impulseCombat.snapshot().active,false);assert.equal(p.astralImpulse.snapshot().energy,chargeBefore);
  continueStory();
  assert.equal(isRuntimeActive(),true,JSON.stringify({state:getRuntimeState(),button:p.storyDisplay.element.children[0].children[4].textContent,disabled:p.storyDisplay.element.children[0].children[4].disabled}));
  p.zoneBackgroundTransition.update(1.01);fill();
  assert.equal(p.impulseCombat.trigger(),true,JSON.stringify({runtime:getRuntimeState(),energy:p.astralImpulse.snapshot(),combat:p.impulseCombat.snapshot(),transition:p.zoneBackgroundTransition.isCombatTransitioning()}));
  while(p.stability.snapshot().stability<100)p.stability.applyPureFragment();
  // The classic rock has no neutralization hook and remains damaging during an attack.
  for(let i=0;i<4;i++) {
    p.mobileAsteroid.update(0,940,392,{x:10000,y:10000},[]);
    const rock=p.mobileAsteroid.snapshot();p.mobileAsteroid.update(0,940,392,{x:rock.x,y:rock.y},[]);
  }
  assert.equal(getRuntimeState().gameOver,true);
  assert.equal(p.impulseCombat.snapshot().active,false);assert.equal(p.astralImpulse.snapshot().energy,0);
  const dead=p.impulseCombat;frame();p.stabilityDisplay.gameOverElement.children[2].emit("click");continueStory();p=globalThis.probe;
  assert.notEqual(p.impulseCombat,dead);assert.equal(p.impulseCombat.snapshot().elapsed,0);assert.equal(dead.trigger(),false);
  assert.equal(p.astralImpulse.snapshot().energy,0);
  if(mode==="survival") {
    p.movement.addSegments(116);
    let activeAtDeath=false;
    for(let i=0;i<hz*8&&!getRuntimeState().gameOver;i++) {
      while(p.stability.snapshot().stability<100)p.stability.applyPureFragment();
      if(!p.impulseCombat.isActive()){fill();p.impulseCombat.trigger();}
      const head=p.movement.snapshot();
      p.movement.aimAt(head.x+Math.cos(head.heading+Math.PI/2)*100,head.y+Math.sin(head.heading+Math.PI/2)*100);
      const activeBefore=p.impulseCombat.isActive();frame();
      if(getRuntimeState().gameOver)activeAtDeath=activeBefore;
    }
    assert.equal(getRuntimeState().gameOver,true,"physical self-collision is still fatal");
    assert.equal(activeAtDeath,true,"active impulse does not protect against body collision");
    assert.equal(p.stabilityDisplay.gameOverElement.children[1].textContent,"Autocollision");
    assert.equal(p.impulseCombat.snapshot().active,false);
    frame();p.stabilityDisplay.gameOverElement.children[2].emit("click");p=globalThis.probe;
  }
  fill();p.impulseCombat.trigger();
  app.children.find(e=>e.className==="return-menu").emit("click");
  app.children.find(e=>e.className==="pause-overlay").children[2].emit("click");
  assert.equal(p.impulseCombat.snapshot().active,false);assert.equal(p.astralImpulse.snapshot().energy,0);
  assert.equal(p.impulseCombat.trigger(),false,"abandoned session cannot fire again");
  assert.ok(writes.every(w=>!/^cj|impulse|combat|energy/i.test(w.key)),"no combat/CJ storage keys");
}
if(!process.env.NYR_COMBAT_TEST) {
  for(const mode of ["story","infinite","survival"])for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],
      {encoding:"utf8",env:{...process.env,NYR_COMBAT_TEST:"1",NYR_COMBAT_MODE:mode}});
    assert.equal(result.status,0,`${mode} ${hz}Hz\n${result.stdout}${result.stderr}`);
  }
  console.log("Combat Lot 2 runtime: actual main, all modes, score/economy, movement, pause, resize, portal/fade, classic rock, death, replay and quit OK");
}
