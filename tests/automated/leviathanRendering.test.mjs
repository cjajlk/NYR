import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSkinSprites } from "../../src/gameplay/skinSprites.js";
import { renderNyr } from "../../src/gameplay/nyrRenderer.js";
import { createNyrMovement } from "../../src/gameplay/nyrMovement.js";

const root = new URL("../../", import.meta.url);
function createImage() {
  return { complete: true, set src(path) {
    this.path = path;
    const png = readFileSync(new URL(path, root));
    this.naturalWidth = png.readUInt32BE(16); this.naturalHeight = png.readUInt32BE(20);
  } };
}
function recorder() {
  let transform = { x: 0, y: 0, angle: 0 }, stack = [];
  const calls = [];
  const context = new Proxy({ save() { stack.push({ ...transform }); }, restore() { transform = stack.pop(); },
    translate(x, y) { transform.x += x; transform.y += y; }, rotate(angle) { transform.angle += angle; },
    drawImage(image, ...args) { calls.push({ path: image.path, ...transform, args, width: image.naturalWidth, height: image.naturalHeight }); }
  }, { get(target, key) { return target[key] ?? (() => {}); } });
  return { calls, context };
}
const forms = ["eclat", "spectre", "nocturne", "devoreur"];
const nativeHeadAxes = { eclat: [-38, 47], spectre: [-63, 45], nocturne: [-54, 56], devoreur: [72, 48] };
const tailRoots = { eclat: [148, 172], spectre: [97, 21], nocturne: [31, 20], devoreur: [82, 20] };
const tailAxes = { eclat: [136, 155], spectre: [85, -99], nocturne: [-42, -125], devoreur: [-10, -138] };
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
const legacy = JSON.parse(readFileSync(new URL("../fixtures/leviathan_other_skin_render.json", import.meta.url)));
const legacyDraw = createSkinSprites(() => "test", createImage);
for (const form of forms) {
  const r = recorder();
  legacyDraw(r.context, { x:91, y:127, heading:0.37 }, [{x:78,y:122,angle:-2.8},{x:66,y:118,angle:-2.7},{x:54,y:113,angle:-2.6},{x:44,y:108,angle:-2.5}], form);
  assert.deepEqual(r.calls.map(({width,height,...call})=>call), legacy[form], "existing paid skin must draw identically");
}
const sprites = createSkinSprites(() => "leviathan_astral", createImage);
let combinations = 0;
for (const count of [4,30,120]) for (const path of ["straight","left","right","tight-left","tight-right","change"]) {
  const movement = createNyrMovement(); movement.reset(10000,10000); movement.addSegments(count-4);
  for (let i=0;i<Math.ceil((count*14+100)/95*60);i++) {
    const p=movement.snapshot();
    const turn=path==="straight"?0:path==="left"?-0.015:path==="right"?0.015:path==="tight-left"?-Math.PI/2:path==="tight-right"?Math.PI/2:(Math.floor(i/120)%2?-1:1)*Math.PI/2;
    if(turn) movement.aimAt(p.x+Math.cos(p.heading+turn)*100,p.y+Math.sin(p.heading+turn)*100);
    movement.update(1/60,10000,10000);
  }
  const original=movement.snapshot();
  for (const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4]) for (const form of forms) {
    const state = { ...original, heading };
    const before = JSON.stringify(state), r=recorder();
    let bodyPoses;
    renderNyr(r.context,state,{currentForm:form},null,undefined,undefined,undefined,(c,s,poses,f)=>{bodyPoses=poses;return sprites(c,s,poses,f);});
    assert.equal(JSON.stringify(state),before,"drawing never mutates simulation state");
    assert.equal(r.calls.length,count+1);
    const head=r.calls.at(-1), tail=r.calls[0];
    near(head.x,state.x);near(head.y,state.y);
    const [dx,dy]=nativeHeadAxes[form];
    // Anatomical muzzle direction, checked in world coordinates in eight directions.
    near((dx*Math.cos(head.angle)-dy*Math.sin(head.angle))/Math.hypot(dx,dy), Math.cos(heading));
    near((dx*Math.sin(head.angle)+dy*Math.cos(head.angle))/Math.hypot(dx,dy), Math.sin(heading));
    // The tail's anatomical root, rather than its transparent canvas center, joins the last pose.
    const [rx,ry]=tailRoots[form], [x,y,w,h]=tail.args;
    near(x+rx*w/tail.width,0);near(y+ry*h/tail.height,0);
    near(tail.x,bodyPoses.at(-1).x);near(tail.y,bodyPoses.at(-1).y);
    const [tx,ty]=tailAxes[form], tangent=bodyPoses.at(-1).angle+Math.PI;
    near((tx*Math.cos(tail.angle)-ty*Math.sin(tail.angle))/Math.hypot(tx,ty),Math.cos(tangent));
    near((tx*Math.sin(tail.angle)+ty*Math.cos(tail.angle))/Math.hypot(tx,ty),Math.sin(tangent));
    for(const call of r.calls) {
      assert.ok([call.x,call.y,call.angle,...call.args].every(Number.isFinite));
      near(call.args[2]/call.width,call.args[3]/call.height,"no image squeezing");
    }
    for(let i=0;i<count;i++) {
      const call=r.calls[count-1-i];near(call.x,bodyPoses[i].x);near(call.y,bodyPoses[i].y);
    }
    combinations++;
  }
}
const classic=recorder();assert.equal(createSkinSprites(()=>"classic",createImage)(classic.context,{},[],"eclat"),false);assert.equal(classic.calls.length,0);
const loading=()=>({complete:false,naturalWidth:0,naturalHeight:0});
assert.equal(createSkinSprites(()=>"leviathan_astral",loading)(recorder().context,{},[],"eclat"),false,"loading keeps the existing fallback");
console.log(`Léviathan: ${combinations} rendering combinations, native directions, tail joins, aspect ratios and other skins OK`);
