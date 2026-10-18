import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVoidParasite, VOID_PARASITE_CONFIG } from "../../src/gameplay/voidParasite.js";

const frame = { width: 600, height: 320, head: { x: 400, y: 100 } };
const nearby = { ...frame, head: { x: 250, y: 100 } };
const atDistance = x => ({ ...frame, head: { x: 100 + x, y: 100 } });
function fixture(options = {}) {
  return createVoidParasite({ requestSpawn: () => ({ x: 100, y: 100 }),
    isSpawnSafe: () => true, isCorridorValid: () => true, ...options });
}
function advance(model, seconds, input = frame, step = 0.05) {
  let remaining = seconds;
  while (remaining > 1e-10) { const dt = Math.min(step, remaining); model.update(dt, input); remaining -= dt; }
  return model.snapshot();
}
function observed(options) { const p = fixture(options); advance(p, 8.6); assert.equal(p.snapshot().phase, "observing"); p.drainEvents(); return p; }
function charging(options, input = nearby) {
  const p = observed(options); advance(p, .8, input); assert.equal(p.snapshot().phase, "charging"); return p;
}
const types = p => p.drainEvents().map(e => e.type);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

assert.deepEqual(VOID_PARASITE_CONFIG, { radius:12,detectionRadius:160,preparationDuration:.8,chargeDuration:.6,
 recoveryDuration:1.5,lockMinimum:80,lockMaximum:192,appearanceDuration:.6,initialDelay:8,respawnDelay:12,
 spawnRetryDelay:2,spawnHeadDistance:220,spawnBodyDistance:45,spawnPortalDistance:96,edgeMargin:36,
 minimumDimension:260,protectionDuration:.8 });
