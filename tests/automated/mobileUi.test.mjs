import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { needsLandscape } from "../../src/ui/mobileOrientation.js";
import { createGameplayAudio, AUDIO_PREFERENCES_KEY } from "../../src/systems/gameplayAudio.js";
import { getRuntimeState } from "../../src/core/runtimeState.js";

export function verifyMobileUiRuntime({ app, frame, hz, setBounds }) {
  const menu = () => app.children.find(e => e.className === "main-menu");
  const audioPanel = () => menu().children.find(e => e.className === "audio-options");
  const orientation = () => app.children.find(e => e.className === "orientation-overlay");
  function portrait() { window.innerWidth = 390; window.innerHeight = 844; setBounds({width:374,height:796}); window.emit("resize"); frame(); }
  function landscape() { window.innerWidth = 844; window.innerHeight = 390; setBounds({width:828,height:342}); window.emit("resize"); frame(); }
  assert.equal(app.children.some(e => e.className === "gameplay-sound-toggle"), false);
  assert.equal(audioPanel().hidden, true);
  menu().children[2].emit("click"); assert.equal(audioPanel().hidden, false);
  const sound = audioPanel().children[0];
  sound.emit("click"); assert.equal(sound.textContent, "SON : OFF");
  assert.equal(JSON.parse(localStorage.getItem(AUDIO_PREFERENCES_KEY)).enabled, false);
  portrait(); assert.equal(orientation().hidden, false);
  assert.ok(app.children.filter(e => e !== orientation()).every(e => e.inert));
  sound.emit("click"); assert.equal(sound.textContent, "SON : OFF", "portrait cannot activate background control");
  landscape(); assert.equal(audioPanel().hidden, false); assert.equal(sound.textContent, "SON : OFF");
  menu().children[5].emit("click");
  const shop = menu().children.find(e => e.className?.includes("menu-shop"));
  shop.emit("click"); assert.equal(audioPanel().hidden, true);
  portrait(); landscape(); assert.equal(menu().children[0].textContent, "BOUTIQUE");
  menu().children[5].emit("click");
  menu().children[1].emit("click"); // Harness launches unlocked Infinite mode.
  assert.equal(menu().hidden, true); assert.equal(audioPanel().hidden, true);
  const p = globalThis.probe;
  app.children.find(e => e.className === "return-menu").emit("click");
  const before = p.movement.snapshot(); portrait(); landscape(); portrait(); landscape();
  for (let i = 0; i < hz; i++) frame();
  assert.deepEqual(p.movement.snapshot(), before);
  assert.ok(getRuntimeState().suspensionReasons.includes("user-pause"));
  assert.equal(app.children.some(e => e.className === "gameplay-sound-toggle"), false);
  // PC window in portrait proportions stays available, including a touch-capable PC.
  window.navigator = { userAgent: "Windows", maxTouchPoints: 10 };
  window.matchMedia = () => ({matches:false}); portrait();
  assert.equal(orientation().hidden, true);
  assert.ok(!getRuntimeState().suspensionReasons.includes("portrait-orientation"));
}
if (!process.env.NYR_MOBILE_UI_TEST) {
  for (const [width,height] of [[320,568],[360,800],[390,844],[430,932]]) {
    assert.equal(needsLandscape({width,height,navigator:{userAgent:"iPhone"}}),true);
    assert.equal(needsLandscape({width:height,height:width,navigator:{userAgent:"iPhone"}}),false);
    assert.equal(needsLandscape({width,height,navigator:{userAgent:"Windows",maxTouchPoints:0}}),false);
  }
  assert.equal(needsLandscape({width:900,height:600,surfaceWidth:350,surfaceHeight:550,navigator:{userAgent:"Android"}}),true);
  assert.equal(needsLandscape({width:390,height:844,navigator:{platform:"MacIntel",maxTouchPoints:5}}),true);
  assert.equal(needsLandscape({width:390,height:844,navigator:{userAgent:"Windows",maxTouchPoints:10},matchMedia:()=>({matches:true})}),false);
  const saved = new Map([["nyrCosmeticsV1","untouched"]]);
  const getStorage = () => ({getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)});
  const audio = createGameplayAudio({getStorage,Context:null}); audio.setEnabled(false);
  assert.equal(createGameplayAudio({getStorage,Context:null}).isEnabled(),false);
  assert.equal(saved.get("nyrCosmeticsV1"),"untouched");
  assert.doesNotThrow(()=>createGameplayAudio({getStorage:()=>{throw Error("denied");}}).setEnabled(false));
  for (const hz of [30,60,120]) {
    const result=spawnSync(process.execPath,[fileURLToPath(new URL("./pack30Replay.test.mjs",import.meta.url)),String(hz)],
      {encoding:"utf8",env:{...process.env,NYR_MOBILE_UI_TEST:"1"}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  console.log("Mobile UI: Options-only sound, persisted preference, mobile/PC orientation, inert background and paused rotation OK");
}
