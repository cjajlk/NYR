import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createCosmeticsStore, COSMETICS_KEY } from "../../src/gameplay/cosmetics.js";
import { createSkinSprites, SKIN_PARTS, skinAssetPath } from "../../src/gameplay/skinSprites.js";
import { renderNyr } from "../../src/gameplay/nyrRenderer.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";
import { createNyrProgression } from "../../src/gameplay/nyrProgression.js";

function verifyStoreAndRenderer() {
  const data=new Map([["nyrWeeklyChallengesV1",'{"balance":425}'],["nyrStatisticsV1",'{"bestScore":9000}']]);
  const writes=[];
  const storage={getItem:k=>data.get(k)??null,setItem(k,v){writes.push(k);data.set(k,v);}};
  const store=createCosmeticsStore(()=>storage);
  assert.deepEqual(store.snapshot(),{owned:["classic"],equipped:{skin:"classic"}});
  assert.equal(store.equip("test"),false);
  assert.equal(store.unlock("unknown"),false);
  assert.equal(store.unlock("test"),true);
  assert.equal(store.unlock("test"),false);
  assert.equal(store.snapshot().equipped.skin,"classic","unlock is separate from equip");
  assert.equal(store.equip("test"),true);
  assert.deepEqual(createCosmeticsStore(()=>storage).snapshot(),store.snapshot());
  assert.equal(store.equip("classic"),true);
  assert.equal(createCosmeticsStore(()=>storage).snapshot().equipped.skin,"classic");
  assert.equal(data.get("nyrWeeklyChallengesV1"),'{"balance":425}');
  assert.equal(data.get("nyrStatisticsV1"),'{"bestScore":9000}');
  assert.ok(writes.every(k=>k===COSMETICS_KEY));
  const blocked=createCosmeticsStore(()=>{throw Error("blocked");});assert.equal(blocked.unlock("test"),false);
  assert.equal(blocked.snapshot().equipped.skin,"classic");
  for(const raw of ["bad JSON",'null','{"version":1,"owned":[],"equipped":{"skin":"test"}}']) {
    const bad=createCosmeticsStore(()=>({getItem:()=>raw}));assert.equal(bad.snapshot().equipped.skin,"classic");
  }
  const loaded=[];let equipped="test";
  const sprites=createSkinSprites(()=>equipped,()=>{const image={complete:true,naturalWidth:1774,naturalHeight:887};loaded.push(image);return image;});
  function context() {
    const calls=[];
    return {calls,ctx:new Proxy({}, {get:(target,key)=>target[key]??((...args)=>{calls.push([key,...args]);return {addColorStop(){}};})})};
  }
  const movement=createNyrMovement();movement.reset(940,392);movement.addSegments(116);
  for(let i=0;i<500;i++){if(i===200)movement.aimAt(480,300);movement.update(1/120,940,392);}
  const state=movement.snapshot(), saved=JSON.stringify(state), progression=createNyrProgression();
  for(let count=0;count<=450;count++) {
    if([0,49,50,149,150,299,300,450].includes(count)) {
      const form=progression.snapshot();const classic=context(), skinned=context();
      renderNyr(classic.ctx,state,form);
      renderNyr(skinned.ctx,state,form,null,undefined,undefined,undefined,sprites);
      const draws=skinned.calls.filter(c=>c[0]==="drawImage");
      if(count<150) {
        assert.equal(draws.length,121,"120 visible segments plus head");
        const expected=count<50?"eclat":"spectre";
        assert.ok(draws.every(c=>c[1].src.includes(`nyr_${expected}_`)));
        assert.ok(draws[0][1].src.endsWith("queue.png"));
        assert.ok(draws.at(-1)[1].src.endsWith("tete.png"));
        const body=draws.slice(1,-1).reverse();
        body.forEach((call,i)=>assert.ok(call[1].src.endsWith(`ecaille_0${i%3+1}.png`)));
        const translations=skinned.calls.filter(c=>c[0]==="translate");
        assert.deepEqual(translations.at(-1),["translate",state.x,state.y]);
        assert.ok(skinned.calls.filter(c=>c[0]==="rotate").every(c=>Number.isFinite(c[1])));
      } else assert.deepEqual(skinned.calls,classic.calls,"unavailable forms use exactly the classic renderer");
    }
    progression.recordNormalFragmentAbsorption();
  }
  assert.equal(loaded.length,10,"images cached across frames and runs");
  equipped="classic";const a=context(),b=context();
  renderNyr(a.ctx,state,{currentForm:"eclat"});renderNyr(b.ctx,state,{currentForm:"eclat"},null,undefined,undefined,undefined,sprites);
  assert.deepEqual(a.calls,b.calls,"classic unchanged");
  const pending=createSkinSprites(()=>"test",()=>({complete:false,naturalWidth:0,naturalHeight:0}));
  const c=context();renderNyr(c.ctx,state,{currentForm:"eclat"},null,undefined,undefined,undefined,pending);assert.deepEqual(c.calls,a.calls);
  assert.equal(JSON.stringify(movement.snapshot()),saved,"rendering never mutates physical state");
  for(const form of ["eclat","spectre"])for(const part of SKIN_PARTS){
    const png=readFileSync(new URL(`../../${skinAssetPath(form,part)}`,import.meta.url));
    assert.equal(png.subarray(1,4).toString(),"PNG");assert.equal(png[25],6,"RGBA assets preserved");
  }
}
export function verifyShop({app,frame,snapshot,hz,setBounds}) {
  const initial=snapshot(globalThis.probe);
  globalThis.quitToMenu();
  const p=globalThis.probe, before=snapshot(p), weekly=p.readWeekly(), totals=p.readTotals();
  const menu=app.children.find(e=>e.className==="main-menu");
  menu.children.find(e=>e.textContent==="BOUTIQUE").emit("click");
  const panel=menu.children.find(e=>e.className==="shop-panel");assert.equal(panel.hidden,false);
  const cards=panel.children[1].children, classic=cards[0].children.at(-1), test=cards[1].children.at(-1);
  assert.equal(classic.textContent,"ÉQUIPÉ");assert.equal(test.textContent,"DÉBLOQUER");
  test.emit("click");assert.equal(test.textContent,"ÉQUIPER");test.emit("click");assert.equal(test.textContent,"ÉQUIPÉ");
  assert.equal(createCosmeticsStore().snapshot().equipped.skin,"test");
  for(let i=0;i<hz;i++)frame();assert.deepEqual(snapshot(p),before);assert.deepEqual(p.readWeekly(),weekly);assert.deepEqual(p.readTotals(),totals);
  window.innerWidth=440;window.innerHeight=956;setBounds({width:424,height:908});window.emit("resize");frame();
  classic.emit("click");assert.equal(p.readCosmetics().equipped.skin,"test","portrait cannot change equipment");
  window.innerWidth=956;window.innerHeight=440;setBounds({width:940,height:392});window.emit("resize");frame();assert.equal(panel.hidden,false);
  classic.emit("click");assert.equal(p.readCosmetics().equipped.skin,"classic");
  menu.children.find(e=>e.textContent==="RETOUR").emit("click");assert.equal(panel.hidden,true);
  menu.children[1].emit("click");assert.deepEqual(snapshot(globalThis.probe),initial);
}
if(!process.env.NYR_SHOP_TEST) {
  verifyStoreAndRenderer();
  for(const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],{encoding:"utf8",env:{...process.env,NYR_SHOP_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("PACK 49 shop and cosmetic skin: tests OK");
}