for (const options of [{radius:NaN},{chargeDuration:0},{initialDelay:.001},{respawnDelay:11.9},{lockMinimum:200},{typo:1}]) {
  assert.throws(() => fixture({config:options}),RangeError);
}
{
 let attempts=0;
 const p=fixture({requestSpawn:()=>{attempts++;return{x:100,y:100};}});
 advance(p,7.99);assert.equal(p.snapshot().phase,"waiting");assert.equal(attempts,0);
 advance(p,.01);assert.equal(p.snapshot().phase,"appearing");assert.equal(attempts,1);
 close(p.snapshot().remaining,.6);advance(p,.599);assert.equal(p.snapshot().phase,"appearing");advance(p,.001);assert.equal(p.snapshot().phase,"observing");
 const position=p.snapshot().position;advance(p,2);assert.deepEqual(p.snapshot().position,position,"observation immobile");
 p.update(.01,atDistance(160.001));assert.equal(p.snapshot().phase,"observing");
 p.update(.01,atDistance(160));assert.equal(p.snapshot().phase,"preparing");
 advance(p,.39,nearby);assert.deepEqual(p.snapshot().target,nearby.head,"tracks until lock");
 advance(p,.399,atDistance(140));assert.equal(p.snapshot().phase,"preparing");
 p.update(.001,atDistance(120));assert.equal(p.snapshot().phase,"charging");assert.deepEqual(p.snapshot().target,{x:220,y:100});
 close(Math.hypot(p.snapshot().velocity.x,p.snapshot().velocity.y),120/.6);
 const target=p.snapshot().target;advance(p,.3,{...frame,head:{x:500,y:250}});close(p.snapshot().position.x,160);close(p.snapshot().position.y,100);assert.deepEqual(p.snapshot().target,target);
 advance(p,.299,frame);assert.equal(p.snapshot().phase,"charging");advance(p,.001,frame);assert.equal(p.snapshot().phase,"recovering");close(p.snapshot().position.x,220);
 assert.equal(types(p).filter(t=>t==="chargeMissed").length,1);
 advance(p,1.499,nearby);assert.equal(p.snapshot().phase,"recovering");advance(p,.001,nearby);assert.equal(p.snapshot().phase,"observing");
}
for (const [length,valid] of [[79.999,false],[80,true],[192,true],[192.001,false]]) {
 const p=observed();p.update(.01,nearby);advance(p,.79,atDistance(length));assert.equal(p.snapshot().phase,valid?"charging":"recovering");
 assert.equal(types(p).includes("chargeStarted"),valid);
 if(valid)close(Math.hypot(p.snapshot().velocity.x,p.snapshot().velocity.y),length/.6);
}
{
 const p=observed({isCorridorValid:()=>false});advance(p,.8,nearby);assert.equal(p.snapshot().phase,"recovering");
 assert.equal(p.drainEvents().find(e=>e.type==="chargeInterrupted").reason,"invalid-corridor");
 const denied=observed({isCorridorValid:()=>undefined});advance(denied,.8,nearby);assert.equal(denied.snapshot().phase,"recovering");
}
{
 let calls=0;
 const p=charging({detectContact:portion=>{calls++;assert.ok(Object.isFrozen(portion));assert.ok(Object.isFrozen(portion.from));return{fraction:.25};}});
 p.drainEvents();p.noteDamage();p.update(.04,nearby);
 const events=p.drainEvents();assert.deepEqual(events.map(e=>e.type),["firstContact"]);assert.equal(events[0].protected,true);
 close(events[0].position.x,102.5);assert.equal(p.snapshot().phase,"recovering");close(p.snapshot().elapsed,.03);
 advance(p,1,nearby);assert.equal(calls,1);assert.equal(types(p).includes("firstContact"),false);close(p.snapshot().protection,0);
 advance(p,.47,nearby);assert.equal(p.snapshot().phase,"observing");
}
for (const invalid of [null,{}, {fraction:NaN},{fraction:-1},{fraction:1.1}]) {
 const p=charging({detectContact:()=>invalid});advance(p,.6,frame);assert.equal(p.snapshot().phase,"recovering");assert.ok(!types(p).includes("firstContact"));
}
{
 let contact=false;
 const p=observed({detectContact:()=>contact?{fraction:0}:null});
 advance(p,.79,nearby);p.drainEvents();
 // Preparation ends 10 ms into this step, contact happens at charge entry.
 contact=true;p.update(.03,{...nearby,previousHead:nearby.head});
 const events=p.drainEvents();assert.deepEqual(events.map(e=>e.type),["chargeStarted","firstContact"]);
 close(events[0].time,events[1].time);close(p.snapshot().elapsed,.02);
}
for (const reason of ["zone-change","portal","resize","recenter","game-over","session-end"]) {
 for(const stage of ["preparing","charging"]) {
  const p=stage==="charging"?charging():observed();if(stage==="preparing")p.update(.02,nearby);
  p.interrupt(reason);assert.deepEqual(types(p),["chargeInterrupted"]);assert.equal(p.snapshot().position,null);
  const before=p.snapshot();advance(p,1,nearby);assert.equal(types(p).includes("firstContact"),false);
  if(["game-over","session-end"].includes(reason))assert.deepEqual(p.snapshot(),before,"terminal instance stays stopped");
 }
}
{
 const p=charging();p.update(.05,nearby);const position=p.snapshot().position;
 p.update(20,{...nearby,active:false});assert.equal(p.snapshot().phase,"recovering");close(p.snapshot().remaining,1.5);
 const paused=p.snapshot();advance(p,20,{...nearby,active:false});assert.deepEqual(p.snapshot(),paused);assert.deepEqual(p.snapshot().position,position);
 p.update(10,nearby);close(p.snapshot().elapsed,.05);assert.equal(p.snapshot().paused,false,"clamped resume never catches up wall time");
}
for(const phase of ["waiting","appearing","observing","preparing","charging","recovering","destroyed"]){
 const p=fixture();
 if(phase!=="waiting")advance(p,phase==="appearing"?8:8.6);
 if(["preparing","charging","recovering"].includes(phase))advance(p,phase==="preparing"?.2:phase==="charging"?.8:1.4,nearby);
 if(phase==="destroyed")p.destroy();
 assert.equal(p.snapshot().phase,phase);
 const alive=!["waiting","destroyed"].includes(phase);assert.equal(p.destroy(),alive);assert.equal(p.destroy(),false);
 if(alive){const events=p.drainEvents();assert.equal(events.filter(e=>e.type==="destroyed").length,1);assert.equal(events.some(e=>["chargeStarted","firstContact"].includes(e.type)),false);advance(p,11.999);assert.equal(p.snapshot().phase,"destroyed");advance(p,.001);assert.equal(p.snapshot().phase,"appearing");assert.equal(p.snapshot().generation,2);}
}
{
 let attempts=0;
 const p=fixture({requestSpawn:()=>{attempts++;return{x:100,y:100};},isSpawnSafe:()=>false});
 advance(p,8);assert.equal(attempts,1);advance(p,1.999);assert.equal(attempts,1);advance(p,.001);assert.equal(attempts,2);
 const noPlacement=createVoidParasite();advance(noPlacement,20);assert.equal(noPlacement.snapshot().position,null);
 for(const input of [{...frame,width:259},{...frame,head:{x:200,y:100}}]){const q=fixture();advance(q,8,input);assert.equal(q.snapshot().position,null);}
 const edge=fixture({requestSpawn:()=>({x:35,y:100})});advance(edge,8);assert.equal(edge.snapshot().position,null);
}
for(const hz of [30,60,120]){
 const p=fixture();advance(p,8.6,frame,1/hz);advance(p,.8,nearby,1/hz);assert.equal(p.snapshot().phase,"charging");
 advance(p,.6,{...frame,head:{x:500,y:270}},1/hz);assert.equal(p.snapshot().phase,"recovering");close(p.snapshot().position.x,250);
 const events=p.drainEvents();close(events.find(e=>e.type==="chargeStarted").time,9.4);close(events.find(e=>e.type==="chargeMissed").time,10);
 advance(p,1.5,frame,1/hz);assert.equal(p.snapshot().phase,"observing");
}
{
 const p=fixture();let seconds=0,i=0;const steps=[.007,.05,.013,.029,.041];
 while(seconds<8.6-1e-10){const dt=Math.min(steps[i++%steps.length],8.6-seconds);p.update(dt,frame);seconds+=dt;}
 advance(p,.8,nearby,.037);advance(p,.6,frame,.023);assert.equal(p.snapshot().phase,"recovering");close(p.snapshot().position.x,250);
 const q=fixture();q.update(100,frame);close(q.snapshot().activeTime,.05);for(const bad of [0,-1,NaN,Infinity])q.update(bad,frame);close(q.snapshot().activeTime,.05);
 const state=q.snapshot();q.update(.05,{head:{x:NaN,y:0}});assert.deepEqual(q.snapshot(),state);
}
{
 let portion;
 const p=observed({detectContact:value=>{portion=value;return{fraction:.5};}});
 advance(p,.79,nearby);p.drainEvents();
 p.update(.03,{...frame,previousHead:{x:250,y:100},head:{x:270,y:140}});
 close(portion.activeFrom,1/3);close(portion.activeTo,1);close(portion.duration,.02);
 close(portion.headFrom.x,250+20/3);close(portion.headFrom.y,100+40/3);
 assert.deepEqual(portion.headTo,{x:270,y:140});close(p.snapshot().elapsed,.01);
 assert.equal(p.drainEvents().filter(e=>e.type==="firstContact").length,1);
}
{
 const p=observed();advance(p,.3,nearby);p.interrupt("pause");
 assert.equal(p.snapshot().phase,"recovering");assert.equal(p.snapshot().paused,true);
 assert.deepEqual(types(p),["chargeInterrupted"]);const before=p.snapshot();p.update(100,{...frame,active:false});assert.deepEqual(p.snapshot(),before);
}
{
 let p;
 p=charging({detectContact:()=>{p.interrupt("portal");return{fraction:0};}});
 p.update(.05,nearby);assert.equal(p.snapshot().phase,"waiting");assert.deepEqual(types(p),["chargeInterrupted"],"interrupt inside contact hook cannot leak contact");
}
{
 const p=observed();advance(p,.8,{...frame,head:{x:220,y:180}});
 assert.equal(p.snapshot().phase,"charging");close(Math.hypot(p.snapshot().velocity.x,p.snapshot().velocity.y),Math.hypot(120,80)/.6);
 advance(p,.3,frame);close(p.snapshot().position.x,160);close(p.snapshot().position.y,140);
 advance(p,.3,frame);close(p.snapshot().position.x,220);close(p.snapshot().position.y,180);
}
{
 const p=fixture({config:{initialDelay:.1,appearanceDuration:.2,preparationDuration:.3,chargeDuration:.4,recoveryDuration:.5,respawnDelay:13}});
 advance(p,.3);advance(p,.3,nearby);assert.equal(p.snapshot().phase,"charging");advance(p,.4,frame);assert.equal(p.snapshot().phase,"recovering");advance(p,.5,frame);assert.equal(p.snapshot().phase,"observing");
 p.destroy();advance(p,12.99);assert.equal(p.snapshot().phase,"destroyed");advance(p,.01);assert.equal(p.snapshot().phase,"appearing");
}
{
 const p=charging();const immutable=p.snapshot();assert.throws(()=>{immutable.position.x=0;},TypeError);
 assert.throws(()=>{immutable.config.radius=100;},TypeError);const batch=p.drainEvents();assert.ok(Object.isFrozen(batch));assert.deepEqual(p.drainEvents(),[]);
 assert.throws(()=>p.interrupt("unknown"),RangeError);
 const other=fixture();assert.equal(other.snapshot().generation,0);assert.equal(other.snapshot().activeTime,0);
}
{
 let reads=0,writes=0;const prior=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
 Object.defineProperty(globalThis,"localStorage",{configurable:true,get(){reads++;return{setItem(){writes++;}};}});
 try{const p=charging();p.noteDamage();p.destroy();advance(p,12);p.interrupt("session-end");assert.equal(reads,0);assert.equal(writes,0);}
 finally{if(prior)Object.defineProperty(globalThis,"localStorage",prior);else delete globalThis.localStorage;}
 const source=readFileSync(new URL("../../src/gameplay/voidParasite.js",import.meta.url),"utf8");
 assert.doesNotMatch(source,/^\s*import\s/m);assert.doesNotMatch(source,/setTimeout|setInterval|Date\.now|localStorage/);
 const main=readFileSync(new URL("../../src/main.js",import.meta.url),"utf8");assert.ok(!main.includes("voidParasite"),"normal sessions remain disconnected");
}
console.log("Combat V2 Lot 1: pure parasite FSM, exact timers/trajectories, lock bounds, contact contract, lifecycle, spawn refusal, 30/60/120Hz, irregular/clamped steps and no persistence OK");
