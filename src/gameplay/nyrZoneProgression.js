export const NYR_ZONE_PROGRESSION_CONFIG = Object.freeze({
  zoneTwoThresholdFragments: 25
});

export const NYR_ZONES = Object.freeze({
  ZONE_1: "zone-1",
  ZONE_2: "zone-2"
});

export function createNyrZoneProgression({
  config = NYR_ZONE_PROGRESSION_CONFIG,
  onZoneTwoReached = () => {}
} = {}) {
  let currentZone = NYR_ZONES.ZONE_1;

  function sync(progressionSnapshot) {
    const normalFragmentsAbsorbed = progressionSnapshot?.normalFragmentsAbsorbed;
    const reachedNow = currentZone === NYR_ZONES.ZONE_1 &&
      Number.isFinite(normalFragmentsAbsorbed) &&
      normalFragmentsAbsorbed >= config.zoneTwoThresholdFragments;

    if (reachedNow) {
      currentZone = NYR_ZONES.ZONE_2;
      onZoneTwoReached(Object.freeze({
        currentZone,
        normalFragmentsAbsorbed,
        threshold: config.zoneTwoThresholdFragments
      }));
    }

    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ currentZone });
  }

  return Object.freeze({ sync, snapshot });
}
