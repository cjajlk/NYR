export const COMBO_WINDOW_SECONDS = 3;
export function createNyrCombo() {
  let chain = 0;
  let remaining = 0;
  function reset() { chain = 0; remaining = 0; }
  function update(delta) {
    if (!Number.isFinite(delta) || delta <= 0 || !remaining) return;
    remaining = Math.max(0, remaining - delta);
    if (remaining < 1e-9) reset();
  }
  function absorb() {
    chain++;
    remaining = COMBO_WINDOW_SECONDS;
    return snapshot().multiplier;
  }
  function snapshot() {
    return Object.freeze({ chain, remaining, multiplier: Math.min(4, Math.floor((Math.max(1, chain) - 1) / 2) + 1) });
  }
  return Object.freeze({ absorb, update, reset, snapshot });
}
