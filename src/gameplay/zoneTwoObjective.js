export const ZONE_TWO_TARGET = 15;
export const ZONE_THREE_TARGET = 20;
export const createZoneTwoObjective = createRelativeZoneObjective;
export function createRelativeZoneObjective() {
  let entryCount = null;
  let absorbed = 0;
  function enter(globalCount) {
    if (entryCount !== null) return;
    entryCount = globalCount;
  }
  function sync(globalCount) {
    if (entryCount !== null) absorbed = Math.max(0, globalCount - entryCount);
    return snapshot();
  }
  function snapshot() { return Object.freeze({ entryCount, absorbed }); }
  return Object.freeze({ enter, sync, snapshot });
}
