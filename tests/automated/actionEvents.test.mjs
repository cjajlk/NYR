import assert from "node:assert/strict";
import { createActionEvents, ACTION_EVENT_CONFIG, renderActionEvents } from "../../src/gameplay/actionEvents.js";
import { createNyrStability } from "../../src/gameplay/nyrStability.js";
import { createNyrScore } from "../../src/gameplay/nyrScore.js";

function rig(zone = "zone-2", width = 844, height = 390, random = () => 0.5) {
  const stability = createNyrStability(), score = createNyrScore();
  let hits = [], bonuses = 0;
  const events = createActionEvents({ random, onDamage(amount) {
    hits.push(amount); amount === 25 ? stability.applyAsteroidContact() : stability.applyCorruptionContact();
  }, onDodge(amount) { assert.equal(amount, 100); bonuses++; score.awardDodge(); } });
  const options = { zone, width, height, head: { x: width / 2, y: height / 2 } };
  const tick = (seconds, head = options.head, extra = {}) => {
    for (let i = 0; i < Math.round(seconds * 100); i++) events.update(0.01, { ...options, head, ...extra });
  };
  events.reset(zone);
  return { events, options, tick, stability, score, hits, get bonuses() { return bonuses; } };
}
function waitFor(r, kind) {
  for (let i = 0; i < 60000; i++) {
    r.tick(0.01, kind === "wave" ? { x: 10000, y: 10000 } : r.options.head);
    const event = r.events.snapshot().event;
    if (event?.kind === kind && event.phase === "warning") return event;
  }
  throw Error(`No ${kind}`);
}
for (const [width, height] of [[1280, 720], [667, 375], [844, 390]]) {
  for (const zone of Object.keys(ACTION_EVENT_CONFIG)) {
    const r = rig(zone, width, height);
    const rain = waitFor(r, "rain");
    const [min, max] = ACTION_EVENT_CONFIG[zone].meteors;
    assert.ok(rain.meteors.length >= min && rain.meteors.length <= max);
    assert.ok(rain.meteors.every(m => Math.hypot(m.x - r.options.head.x, m.y - r.options.head.y) >= 120));
    assert.equal(r.stability.snapshot().stability, 100);
    r.tick(1.4); assert.equal(r.events.snapshot().event.phase, "warning");
    const paused = r.events.snapshot(); r.tick(20, r.options.head, { active: false });
    assert.deepEqual(r.events.snapshot(), paused);
    r.tick(0.2); assert.equal(r.events.snapshot().event.phase, "active");
    // Parallel lanes leave corridors wider than the physical head on both viewports.
    const lanes = rain.meteors.map(m => m.vx ? m.y : m.x);
    for (let i = 1; i < lanes.length; i++) assert.ok(lanes[i] - lanes[i - 1] > 2 * (17 + 14));
    r.events.reset(zone); assert.equal(r.events.snapshot().event, null);
    r.tick(100, r.options.head, { blocked: true }); assert.equal(r.events.snapshot().event, null);
    r.tick(100, r.options.head, { enabled: false }); assert.equal(r.events.snapshot().event, null);
  }
}
{
  const r = rig("zone-1"); waitFor(r, "rain"); r.tick(1.51);
  let meteor = r.events.snapshot().event.meteors[0];
  const head = { x: meteor.x + meteor.vx * 0.01, y: meteor.y + meteor.vy * 0.01 };
  r.tick(0.01, head); assert.deepEqual(r.hits, [25]); assert.equal(r.stability.snapshot().stability, 75);
  for (let i = 0; i < 50; i++) {
    meteor = r.events.snapshot().event.meteors[0];
    r.tick(0.01, { x: meteor.x + meteor.vx * 0.01, y: meteor.y + meteor.vy * 0.01 });
  }
  assert.deepEqual(r.hits, [25]); r.tick(20, { x: 10000, y: 10000 }); assert.equal(r.bonuses, 0);
}
{
  const r = rig("zone-1"); waitFor(r, "rain"); r.tick(1.51);
  const m = r.events.snapshot().event.meteors[0];
  // Sideways separation of 40px: 9px outside physical contact, inside near band.
  r.tick(0.01, { x: m.x + m.vx * 0.01, y: m.y + 40 });
  assert.equal(r.bonuses, 0, "reward deferred until obstacle leaves surface");
  r.tick(20, { x: 10000, y: 10000 });
  assert.equal(r.bonuses, 1); assert.equal(r.score.snapshot().points, 100);
  r.tick(10, { x: 10000, y: 10000 }); assert.equal(r.bonuses, 1);
}
{
  const r = rig("zone-1"); waitFor(r, "rain"); r.tick(25, { x: 10000, y: 10000 });
  assert.equal(r.bonuses, 0, "no real proximity, no reward");
}
{
  const r = rig(); waitFor(r, "wave");
  r.tick(1.9); assert.equal(r.events.snapshot().event.phase, "warning");
  const wave = r.events.snapshot().event;
  r.tick(0.05, { x: wave.x, y: wave.y }); assert.equal(r.hits.filter(n => n === 20).length, 0);
  r.tick(0.15, { x: wave.x + 5, y: wave.y });
  assert.equal(r.events.snapshot().event.phase, "active");
  assert.equal(r.hits.filter(n => n === 20).length, 1);
  r.tick(0.9, { x: wave.x, y: wave.y });
  assert.equal(r.hits.filter(n => n === 20).length, 1, "center behind ring is safe");
  r.tick(0.55, { x: wave.x, y: wave.y }); assert.equal(r.events.snapshot().event.phase, "dissipating");
  r.tick(0.5, { x: wave.x + wave.maximum, y: wave.y }); assert.equal(r.events.snapshot().event, null);
  assert.equal(r.hits.filter(n => n === 20).length, 1); assert.equal(r.bonuses, 0);
}
{
  const r = rig(); const wave = waitFor(r, "wave");
  r.tick(2, { x: wave.x + wave.maximum + 32, y: wave.y });
  r.tick(2.1, { x: wave.x + wave.maximum + 32, y: wave.y });
  assert.equal(r.bonuses, 1); assert.equal(r.hits.filter(n => n === 20).length, 0);
}
{
  const r = rig(); const wave = waitFor(r, "wave");
  r.tick(1.99, { x: wave.x, y: wave.y }); r.events.noteDamage();
  r.tick(1.6, { x: wave.x, y: wave.y });
  assert.equal(r.hits.filter(n => n === 20).length, 0, "interior behind ring stays safe after shield expires");
}
{
  const r = rig("zone-1"); waitFor(r, "rain"); r.tick(1.51);
  let m = r.events.snapshot().event.meteors[0];
  r.tick(0.01, { x: m.x + (m.vy ? 40 : m.vx * 0.01), y: m.y + (m.vx ? 40 : m.vy * 0.01) });
  m = r.events.snapshot().event.meteors[0];
  r.tick(0.01, { x: m.x + m.vx * 0.01, y: m.y + m.vy * 0.01 });
  r.tick(20, { x: 10000, y: 10000 });
  assert.equal(r.bonuses, 0, "near pass followed by damaging contact never rewards");
}
for (const value of [0, 0.999]) {
  const r = rig("zone-4", 667, 375, () => value); const rain = waitFor(r, "rain");
  assert.equal(rain.meteors.length, value ? 5 : 4);
  assert.ok(rain.meteors.every(m => m.vy !== 0), "mobile uses the wider axis for escape lanes");
}
{
  const r = rig("zone-1"); waitFor(r, "rain"); r.tick(1.51); r.events.noteDamage();
  const m = r.events.snapshot().event.meteors[0];
  r.tick(0.01, { x: m.x + m.vx * 0.01, y: m.y }); assert.equal(r.hits.length, 0);
  r.tick(20, { x: 10000, y: 10000 }); assert.equal(r.bonuses, 0, "shielded contact disqualifies reward");
  r.tick(0.01, r.options.head, { zone: "zone-3" }); assert.equal(r.events.snapshot().event, null);
}
{
  const ctx = new Proxy({}, { get: (target, key) => key in target ? target[key] : () => {} });
  for (const skin of ["classic", "test", "leviathan_astral"]) {
    const r = rig(); const wave = waitFor(r, "wave");
    const state = r.events.snapshot(); renderActionEvents(ctx, state, 844, 390);
    assert.deepEqual(r.events.snapshot(), state, `${skin}: graphics do not alter collision state`);
    r.tick(0.1, { ...r.options.head, skin, graphicWidth: 10000 });
    assert.ok(wave.maximum < 200);
  }
}
console.log("Action events: phases, damage, near misses, pause, zones, spawn safety, corridors and cleanup OK");
