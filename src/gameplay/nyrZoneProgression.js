export const NYR_ZONE_PROGRESSION_CONFIG = Object.freeze({
  zoneTwoThresholdFragments: 25
});

export const NYR_ZONES = Object.freeze({
  ZONE_1: "zone-1",
  ZONE_2: "zone-2",
  ZONE_3: "zone-3"
});

export function createNyrZoneProgression({
  config = NYR_ZONE_PROGRESSION_CONFIG,
  onZoneTwoReached = () => {}
} = {}) {
  let currentZone = NYR_ZONES.ZONE_1;

  function sync(progressionSnapshot, portalContact = false) {
    const normalFragmentsAbsorbed = progressionSnapshot?.normalFragmentsAbsorbed;
    const reachedNow = portalContact && currentZone === NYR_ZONES.ZONE_1 &&
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

  function enterZoneThree() {
    if (currentZone === NYR_ZONES.ZONE_2) currentZone = NYR_ZONES.ZONE_3;
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ currentZone });
  }

  return Object.freeze({ sync, enterZoneThree, snapshot });
}
