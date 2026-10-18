import assert from "node:assert/strict";
import { createAstralImpulse } from "../../src/gameplay/astralImpulse.js";
import { createAstralImpulseCombat, IMPULSE_RADIUS, IMPULSE_DURATION } from "../../src/gameplay/astralImpulseCombat.js";

function rig() {
  const energy = createAstralImpulse(), rewards = [];
  let head = {x:0,y:0}, state = {active:true,transitioning:false};
  const combat = createAstralImpulseCombat({energy,readHead:()=>head,readState:()=>state,onNeutralized:(points,id)=>rewards.push({points,id})});
  return { energy,combat,rewards,fill(){while(!energy.isReady())energy.absorbNormalFragment();},
    head:value=>{head=value;},state:value=>{state={...state,...value};} };
}
const circle = (id, x, y, radius=0) => ({id,category:"meteor",current:{x,y},radius});
{
  const r=rig(); assert.equal(r.combat.trigger(),false);
  for(let i=0;i<19;i++)r.energy.absorbNormalFragment();
  assert.equal(r.combat.trigger(),false); assert.equal(r.energy.snapshot().energy,19);
  r.fill(); r.state({transitioning:true}); assert.equal(r.combat.trigger(),false);
  assert.equal(r.energy.snapshot().energy,20);
  r.state({transitioning:false,active:false}); assert.equal(r.combat.trigger(),false);
  r.state({active:true}); assert.equal(r.combat.trigger(),true); assert.equal(r.energy.snapshot().energy,0);
  r.fill(); assert.equal(r.combat.trigger(),false); assert.equal(r.energy.snapshot().energy,20);
  r.combat.update(.05); const frozen=r.combat.snapshot();
  r.state({active:false}); r.combat.update(1); assert.deepEqual(r.combat.snapshot(),frozen);
  assert.equal(r.combat.intersects(circle("paused",5,0)),false);
  r.state({active:true}); r.combat.cancel(); assert.equal(r.energy.snapshot().energy,20);
}
for(const hz of [20,30,60,120]) {
  const r=rig(); r.fill(); r.head({x:32,y:45,skin:"leviathan_astral",dpr:3}); r.combat.trigger();
  r.head({x:1000,y:1000});
  for(let i=0;i<Math.round(.4*hz);i++)r.combat.update(1/hz);
  const s=r.combat.snapshot(); assert.equal(s.active,false); assert.ok(Math.abs(s.radius-110)<1e-7);
  assert.ok(Math.abs(s.elapsed-.4)<1e-9); assert.equal(s.x,32); assert.equal(s.y,45);
  assert.equal(r.rewards.length,0,"empty attack produces no reward");
  assert.equal(r.energy.snapshot().energy,0);
}
assert.equal(IMPULSE_RADIUS,110); assert.equal(IMPULSE_DURATION,.4);
for(const skin of ["classic","test","leviathan_astral"])for(const form of ["eclat","spectre","nocturne","devoreur"])for(const dpr of [1,2,3]) {
  const r=rig();r.head({x:30,y:40,skin,form,dpr});r.fill();r.combat.trigger();
  for(let i=0;i<8;i++)r.combat.update(.05);
  assert.ok(Math.abs(r.combat.snapshot().radius-110)<1e-7,`${skin}/${form}/DPR ${dpr}: fixed CSS radius`);
}
{
  const r=rig();r.fill();r.combat.trigger();r.combat.update(.05);
  assert.equal(r.combat.intersects(circle("tangent",13.75,0)),true);
  assert.equal(r.combat.intersects(circle("miss",13.7501,0)),false);
  assert.equal(r.combat.intersects({id:"moving",category:"meteor",previous:{x:-20,y:5},current:{x:20,y:5},radius:1}),true,
    "both endpoint samples miss but continuous trajectory crosses the expanding ring");
  assert.equal(r.combat.confirmNeutralized("moving"),true);
  assert.equal(r.combat.confirmNeutralized("moving"),false);
  assert.equal(r.combat.intersects(circle("moving",5,0)),false);
  assert.equal(r.combat.confirmNeutralized("never-intersected"),false);
  assert.deepEqual(r.rewards,[{points:50,id:"moving"}]);
  for(const category of ["body","classic-rock","portal","normal","pure","decoration"]) {
    assert.equal(r.combat.intersects({...circle(category,0,0,200),category}),false);
  }
}
{
  const r=rig();r.fill();r.combat.trigger();r.combat.update(.05);
  const ring={id:"enemy",category:"shockwave",kind:"ring",current:{x:0,y:0},radius:70,growth:0,halfWidth:5};
  assert.equal(r.combat.intersects(ring),false,"center in disk is insufficient for ring collision");
  assert.equal(r.combat.intersects({...ring,id:"concentric",radius:10}),true);
  assert.equal(r.combat.intersects({...ring,id:"growing",current:{x:30,y:0},radius:5,growth:25}),true);
  assert.equal(r.combat.intersects({...ring,id:"between-frames",current:{x:2,y:0},radius:5,growth:2,halfWidth:0}),true,
    "rings intersect inside the step even though neither endpoint intersects");
  assert.equal(r.combat.intersects({...ring,id:"inactive",radius:10,activeFrom:2}),false);
}
{
  const r=rig();r.fill();r.combat.trigger();
  for(let i=0;i<39;i++)r.combat.update(.01);
  r.combat.update(.05); // Only the first .01 s of this step still belongs to the pulse.
  assert.equal(r.combat.intersects({id:"late",category:"meteor",previous:{x:200,y:0},current:{x:100,y:0},radius:0}),false);
  assert.equal(r.combat.intersects(circle("last-tangent",110,0)),true);
}
console.log("Combat Lot 2 geometry: charge, gates, fixed origin, 20/30/60/120Hz, tangency, continuous disks/rings and exact lifetime OK");
