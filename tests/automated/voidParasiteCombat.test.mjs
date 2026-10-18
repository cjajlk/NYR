import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVoidParasiteCombat } from "../../src/gameplay/voidParasiteCombat.js";
import { movingCircleContact, parasiteImpulseTarget } from "../../src/gameplay/voidParasiteCollisions.js";
import { createAstralImpulse } from "../../src/gameplay/astralImpulse.js";
import { createAstralImpulseCombat } from "../../src/gameplay/astralImpulseCombat.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";

const close = (a,b,tolerance=1e-7) => assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const far={x:400,y:100}, near={x:250,y:100};
function fixture(options={}) {
 let head=far, active=true;
 const damage=[],rewards=[],deaths=[],sounds=[];
 const stability=createNyrStability(options.stabilityConfig,(before,after)=>damage.push({before,after}));
 let model;
 model=createVoidParasiteCombat({stability, readHead:()=>head,readState:()=>({active}),
  parasiteOptions:{requestSpawn:()=>({x:100,y:100}),isSpawnSafe:()=>true,isCorridorValid:()=>true},
  audio:{play:key=>sounds.push(key)},onGameOver:event=>deaths.push(event),
  onScore:(value,receipt)=>{if(receipt.amount===75)assert.equal(model.parasite.snapshot().phase,'destroyed','remove before reward');rewards.push(receipt);},...options});
 return Object.assign({model,damage,rewards,deaths,sounds,
  step(dt,current=head,previous=current){head=current;return model.update(dt,{width:600,height:320,head:current,previousHead:previous});},
  head(value){head=value;},active(value){active=value;},
  fill(){while(!model.energy.isReady())model.energy.absorbNormalFragment();}},model);
}
function advance(r,seconds,head=far,step=.05){let t=0;while(t<seconds-1e-10){const dt=Math.min(step,seconds-t);r.step(dt,head);t+=dt;}return r.parasite.snapshot();}
function observed(options){const r=fixture(options);advance(r,8.6);assert.equal(r.parasite.snapshot().phase,'observing');r.parasite.drainEvents();return r;}
function charging(options){const r=observed(options);advance(r,.8,near);assert.equal(r.parasite.snapshot().phase,'charging');r.parasite.drainEvents();return r;}

