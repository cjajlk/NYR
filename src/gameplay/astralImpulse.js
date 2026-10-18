export const ASTRAL_IMPULSE_CAPACITY = 20;

// Session-only energy. No input, targets, effects, timers or persistent storage.
export function createAstralImpulse() {
  let energy = 0;

  function isReady() { return energy === ASTRAL_IMPULSE_CAPACITY; }
  function snapshot() {
    return Object.freeze({ energy, capacity: ASTRAL_IMPULSE_CAPACITY, ready: isReady() });
  }
  function absorbNormalFragment() {
    energy = Math.min(ASTRAL_IMPULSE_CAPACITY, energy + 1);
    return snapshot();
  }
  function consume() {
    if (!isReady()) return false;
    energy = 0;
    return true;
  }
  function reset() { energy = 0; return snapshot(); }

  return Object.freeze({ absorbNormalFragment, isReady, consume, reset, snapshot });
}
