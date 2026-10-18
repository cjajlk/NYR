import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createAstralImpulse } from "../../src/gameplay/astralImpulse.js";
import { createAstralImpulseCombat } from "../../src/gameplay/astralImpulseCombat.js";
import { createImpulsePresentation } from "../../src/gameplay/impulsePresentation.js";
import { renderAstralImpulse } from "../../src/gameplay/astralImpulseRenderer.js";
import { createGameplayAudio, GAMEPLAY_SOUNDS } from "../../src/systems/gameplayAudio.js";
import { createFragmentSystem } from "../../src/gameplay/fragmentSystem.js";

const energy=createAstralImpulse(), sounds=[];
let active=true,transitioning=false,reduced=false,points=0,head={x:120,y:140};
const combat=createAstralImpulseCombat({energy,readHead:()=>head,readState:()=>({active,transitioning}),
 onNeutralized(amount,id){points+=amount;effects.confirmed(id);}});
const effects=createImpulsePresentation({combat,audio:{play:k=>sounds.push(k)},reducedMotion:()=>reduced});
assert.equal(effects.trigger(),false);assert.equal(sounds.length,0);assert.equal(effects.snapshot().bursts.length,0);
const charge=()=>{for(let i=0;i<20;i++)energy.absorbNormalFragment();};
charge();transitioning=true;assert.equal(effects.trigger(),false);transitioning=false;active=false;assert.equal(effects.trigger(),false);active=true;
assert.equal(effects.trigger(),true);assert.deepEqual(sounds,["impulse"]);assert.equal(energy.snapshot().energy,0);
assert.equal(effects.trigger(),false);assert.equal(sounds.length,1);assert.equal(effects.snapshot().bursts.length,0);
combat.update(.05);effects.update(.05);
for(let i=0;i<5;i++){
 const target={id:`meteor:${i}`,category:"meteor",current:{x:133,y:140},radius:14};
 assert.ok(effects.intersects(target));assert.equal(effects.snapshot().bursts.length,Math.min(i,3),"intersection alone never creates effects");
 assert.ok(effects.confirmNeutralized(target.id));assert.equal(effects.confirmNeutralized(target.id),false);
}
assert.equal(points,250);assert.equal(effects.snapshot().bursts.length,3);assert.deepEqual(sounds,["impulse","impulseNeutralized"],"same-frame neutralizations share a sound");
const calls={particles:0,text:[],fills:0,arcs:[]};
const ctx={save(){},restore(){},fillRect(){calls.particles++;},fillText(t){calls.text.push(t);},beginPath(){},stroke(){},fill(){calls.fills++;},arc(...v){calls.arcs.push(v);}};
effects.render(ctx);assert.equal(calls.particles,12);assert.deepEqual(calls.text,["+50","+50","+50"]);
reduced=true;calls.particles=0;effects.render(ctx);assert.equal(calls.particles,0,"reduced motion removes particles");
renderAstralImpulse(ctx,combat.snapshot(),true);assert.equal(calls.fills,0,"reduced motion removes startup glow");
renderAstralImpulse(ctx,combat.snapshot(),false);assert.equal(calls.fills,1);
effects.cancel();assert.equal(combat.snapshot().active,false);assert.equal(effects.snapshot().bursts.length,0);
const count=sounds.length;effects.confirmed("meteor:0");assert.equal(sounds.length,count);
charge();effects.trigger();combat.update(.05);effects.update(.05);
assert.ok(effects.intersects({id:"corruption:1",category:"corruption",current:{x:133,y:140},radius:8}));effects.confirmNeutralized("corruption:1");
for(let i=0;i<12;i++)effects.update(.05);assert.equal(effects.snapshot().bursts.length,0,"feedback expires independently of combat lifetime");
effects.cancel();charge();combat.trigger();combat.update(.05);
assert.ok(effects.intersects({id:"unarmed",category:"pocket",current:{x:133,y:140},radius:10}));effects.confirmNeutralized("unarmed");
assert.equal(effects.snapshot().bursts.length,0,"internal non-player trigger creates no presentation");
let contacts=0;
const fragments=createFragmentSystem({getCurrentZone:()=>"zone-2",onCorruptionContact:()=>contacts++});
fragments.initialize(940,392,{...head,trail:[]});
for(let i=0;i<60&&!fragments.snapshot().some(f=>f.kind==="corruption");i++)fragments.update({...fragments.snapshot().find(f=>!f.kind),trail:[]},940,392);
const corruption=fragments.snapshot().find(f=>f.kind==="corruption");assert.ok(corruption);
effects.cancel();charge();head={...corruption,trail:[]};const before=points;
assert.ok(effects.trigger());combat.update(.01);effects.update(.01);fragments.update(head,940,392,effects);
assert.equal(fragments.snapshot().some(f=>f.kind==="corruption"),false,"actual owner removes target before confirmation");
assert.equal(points,before+50);assert.equal(contacts,0);assert.equal(effects.snapshot().bursts.length,1);assert.equal(effects.snapshot().bursts[0].x,corruption.x);