// Exact continuous relative motion, including tangency and initial overlap.
close(movingCircleContact({x:-100,y:0},{x:100,y:0},{x:100,y:0},{x:-100,y:0}),171/400);
close(movingCircleContact({x:-10,y:29},{x:10,y:29},{x:0,y:0},{x:0,y:0}),.5);
assert.equal(movingCircleContact({x:0,y:0},{x:0,y:0},{x:10,y:0},{x:10,y:0}),0);
assert.equal(movingCircleContact({x:-1000,y:29.001},{x:1000,y:29.001},{x:0,y:0},{x:0,y:0}),null);
assert.equal(movingCircleContact({x:0,y:0},{x:0,y:0},{x:30,y:0},{x:30,y:0}),null);
close(movingCircleContact({x:-10000,y:0},{x:10000,y:0},{x:0,y:0},{x:0,y:0}),9971/20000);
assert.equal(movingCircleContact(null,far,near,near),null);
{
 const t=parasiteImpulseTarget({activeFrom:.25,activeTo:.75,from:{x:10,y:20},to:{x:30,y:40}},'p');
 assert.deepEqual(t.previous,{x:0,y:10});assert.deepEqual(t.current,{x:40,y:50});
 close(t.activeFrom,.25);close(t.activeTo,.75);assert.equal(t.radius,12);
}
{
 const r=charging();advance(r,.5,near);assert.equal(r.stability.snapshot().stability,80);assert.equal(r.damage.length,1);
 const event=r.parasite.drainEvents().find(e=>e.type==='firstContact');close(event.time,9.4+(150-29)/250);
 close(r.parasite.snapshot().remaining,1.5-(.5-(150-29)/250));
 close(r.parasite.snapshot().protection,.8-(.5-(150-29)/250));
 advance(r,1,near);assert.equal(r.damage.length,1,'same charge cannot hurt twice');
 advance(r,1.5-(1.5-(150-29)/250),far); // Recovery boundary is checked analytically below as well.
}
{
 const r=charging();r.step(.01,{x:100,y:100});assert.equal(r.damage.length,1);close(r.parasite.snapshot().remaining,1.49);
 advance(r,1.489,far);assert.equal(r.parasite.snapshot().phase,'recovering');r.step(.001,far);assert.equal(r.parasite.snapshot().phase,'observing');
}
{
 const r=charging();advance(r,.6,far);assert.equal(r.damage.length,0);close(r.parasite.snapshot().remaining,1.5);
 advance(r,1.499,far);assert.equal(r.parasite.snapshot().phase,'recovering');r.step(.001,far);assert.equal(r.parasite.snapshot().phase,'observing');
}
{
 const r=observed();r.step(.05,{x:100,y:100});assert.equal(r.damage.length,0,'preparation overlap never hurts');
 advance(r,.7,{x:100,y:100});assert.equal(r.damage.length,0);
 const q=fixture();advance(q,8,far);q.step(.05,{x:100,y:100});assert.equal(q.parasite.snapshot().phase,'appearing');assert.equal(q.damage.length,0);
}
{
 const r=charging();r.parasite.noteDamage();r.step(.05,{x:100,y:100});assert.equal(r.damage.length,0);assert.equal(r.parasite.snapshot().contactConsumed,true);close(r.parasite.snapshot().remaining,1.45);
 advance(r,.9,{x:100,y:100});assert.equal(r.damage.length,0);
 let shield=true;const q=charging({canTakeDamage:()=>!shield});q.step(.05,{x:100,y:100});shield=false;advance(q,.5,{x:100,y:100});assert.equal(q.damage.length,0);assert.equal(q.parasite.snapshot().contactConsumed,true);assert.equal(q.parasite.snapshot().protection,0,'protected contact does not mint local protection');
 const ordinary=charging();ordinary.step(.01,{x:100,y:100});assert.ok(ordinary.parasite.snapshot().protection>0);ordinary.stability.applyAsteroidContact();assert.equal(ordinary.stability.snapshot().stability,55,'local parasite shield never guards another danger');
}
{
 const r=charging({stabilityConfig:{initial:20,maximum:100}});r.step(.05,{x:100,y:100});assert.equal(r.damage.length,1);assert.equal(r.deaths.length,1);assert.equal(r.stability.snapshot().stability,0);advance(r,2,near);assert.equal(r.deaths.length,1);assert.equal(r.trigger(),false);
}
// Same-time priority, then the distinct case damage precedes a later pulse.
{
 const r=charging();r.head({x:100,y:100});r.fill();assert.equal(r.trigger(),true);r.step(.05,{x:100,y:100});assert.equal(r.parasite.snapshot().phase,'destroyed');assert.equal(r.damage.length,0);assert.equal(r.score.snapshot().points,75);assert.equal(r.rewards.length,1);assert.equal(r.rewards[0].amount,75);assert.equal(r.energy.snapshot().energy,0);
 advance(r,1,near);assert.equal(r.score.snapshot().points,75);assert.equal(r.damage.length,0);
 assert.equal(r.combat.confirmNeutralized(r.rewards[0].id),false);
 const text=[];r.presentation.render({save(){},restore(){},fillText:t=>text.push(t),fillRect(){}}); // Feedback expired after the second above.
}
{
 const r=charging();r.head({x:117,y:100});r.fill();r.trigger();r.step(.05,{x:100,y:100});assert.equal(r.damage.length,1);assert.equal(r.stability.snapshot().stability,80);assert.equal(r.score.snapshot().points,75);assert.equal(r.parasite.snapshot().phase,'destroyed','a later pulse does not erase damage already taken');
 const text=[];r.presentation.render({save(){},restore(){},fillText:t=>text.push(t),fillRect(){}});assert.deepEqual(text,['+75']);
}
{
 const r=charging(),t=(200-100-29)/(100+12.5),center=100-12-1.25*t;
 r.head({x:center,y:100});r.fill();r.trigger();r.step(.05,{x:100,y:100},{x:200,y:100});
 assert.equal(r.damage.length,0,'equal nonzero TOI gives pulse priority');assert.equal(r.score.snapshot().points,75);
}
// All living phases are neutralizable; waiting/destroyed have no target.
for(const phase of ['appearing','observing','preparing','charging','recovering']){
 const r=fixture();advance(r,phase==='appearing'?8.1:8.6,far);
 if(['preparing','charging','recovering'].includes(phase))advance(r,phase==='preparing'?.2:phase==='charging'?.8:1.4,near);
 assert.equal(r.parasite.snapshot().phase,phase);
 const beforeDamage=r.damage.length,p=r.parasite.snapshot().position;r.head(p);r.fill();r.trigger();r.step(.01,far);assert.equal(r.parasite.snapshot().phase,'destroyed',phase);assert.equal(r.score.snapshot().points,75);assert.equal(r.damage.length,beforeDamage);
}
{
 const r=fixture();r.fill();r.trigger();advance(r,.4,far);assert.equal(r.score.snapshot().points,0);assert.equal(r.parasite.snapshot().phase,'waiting');
}
// V1 categories and rewards stay exactly +50, the parasite is only +75.
{
 const r=fixture();r.head({x:0,y:0});r.fill();r.trigger();r.combat.update(.01);r.presentation.update(.01);
 for(const category of ['meteor','shockwave','corruption','pocket']){
  const target={id:category,category,current:{x:0,y:0},radius:12};
  assert.equal(r.presentation.intersects(target),true);assert.equal(r.presentation.confirmNeutralized(category),true);assert.equal(r.presentation.confirmNeutralized(category),false);
 }
 const target={id:'isolated-parasite',category:'parasite',current:{x:0,y:0},radius:12};
 // Test the lower-level callback with no FSM ownership side effect.
 const score=createNyrScore(),energy=createAstralImpulse();while(!energy.isReady())energy.absorbNormalFragment();
 const amounts=[],combat=createAstralImpulseCombat({energy,readHead:()=>({x:0,y:0}),readState:()=>({active:true}),onNeutralized:(amount)=>{amounts.push(amount);score.awardNeutralizedParasite();}});
 combat.trigger();combat.update(.01);assert.equal(combat.firstIntersection(target),0);assert.equal(combat.confirmNeutralized(target.id),false,'probe alone is not confirmation');assert.equal(combat.intersects(target),true);assert.equal(combat.confirmNeutralized(target.id),true);assert.equal(combat.confirmNeutralized(target.id),false);assert.deepEqual(amounts,[75]);assert.equal(score.snapshot().points,75);assert.equal(r.score.snapshot().points,200);assert.deepEqual(r.rewards.map(e=>e.amount),[50,50,50,50]);
}
// Pulse ending during a frame may hit only its genuinely active fraction.
{
 const energy=createAstralImpulse();while(!energy.isReady())energy.absorbNormalFragment();
 const combat=createAstralImpulseCombat({energy,readHead:()=>({x:0,y:0}),readState:()=>({active:true})});combat.trigger();for(let i=0;i<7;i++)combat.update(.05);combat.update(.04);combat.update(.05);
 assert.equal(combat.firstIntersection({id:'late',category:'parasite',previous:{x:200,y:0},current:{x:0,y:0},radius:12,activeFrom:.5,activeTo:1}),null);
 assert.notEqual(combat.firstIntersection({id:'early',category:'parasite',current:{x:110,y:0},radius:12,activeFrom:0,activeTo:.2}),null);
 combat.update(.05);assert.equal(combat.firstIntersection({id:'expired',category:'parasite',current:{x:110,y:0},radius:12}),null);
}
// Geometry of a charge beginning partway through the frame must be extrapolated,
// then clipped, rather than stretching its endpoints across the entire frame.
{
 const energy=createAstralImpulse();while(!energy.isReady())energy.absorbNormalFragment();
 const combat=createAstralImpulseCombat({energy,readHead:()=>({x:0,y:0}),readState:()=>({active:true})});combat.trigger();combat.update(.05);
 const target=parasiteImpulseTarget({from:{x:20,y:0},to:{x:0,y:0},activeFrom:.5,activeTo:1},'portion',0);
 close(combat.firstIntersection(target),40/(40+13.75));
}
function trace(stepPattern,pulseCenter=null) {
 const r=charging();if(pulseCenter!==null){r.head({x:pulseCenter,y:100});r.fill();r.trigger();}
 let time=0,index=0;const events=[];
 const head=t=>({x:Math.max(100,400-500*t),y:100});
 while(time<1-1e-10){const dt=Math.min(stepPattern[index++%stepPattern.length],1-time);r.step(dt,head(time+dt),head(time));events.push(...r.parasite.drainEvents());time+=dt;}
 return {hp:r.stability.snapshot().stability,score:r.score.snapshot().points,damage:r.damage.length,
  phase:r.parasite.snapshot().phase,remaining:r.parasite.snapshot().remaining,
  destroyed:events.find(e=>e.type==='destroyed')?.time??null,
  contact:events.find(e=>e.type==='firstContact')?.time??null};
}
for(const center of [null,300,302]) {
 const reference=trace([1/4000],center);
 if(center===null){assert.equal(reference.hp,80);assert.equal(reference.score,0);close(reference.contact,9.4+271/750);}
 if(center===300){assert.equal(reference.hp,100);assert.equal(reference.score,75);assert.equal(reference.damage,0);}
 if(center===302){assert.equal(reference.hp,80);assert.equal(reference.score,75);assert.equal(reference.damage,1);}
 for(const steps of [[1/30],[1/60],[1/120],[.007,.05,.013,.029,.041]]){
  const result=trace(steps,center);
  for(const key of ['hp','score','damage','phase'])assert.equal(result[key],reference[key],`${center}/${steps}: ${key}`);
  close(result.remaining,reference.remaining,2e-6);
  if(center===null)close(result.contact,reference.contact,2e-6);else close(result.destroyed,reference.destroyed,2e-6);
 }
}
{
 const r=charging();r.fill();r.trigger();r.step(.03,far);close(r.combat.snapshot().elapsed,.03);
 r.interrupt('pause');const frozen=r.combat.snapshot();assert.equal(r.trigger(),false);r.active(false);r.step(.05,near);assert.deepEqual(r.combat.snapshot(),frozen);r.active(true);r.step(.01,far);close(r.combat.snapshot().elapsed,.04);
 for(const reason of ['portal','zone-change','resize','recenter']){const q=charging();q.interrupt(reason);q.step(.05,near);assert.equal(q.damage.length,0);assert.equal(q.combat.snapshot().active,false);assert.equal(q.parasite.snapshot().phase,'waiting');}
}
{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let reads=0;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){reads++;throw Error('personal storage forbidden');}});
 try{const r=charging();r.head({x:100,y:100});r.fill();r.trigger();r.step(.05,{x:100,y:100});assert.equal(r.score.snapshot().points,75);assert.equal(reads,0);assert.equal(r.energy.snapshot().energy,0);}
 finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else delete globalThis.localStorage;}
 const main=readFileSync(new URL('../../src/main.js',import.meta.url),'utf8');assert.doesNotMatch(main,/voidParasite/);
 const controls=readFileSync(new URL('../../src/systems/impulseInput.js',import.meta.url),'utf8');assert.doesNotMatch(controls,/voidParasite/);
}
console.log('Combat V2 Lot 2: moving disks 17+12, charge-only damage, recovery/protection, chronological pulse priority, unique +75 and historical +50, presentation, 30/60/120Hz and irregular 50ms vs 4000Hz reference, lifecycle and isolated storage OK');
