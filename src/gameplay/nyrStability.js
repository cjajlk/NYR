export const NYR_STABILITY_CONFIG = Object.freeze({
  initial: 100,
  maximum: 100,
  asteroidContactDamage: 25,
  pureFragmentRecovery: 20,
  corruptionDamage: 20
});

export function createNyrStability(config = NYR_STABILITY_CONFIG, onDamage = () => {}) {
  let stability = Math.min(config.maximum, Math.max(0, config.initial));

  function applyAsteroidContact() {
    const before = stability;
    stability = Math.max(0, stability -
      (config.asteroidContactDamage ?? NYR_STABILITY_CONFIG.asteroidContactDamage));
    if (stability < before) onDamage(before, stability);
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ stability });
  }

  function applyPureFragment() {
    if (stability > 0) {
      stability = Math.min(100, config.maximum,
        stability + NYR_STABILITY_CONFIG.pureFragmentRecovery);
    }
    return snapshot();
  }

  function applyCorruptionContact() {
    const before = stability;
    stability = Math.max(0, stability - NYR_STABILITY_CONFIG.corruptionDamage);
    if (stability < before) onDamage(before, stability);
    return snapshot();
  }

  return Object.freeze({ snapshot, applyAsteroidContact, applyPureFragment, applyCorruptionContact });
}
