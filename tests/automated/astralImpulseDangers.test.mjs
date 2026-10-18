import assert from "node:assert/strict";
import { createAstralImpulse } from "../../src/gameplay/astralImpulse.js";
import { createAstralImpulseCombat } from "../../src/gameplay/astralImpulseCombat.js";
import { createActionEvents } from "../../src/gameplay/actionEvents.js";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";
import { createCorruptionPocket } from "../../src/gameplay/corruptionPocket.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createZoneBackgroundTransition } from "../../src/core/zoneBackgroundTransition.js";

function rig() {
  let head={x:10000,y:10000}; const energy=createAstralImpulse(),score=createNyrScore(),stability=createNyrStability();
  const combat=createAstralImpulseCombat({energy,readHead:()=>head,readState:()=>({active:true}),onNeutralized:()=>score.awardNeutralizedDanger()});
  return {energy,combat,score,stability,head:value=>{head=value;},fire(position){head=position;while(!energy.isReady())energy.absorbNormalFragment();assert.equal(combat.trigger(),true);}};
}
function weather(r,zone="zone-3",random=()=>.999) {
  const system=createActionEvents({random,onDamage:n=>n===25?r.stability.applyAsteroidContact():r.stability.applyCorruptionContact(),onDodge:()=>r.score.awardDodge()});
  const options={zone,width:600,height:320,head:{x:10000,y:10000}};
  system.reset(zone);
  const step=(dt=.01,head=options.head)=>{r.combat.update(dt);system.update(dt,{...options,head,impulse:r.combat});};
  function wait(kind,phase) {
    for(let i=0;i<50000;i++){if(system.snapshot().event?.kind===kind&&system.snapshot().event.phase===phase)return system.snapshot().event;step();}
    throw Error(`No ${kind} ${phase}`);
  }
  return {system,step,wait};
}
for(const hz of [20,30,60,120]) {
  const r=rig(),w=weather(r,"zone-1"); const rain=w.wait("rain","active"),m=rain.meteors[0];
  const head={x:m.x,y:m.y}; r.fire(head);
  w.step(1/hz,head);
  const after=w.system.snapshot().event;
  assert.equal(after.meteors[0].done,true);
  assert.equal(after.meteors[0].neutralized,true);
  assert.equal(r.stability.snapshot().stability,100,"destroyed meteor cannot deal -25 in the same step");
  assert.equal(r.score.snapshot().points,50);
  for(let i=0;i<hz*16;i++)w.step(1/hz);
  assert.equal(r.score.snapshot().points,50,"no later +100 or repeated destruction");
  assert.equal(r.stability.snapshot().stability,100);
}
{
  const r=rig(),w=weather(r); const warning=w.wait("rain","warning");
  r.fire(warning.meteors[0]);for(let i=0;i<40;i++)w.step();
  assert.ok(w.system.snapshot().event.meteors.every(m=>!m.done));assert.equal(r.score.snapshot().points,0);
}
{
  const r=rig(),w=weather(r); w.wait("rain","active");
  for(let i=0;i<120;i++)w.step();
  const [first,,third]=w.system.snapshot().event.meteors;
  r.fire({x:(first.x+third.x)/2,y:first.y});
  for(let i=0;i<40;i++)w.step();
  assert.equal(w.system.snapshot().event.meteors.filter(m=>m.neutralized).length,2);
  assert.equal(r.score.snapshot().points,100,"two meteors, no extra rain-container reward");
}
{
  const r=rig(),w=weather(r,"zone-1"); w.wait("rain","active");
  const m=w.system.snapshot().event.meteors[0];
  w.step(.01,{x:m.x+(m.vy?40:m.vx*.01),y:m.y+(m.vx?40:m.vy*.01)});
  // Wait for the real dodge payment; the finished obstacle is now ineligible.
  while(w.system.snapshot().event)w.step();
  assert.equal(r.score.snapshot().points,100);
  r.fire(m);for(let i=0;i<40;i++)w.step();
  assert.equal(r.score.snapshot().points,100,"already rewarded dodge is never paid again as destruction");
}
for(const hz of [20,30,60,120]) {
  const r=rig(),w=weather(r); const wave=w.wait("wave","active");
  const head={x:wave.x+wave.radius,y:wave.y}; r.fire(head); w.step(1/hz,head);
  assert.equal(w.system.snapshot().event,null);
  assert.equal(r.score.snapshot().points,50);
  assert.equal(r.stability.snapshot().stability,100,"neutralized wave cannot deal -20 in the same step");
  for(let i=0;i<hz*5;i++)w.step(1/hz);
  assert.equal(r.score.snapshot().points,50);
}
{
  const r=rig(),w=weather(r); const wave=w.wait("wave","warning");
  r.fire(wave);for(let i=0;i<40;i++)w.step();
  assert.equal(w.system.snapshot().event.kind,"wave");assert.equal(r.score.snapshot().points,0);
  while(w.system.snapshot().event)w.step();
  r.fire(wave);for(let i=0;i<40;i++)w.step();assert.equal(r.score.snapshot().points,0,"ended wave is absent");
}
{
  const r=rig(); let normal=0,pure=0;
  const fragments=createFragmentSystem({random:()=>.4,getCurrentZone:()=>"zone-2",onAbsorbed:()=>normal++,onPureAbsorbed:()=>pure++,onCorruptionContact:()=>r.stability.applyCorruptionContact()});
  fragments.initialize(940,392,{x:350,y:196,trail:[]});
  const absorb=()=>fragments.update({...fragments.snapshot().find(f=>!f.kind),trail:[]},940,392);
  for(let i=0;i<35;i++)absorb();
  const before=fragments.snapshot(),target=before.find(f=>f.kind==="corruption");assert.ok(target);
  const count=normal;r.fire(target);r.combat.update(.01);fragments.advanceCorruption(.01,940,392);
  fragments.update({...target,trail:[]},940,392,r.combat);
  assert.equal(fragments.snapshot().some(f=>f.kind==="corruption"),false);
  assert.deepEqual(fragments.snapshot(),before.filter(f=>f.kind!=="corruption"));
  assert.equal(normal,count);assert.equal(pure,0);assert.equal(r.stability.snapshot().stability,100);assert.equal(r.score.snapshot().points,50);
  fragments.update({...target,trail:[]},940,392,r.combat);assert.equal(r.score.snapshot().points,50);
  for(let i=0;i<10;i++)absorb();
  assert.equal(fragments.snapshot().find(f=>f.kind==="corruption").generation,45,"normal generation counter unchanged");
}
{
  const r=rig(),pocket=createCorruptionPocket(()=>r.stability.applyCorruptionContact());
  const head={x:10000,y:10000};
  function step(dt=.01,at=head){r.combat.update(dt);pocket.update(dt,"zone-2",940,392,at,[],4,r.combat);}
  while(pocket.snapshot().phase!=="active")step();
  const target=pocket.snapshot();r.fire(target);step(.01,target);
  assert.equal(pocket.snapshot().phase,"cooldown");assert.equal(pocket.snapshot().remaining,5);
  assert.equal(r.score.snapshot().points,50);assert.equal(r.stability.snapshot().stability,100);
  for(let i=0;i<490;i++)step();assert.equal(pocket.snapshot().phase,"cooldown");
  while(pocket.snapshot().phase!=="active")step();
  assert.equal(pocket.snapshot().generation,target.generation+1);
  step(.01,pocket.snapshot());assert.equal(r.stability.snapshot().stability,80,"next generation still damages normally");
}
{
  const r=rig(),pocket=createCorruptionPocket(()=>r.stability.applyCorruptionContact());
  pocket.update(.01,"zone-2",940,392,{x:10000,y:10000}); const target=pocket.snapshot();r.fire(target);
  for(let i=0;i<40;i++){r.combat.update(.01);pocket.update(.01,"zone-2",940,392,{x:10000,y:10000},[],4,r.combat);}
  assert.equal(pocket.snapshot().phase,"warning");assert.equal(r.score.snapshot().points,0);
}
{
  // The combat-only transition clock works even when no image ever loads.
  const errors=[];
  const transition=createZoneBackgroundTransition({zoneOneBackground:{render(){}},createImage:()=>({addEventListener(name,fn){if(name==="error")errors.push(fn);}})});
  errors.forEach(fn=>fn());
  assert.equal(transition.isCombatTransitioning(),false);
  transition.sync({currentZone:"zone-2"});assert.equal(transition.isCombatTransitioning(),true);
  for(let i=0;i<20;i++)transition.update(.05);
  assert.equal(transition.isCombatTransitioning(),false);
  assert.equal(transition.snapshot().progress,0,"visual loading behavior stays unchanged");
  assert.equal(transition.snapshot().zoneTwoStatus,"failed");
}
console.log("Combat Lot 2 owners: active-only neutralization, no same-step damage, +50 uniqueness, dodge exclusion, corruption counters/cooldown and missing images OK");
