import assert from "node:assert/strict";
import { createWeeklyChallenges, WEEKLY_KEY, getLocalWeek } from "../../src/gameplay/weeklyChallenges.js";
import { createCosmeticsStore, COSMETICS_KEY, SKINS } from "../../src/gameplay/cosmetics.js";

function fixture(balance, legacy = false) {
  let date = new Date(2026, 8, 27, 12);
  let fail = false;
  const saved = new Map([[WEEKLY_KEY, JSON.stringify({version:1,weekId:getLocalWeek(date).id,balance,
    progress:{normalFragments:250,cycles:2,activeTime:20,devoreurRuns:1},claimed:{},completed:{contact:true}})],
    ["nyrStatisticsV1",'{"version":1,"totals":{"bestScore":1234}}']]);
  if (legacy) saved.set(COSMETICS_KEY,JSON.stringify({version:1,owned:["classic","test"],equipped:{skin:"test"}}));
  const writes=[];
  const storage={getItem:key=>saved.get(key)??null,setItem(key,value){if(fail)throw Error("quota");writes.push(key);saved.set(key,value);}};
  const options={now:()=>date,getStorage:()=>storage};
  const wallet=createWeeklyChallenges(options);
  const shop=createCosmeticsStore(wallet,()=>storage);
  return {saved,writes,storage,options,wallet,shop,setFail:value=>fail=value,nextWeek:()=>date=new Date(2026,8,28)};
}
assert.equal(SKINS.length,2);assert.equal(SKINS.find(s=>s.id==="test").price,750);
assert.deepEqual(Object.keys(SKINS.find(s=>s.id==="test").forms),["eclat","spectre","nocturne","devoreur"]);
for(const balance of [0,749,750,800]) {
  const f=fixture(balance), before=f.wallet.snapshot();
  assert.equal(f.shop.purchase("classic"),false);assert.equal(f.shop.purchase("unknown"),false);
  assert.equal(f.shop.equip("test"),false);
  assert.equal(f.shop.purchase("test"),balance>=750);
  assert.equal(f.wallet.snapshot().balance,balance>=750?balance-750:balance);
  assert.deepEqual(f.wallet.snapshot().challenges,before.challenges,"buy does not alter challenges");
  if(balance>=750) {
    assert.deepEqual(f.writes,[WEEKLY_KEY],"one write atomically debits and grants ownership");
    const persisted=JSON.parse(f.saved.get(WEEKLY_KEY));
    assert.equal(persisted.balance,balance-750);assert.deepEqual(persisted.ownedSkins,["test"]);
    for(let i=0;i<5;i++)assert.equal(f.shop.purchase("test"),false);
    assert.equal(f.shop.snapshot().equipped.skin,"classic");
    assert.equal(f.shop.equip("test"),true);
    const reloaded=createWeeklyChallenges(f.options);
    const shopReloaded=createCosmeticsStore(reloaded,()=>f.storage);
    assert.deepEqual(shopReloaded.snapshot(),f.shop.snapshot());
    assert.equal(shopReloaded.purchase("test"),false);
    assert.equal(shopReloaded.equip("classic"),true);assert.equal(shopReloaded.equip("test"),true);
    assert.equal(reloaded.snapshot().balance,balance-750,"equipping never spends currency");
    assert.equal(reloaded.claim("contact",reloaded.snapshot().week.id),true);
    assert.equal(f.wallet.snapshot().balance,balance-750+50,"future challenge reward uses the same wallet");
    f.nextWeek();f.wallet.flush();
    assert.equal(f.wallet.snapshot().balance,balance-750+50);
    assert.ok(f.wallet.snapshot().ownedSkins.includes("test"));
    assert.ok(f.wallet.snapshot().challenges.every(c=>c.progress===0));
    assert.equal(createCosmeticsStore(createWeeklyChallenges(f.options),()=>f.storage).snapshot().equipped.skin,"test");
  } else assert.equal(f.writes.length,0,"insufficient funds cause no write");
  assert.equal(f.saved.get("nyrStatisticsV1"),'{"version":1,"totals":{"bestScore":1234}}');
}
const migration=fixture(800,true), beforeMigration=migration.saved.get(WEEKLY_KEY);
assert.deepEqual(migration.shop.snapshot(),{owned:["classic"],equipped:{skin:"classic"}});
assert.equal(migration.saved.get(WEEKLY_KEY),beforeMigration,"preproduction migration preserves wallet and challenges exactly");
assert.equal(migration.shop.purchase("test"),true);assert.equal(migration.wallet.snapshot().balance,50);
const failed=fixture(800);failed.setFail(true);
assert.equal(failed.shop.purchase("test"),false);assert.equal(failed.wallet.snapshot().balance,800);
assert.deepEqual(failed.shop.snapshot().owned,["classic"]);
failed.setFail(false);assert.equal(failed.shop.purchase("test"),true);assert.equal(failed.wallet.snapshot().balance,50);
const stale=fixture(800), second=createWeeklyChallenges(stale.options);
const observe=stale.wallet.trackRun(()=>({normalFragments:0,cycles:0,activeTime:1,maxForm:"eclat"}));observe();
assert.equal(second.purchaseSkin("test"),true);
stale.wallet.flush();assert.equal(stale.wallet.snapshot().balance,50,"old in-memory balance cannot resurrect spent currency");
assert.equal(stale.shop.purchase("test"),false);
// Unknown future possessions survive purchases, claims, equipment and week rollover.
const future=fixture(800);const document=JSON.parse(future.saved.get(WEEKLY_KEY));document.ownedSkins=["future_skin"];
future.saved.set(WEEKLY_KEY,JSON.stringify(document));assert.equal(future.shop.purchase("test"),true);
future.nextWeek();future.wallet.flush();assert.deepEqual(future.wallet.snapshot().ownedSkins,["future_skin","test"]);
console.log("PACK 50 paid skin transactions and migration: tests OK");