let context;
class Context {
 constructor(){context=this;this.state="running";this.currentTime=0;this.sources=[];}
 async resume(){}
 createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};this.sources.push(s);return s;}
 async decodeAudioData(data){return data;}
}
const stored=new Map();const audio=createGameplayAudio({Context,getStorage:()=>({getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)}),
 fetchAudio:async url=>({ok:true,arrayBuffer:async()=>readFileSync(url)})});
audio.setActive(true);await audio.unlock();
assert.equal(audio.play("impulse"),true);assert.equal(audio.play("impulseNeutralized"),true);assert.equal(audio.play("impulseNeutralized"),false,"two impulse voices maximum");
assert.equal(audio.play("fragment"),true,"new cap does not block existing effects");
const fragmentVoice=context.sources.at(-1);audio.stopImpulse();
assert.equal(fragmentVoice.stopped,undefined,"transition cleanup preserves other sounds");
assert.equal(audio.play("impulse"),true,"cancel releases impulse voice budget");
audio.setEnabled(false);assert.equal(audio.play("impulse"),false);assert.equal(audio.play("impulseNeutralized"),false);
assert.equal(createGameplayAudio({Context:null,getStorage:()=>({getItem:k=>stored.get(k)})}).isEnabled(),false,"existing option persists");
audio.setEnabled(true);assert.equal(audio.play("impulse"),true);audio.setHidden(true);assert.equal(audio.play("impulse"),false);audio.setHidden(false);
audio.setActive(false,true);assert.equal(audio.play("impulseNeutralized"),false);
for(const key of ["impulse","impulseNeutralized"]){
 const wav=readFileSync(new URL(`../../assets/audio/sfx/${GAMEPLAY_SOUNDS[key]}.wav`,import.meta.url));
 const duration=(wav.length-44)/88200;assert.ok(duration<=.3);assert.equal(wav.readInt16LE(44),0);assert.equal(wav.readInt16LE(wav.length-2),0);
 let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));assert.ok(peak>100&&peak<7000,"discreet peak without clipping");
}
// Bounded presentation workload over 36,000 simulated frames, not a hardware benchmark.
reduced=false;head={x:120,y:140};
const started=performance.now();for(let i=0;i<36000;i++){
 if(i%30===0){effects.cancel();charge();effects.trigger();combat.update(.05);effects.update(.05);
  for(let n=0;n<5;n++){const id=`stress:${i}:${n}`;effects.intersects({id,category:"meteor",current:{x:133,y:140},radius:14});effects.confirmNeutralized(id);}}
 effects.update(1/60);effects.render(ctx);
}const elapsed=performance.now()-started;
assert.ok(elapsed<5000,`presentation smoke budget: ${elapsed}ms`);
console.log(`Lot 4 presentation/audio: confirmed-only feedback, refused attacks, caps, reduced motion, cancellation, mute/persistence and 36000-frame smoke OK (${elapsed.toFixed(1)}ms)`);
