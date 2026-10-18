import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getRuntimeState, endGame } from "../../src/core/runtimeState.js";

export function verifyImpulseUiRuntime({app,frame,hz,setBounds}) {
 const mode=process.env.NYR_IMPULSE_UI_MODE;
 const menu=()=>app.children.find(e=>e.className==="main-menu");
 const key=(type="keydown",props={})=>{const e={code:"Space",target:document,preventDefault(){this.prevented=true;},...props};document.emit(type,e);return e;};
 const touch=(target,type="pointerdown",props={})=>target.emit(type,{pointerId:1,pointerType:"touch",button:0,detail:1,clientX:100,clientY:100,preventDefault(){},stopPropagation(){},...props});
 const continueStory=()=>{if(getRuntimeState().suspensionReasons.includes("story-narrative"))globalThis.probe.storyDisplay.element.children[0].children[4].emit("click");};
 const launch=()=>{if(menu().children[0].textContent==="NYR")menu().children[1].emit("click");menu().children.find(e=>e.className==="mode-selection").children.find(e=>e.textContent===({story:"HISTOIRE",infinite:"VOYAGE INFINI",survival:"SURVIE"}[mode])).emit("click");continueStory();};
 let p=globalThis.probe;assert.equal(p.impulseDisplay.element.hidden,true);assert.equal(key().prevented,undefined);
 const listeners=document.listeners.get("keydown").size;
 launch();p=globalThis.probe;frame();assert.equal(document.listeners.get("keydown").size,listeners,"one session listener after replacement");
 assert.equal(p.impulseDisplay.element.hidden,false);assert.equal(p.impulseDisplay.button.disabled,true);
 const absorb=()=>p.fragmentSystem.update({...p.fragmentSystem.snapshot().find(f=>!f.kind),trail:[]},940,392);
 const fill=()=>{while(!p.astralImpulse.isReady())absorb();frame();};
 fill();assert.equal(p.impulseDisplay.element.children[0].textContent,"20/20");assert.equal(p.impulseDisplay.button.disabled,false);
 assert.equal(p.impulseDisplay.hint.hidden,mode!=="story");
 const writes=[];const save=localStorage.setItem;localStorage.setItem=(k,v)=>{writes.push(k);save(k,v);};
 const head=p.movement.snapshot(),score=p.score.snapshot().points;
 assert.equal(key().prevented,true);assert.equal(p.impulseCombat.snapshot().active,true);assert.equal(p.impulseDisplay.element.children[0].textContent,"0/20");
 assert.equal(p.impulsePresentation.snapshot().armed,true);assert.equal(p.impulsePresentation.snapshot().bursts.length,0);
 assert.equal(p.impulseCombat.snapshot().x,head.x);assert.equal(p.score.snapshot().points,score);assert.equal(writes.length,0,"command creates no persistent writes");
 key("keydown",{repeat:true});assert.equal(p.astralImpulse.snapshot().energy,0);key("keyup");
 app.children.find(e=>e.className==="return-menu").emit("click");assert.equal(p.impulseDisplay.element.hidden,true);
 const paused=p.impulseCombat.snapshot();for(let i=0;i<hz;i++)frame();key();assert.deepEqual(p.impulseCombat.snapshot(),paused);
 window.innerWidth=390;window.innerHeight=844;setBounds({width:374,height:796});window.emit("orientationchange");frame();
 window.innerWidth=844;window.innerHeight=390;setBounds({width:828,height:342});window.emit("orientationchange");frame();
 assert.equal(p.impulseCombat.snapshot().active,false);assert.equal(p.impulseDisplay.element.hidden,true);assert.ok(getRuntimeState().suspensionReasons.includes("user-pause"));
 assert.equal(p.impulsePresentation.snapshot().armed,false,"orientation clears all presentation state");
 app.children.find(e=>e.className==="pause-overlay").children[1].emit("click");frame();
 fill();const energy=p.astralImpulse.snapshot().energy;
 touch(p.canvas);const beforeFullscreen=p.movement.snapshot().desiredHeading;
 document.emit("fullscreenchange");frame();assert.equal(p.astralImpulse.snapshot().energy,energy);
 touch(p.canvas,"pointermove",{clientX:2000,clientY:2000});
 assert.notEqual(p.movement.snapshot().desiredHeading,beforeFullscreen,"unchanged viewport keeps the active steering gesture");
 touch(p.canvas,"pointerup");
 touch(p.canvas);const desired=p.movement.snapshot().desiredHeading;
 touch(p.impulseDisplay.button,"pointerdown",{pointerId:2});assert.equal(p.impulseCombat.snapshot().active,true);
 assert.equal(p.movement.snapshot().desiredHeading,desired,"second finger attacks without steering");
 touch(p.impulseDisplay.button,"click");assert.equal(p.astralImpulse.snapshot().energy,0);
 touch(p.canvas,"pointerup");for(let i=0;i<hz*.5;i++)frame();fill();
 while(!p.portal.snapshot().active)absorb();fill();const held=p.astralImpulse.snapshot().energy;
 touch(p.canvas,"pointerdown",{pointerId:7});
 p.portal.update(p.portal.snapshot());continueStory();frame();
 const headingAfterPortal=p.movement.snapshot().desiredHeading;
 touch(p.canvas,"pointermove",{pointerId:7,clientX:-10000,clientY:-10000});
 assert.equal(p.movement.snapshot().desiredHeading,headingAfterPortal,"portal releases the old steering finger");
 assert.equal(p.astralImpulse.snapshot().energy,held);assert.equal(p.impulseDisplay.button.disabled,true);
 key();assert.equal(p.astralImpulse.snapshot().energy,held,"transition refuses command");key("keyup");
 p.zoneBackgroundTransition.update(2);frame();touch(p.impulseDisplay.button);assert.equal(p.astralImpulse.snapshot().energy,0);
 if(mode==="story") {for(let i=0;i<hz*4.2;i++)frame();fill();assert.equal(p.impulseDisplay.hint.hidden,true,"discovery not repeated");}
 const old=p, oldButton=p.impulseDisplay.button;
 app.children.find(e=>e.className==="return-menu").emit("click");app.children.find(e=>e.className==="pause-overlay").children[2].emit("click");
 assert.equal(document.listeners.get("keydown").size,listeners);touch(oldButton);key();assert.equal(old.impulseCombat.snapshot().active,false);
 launch();p=globalThis.probe;frame();assert.equal(p.astralImpulse.snapshot().energy,0);assert.equal(p.impulseDisplay.element.children[0].textContent,"0/20");
 endGame();frame();assert.equal(p.impulseDisplay.element.hidden,true);key();touch(p.impulseDisplay.button);
 assert.equal(p.impulseCombat.snapshot().active,false);assert.equal(p.astralImpulse.snapshot().energy,0);
}
if(!process.env.NYR_IMPULSE_UI_TEST) {
 for(const mode of ["story","infinite","survival"])for(const hz of [30,60,120]) {
  const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],{encoding:"utf8",env:{...process.env,NYR_IMPULSE_UI_TEST:"1",NYR_IMPULSE_UI_MODE:mode}});
  assert.equal(result.status,0,`${mode}/${hz}: ${result.stdout}${result.stderr}`);
 }
 console.log("Lot 3 real main: all modes at 30/60/120 Hz, HUD, keyboard, two fingers, pause, orientation/fullscreen, portals, storage and session cleanup OK");
}
