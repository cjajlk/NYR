export const VOID_LEVELS = Object.freeze([
  [109.25, 4, 10], [113, 3.7, 9], [117, 3.4, 8],
  [121, 3.1, 7], [125, 2.8, 6], [129, 2.5, 5]
].map(([speed, pocketCooldown, corruptionInterval]) => Object.freeze({ speed, pocketCooldown, corruptionInterval })));
export function createVoidDifficulty() {
  let entryTime = null;
  let elapsed = 0;
  function enter(simulationTime) {
    entryTime = simulationTime;
    elapsed = 0;
    return snapshot();
  }
  function sync(simulationTime) {
    if (entryTime !== null) elapsed = Math.max(0, simulationTime - entryTime);
    return snapshot();
  }
  function snapshot() {
    if (entryTime === null) return Object.freeze({ entryTime, elapsed: 0, level: null });
    const level = Math.min(5, Math.floor((elapsed + 1e-9) / 60));
    return Object.freeze({ entryTime, elapsed, level, ...VOID_LEVELS[level] });
  }
  return Object.freeze({ enter, sync, snapshot });
}
