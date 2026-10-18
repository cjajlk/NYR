import assert from "node:assert/strict";
import { createImpulseInput } from "../../src/systems/impulseInput.js";
import { createImpulseDisplay } from "../../src/ui/impulseDisplay.js";
import { createPointerInput } from "../../src/systems/pointerInput.js";
import { createAstralImpulse } from "../../src/gameplay/astralImpulse.js";
import { createAstralImpulseCombat } from "../../src/gameplay/astralImpulseCombat.js";
import { renderAstralImpulse } from "../../src/gameplay/astralImpulseRenderer.js";
import { suspendRuntime, resumeRuntime } from "../../src/core/runtimeState.js";

class Surface {
  listeners = new Map(); children = []; attributes = {}; disabled = false; captured = new Set();
  addEventListener(n,f) { if(!this.listeners.has(n))this.listeners.set(n,new Set());this.listeners.get(n).add(f); }
  removeEventListener(n,f) { this.listeners.get(n)?.delete(f); }
  emit(n,props={}) { const e={code:"Space",target:this,button:0,pointerId:1,pointerType:"touch",detail:1,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...props};for(const f of this.listeners.get(n)??[])f(e);return e; }
  append(...items) { this.children.push(...items); }
  setAttribute(k,v) { this.attributes[k]=v; }
  getBoundingClientRect() { return {left:10,top:20}; }
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  createElement() { return new Surface(); }
}
const doc=new Surface(), button=new Surface();let active=true, attacks=0;
const input=createImpulseInput({button,ownerDocument:doc,canAttack:()=>active,attack:()=>attacks++});
assert.ok(doc.emit("keydown").prevented);assert.equal(attacks,1);
doc.emit("keydown",{repeat:true});doc.emit("keydown");assert.equal(attacks,1);
assert.ok(doc.emit("keyup").prevented);doc.emit("keydown");assert.equal(attacks,2);doc.emit("keyup");
active=false;assert.ok(!doc.emit("keydown").prevented);assert.equal(attacks,2);active=true;
for(const target of [{isContentEditable:true},{closest:()=>({tagName:"INPUT"})}])doc.emit("keydown",{target});
doc.emit("keydown",{ctrlKey:true});assert.equal(attacks,2);
doc.emit("keydown",{target:{closest:selector=>selector.startsWith("input")?null:{tagName:"BUTTON"}}});assert.equal(attacks,2,"other focused buttons retain their normal action");
doc.emit("keydown",{target:button});button.emit("click",{detail:0});assert.equal(attacks,3,"focused button cannot double fire");doc.emit("keyup");
const down=button.emit("pointerdown");button.emit("click");assert.ok(down.prevented&&down.stopped);assert.equal(attacks,4);
button.emit("pointermove");button.emit("pointerup");assert.equal(attacks,4,"canvas gesture arriving over button never fires");
button.disabled=true;button.emit("pointerdown");button.emit("click",{detail:0});assert.equal(attacks,4);button.disabled=false;
button.emit("click",{detail:0});assert.equal(attacks,5,"assistive click works");
input.destroy();doc.emit("keydown");button.emit("pointerdown");assert.equal(attacks,5);assert.ok([...doc.listeners.values()].every(s=>s.size===0));

const canvas=new Surface();let aims=[],holds=0;
const steering=createPointerInput(canvas,{aimAt:(...p)=>aims.push(p),holdCurrentHeading:()=>holds++});
const second=createImpulseInput({button,ownerDocument:doc,canAttack:()=>true,attack:()=>attacks++});
assert.ok(canvas.emit("pointerdown",{pointerId:10,clientX:50,clientY:60}).prevented);assert.deepEqual(aims,[[40,40]]);
button.emit("pointerdown",{pointerId:11});assert.equal(aims.length,1,"attack finger does not steer");
canvas.emit("pointermove",{pointerId:10,clientX:70,clientY:90});assert.deepEqual(aims.at(-1),[60,70]);
canvas.emit("pointerdown",{pointerId:12,clientX:300,clientY:300});assert.equal(aims.length,2,"another finger cannot steal direction");
suspendRuntime("lot3-test");assert.equal(canvas.captured.size,0);assert.equal(holds,1);
resumeRuntime("lot3-test");canvas.emit("pointermove",{pointerId:10,clientX:0,clientY:0});assert.equal(aims.length,2,"old gesture released after pause or portrait");
canvas.emit("pointerdown",{pointerId:20,clientX:10,clientY:20});steering.reset();assert.equal(canvas.captured.size,0);
steering.destroy();second.destroy();assert.ok([...canvas.listeners.values()].every(s=>s.size===0));

for(const mobile of [false,true]) {
 const hud=createImpulseDisplay({ownerDocument:doc,story:true,mobile});
 assert.equal(hud.button.attributes["aria-label"],"Impulsion astrale");
 assert.equal(hud.button.children[0].attributes["aria-hidden"],"true");
 for(let energy=0;energy<=20;energy++){hud.update({energy,capacity:20,ready:energy===20},true,true);assert.equal(hud.element.children[0].textContent,`${energy}/20`);assert.equal(hud.button.disabled,energy<20);}
 assert.equal(hud.hint.hidden,false);assert.ok(hud.hint.textContent.includes(mobile?"sur IMPULSION":"sur Espace"));
 hud.advance(4);hud.update({energy:20,capacity:20,ready:true},true,true);assert.equal(hud.hint.hidden,true,"hint once per session");
 hud.update({energy:20,capacity:20,ready:true},false,false);assert.equal(hud.element.hidden,true);assert.equal(hud.button.disabled,true);
 hud.update({energy:0,capacity:20,ready:false},true,true);assert.equal(hud.element.children[1].value,0);
}
const energy=createAstralImpulse();for(let i=0;i<20;i++)energy.absorbNormalFragment();
const combat=createAstralImpulseCombat({energy,readHead:()=>({x:123,y:234}),readState:()=>({active,transitioning:false})});active=true;combat.trigger();
const arcs=[];let strokeAlpha;const ctx={save(){},restore(){},beginPath(){},fill(){},stroke(){strokeAlpha=this.globalAlpha;},arc(...p){arcs.push(p);}};
for(let i=0;i<7;i++){combat.update(.05);const pulse=combat.snapshot();renderAstralImpulse(ctx,pulse);assert.deepEqual(arcs[arcs.length-(pulse.elapsed<.1?2:1)].slice(0,3),[123,234,pulse.radius]);assert.equal(strokeAlpha,1-pulse.elapsed/.4);}
active=false;const paused=combat.snapshot();combat.update(.05);assert.deepEqual(combat.snapshot(),paused);active=true;
combat.update(.05);assert.ok(Math.abs(combat.snapshot().radius-110)<1e-10);const count=arcs.length;renderAstralImpulse(ctx,combat.snapshot());assert.equal(arcs.length,count);
combat.cancel();renderAstralImpulse(ctx,combat.snapshot());assert.equal(arcs.length,count);
console.log("Lot 3 UI/input/render: keyboard, touch priority, two fingers, capture cleanup, hint, gauge, real engine ring and disposal OK");
