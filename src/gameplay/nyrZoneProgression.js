export const NYR_ZONE_PROGRESSION_CONFIG = Object.freeze({
  zoneTwoThresholdFragments: 25
});

export const NYR_ZONES = Object.freeze({
  ZONE_1: "zone-1",
  ZONE_2: "zone-2",
  ZONE_3: "zone-3",
  ZONE_4: "zone-4"
});

export function createNyrZoneProgression({
  config = NYR_ZONE_PROGRESSION_CONFIG,
  onZoneTwoReached = () => {}
} = {}) {
  let currentZone = NYR_ZONES.ZONE_1;
  let zoneOneEntryCount = 0;

  function sync(progressionSnapshot, portalContact = false) {
    const normalFragmentsAbsorbed = progressionSnapshot?.normalFragmentsAbsorbed;
    const reachedNow = portalContact && currentZone === NYR_ZONES.ZONE_1 &&
      Number.isFinite(normalFragmentsAbsorbed) &&
      normalFragmentsAbsorbed - zoneOneEntryCount >= config.zoneTwoThresholdFragments;

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

  function enterZoneFour() {
    if (currentZone === NYR_ZONES.ZONE_3) currentZone = NYR_ZONES.ZONE_4;
    return snapshot();
  }

  function enterZoneOne(globalCount) {
    if (currentZone === NYR_ZONES.ZONE_4) {
      currentZone = NYR_ZONES.ZONE_1;
      zoneOneEntryCount = globalCount;
    }
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ currentZone });
  }

  return Object.freeze({ sync, enterZoneOne, enterZoneThree, enterZoneFour, snapshot });
}
