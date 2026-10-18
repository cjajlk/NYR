import assert from "node:assert/strict";
import { createAstralImpulse, ASTRAL_IMPULSE_CAPACITY } from "../../src/gameplay/astralImpulse.js";

const charge = createAstralImpulse();
assert.equal(ASTRAL_IMPULSE_CAPACITY, 20);
assert.deepEqual(charge.snapshot(), { energy: 0, capacity: 20, ready: false });
assert.equal(charge.consume(), false);
const initial = charge.snapshot();
for (let i = 1; i <= 19; i++) {
  charge.absorbNormalFragment();
  assert.equal(charge.snapshot().energy, i);
  assert.equal(charge.isReady(), false);
}
const nineteen = charge.snapshot();
assert.equal(charge.consume(), false);
assert.deepEqual(charge.snapshot(), nineteen);
charge.absorbNormalFragment();
assert.equal(charge.snapshot().energy, 20);
assert.equal(charge.isReady(), true);
for (let i = 0; i < 1000; i++) charge.absorbNormalFragment();
assert.deepEqual(charge.snapshot(), { energy: 20, capacity: 20, ready: true });
assert.equal(charge.consume(), true, "consumption needs neither a target nor the application");
assert.deepEqual(charge.snapshot(), initial);
assert.equal(charge.consume(), false);
charge.absorbNormalFragment();
assert.equal(charge.snapshot().energy, 1, "no reserve behind a full charge");
charge.reset();
assert.deepEqual(charge.snapshot(), initial);
const another = createAstralImpulse();
charge.absorbNormalFragment();
assert.equal(another.snapshot().energy, 0);
assert.ok(Object.isFrozen(initial));
assert.throws(() => { initial.energy = 99; }, TypeError);
assert.equal(charge.snapshot().energy, 1, "snapshots cannot mutate state");
await new Promise(resolve => setTimeout(resolve, 30));
assert.equal(charge.snapshot().energy, 1, "no timer-based recharge");
console.log("Astral impulse Lot 1: exact charge, saturation, readiness, refusal, consumption, reset and session isolation OK");
