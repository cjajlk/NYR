export const NYR_STABILITY_CONFIG = Object.freeze({
  initial: 100,
  maximum: 100,
  asteroidContactDamage: 25
});

export function createNyrStability(config = NYR_STABILITY_CONFIG) {
  let stability = Math.min(config.maximum, Math.max(0, config.initial));

  function applyAsteroidContact() {
    stability = Math.max(0, stability -
      (config.asteroidContactDamage ?? NYR_STABILITY_CONFIG.asteroidContactDamage));
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ stability });
  }

  return Object.freeze({ snapshot, applyAsteroidContact });
}
