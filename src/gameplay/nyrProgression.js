export const NYR_PROGRESSION_CONFIG = Object.freeze({
  // Seuil canonique de la future Forme II — Le Spectre.
  spectreThresholdFragments: 20
});

export const NYR_FORMS = Object.freeze({
  ECLAT: "eclat",
  SPECTRE: "spectre"
});

export function createNyrProgression({
  config = NYR_PROGRESSION_CONFIG,
  onSpectreThresholdReached = () => {}
} = {}) {
  const state = {
    normalFragmentsAbsorbed: 0,
    spectreThresholdReached: false
  };

  function recordNormalFragmentAbsorption() {
    state.normalFragmentsAbsorbed += 1;

    const reachedNow = !state.spectreThresholdReached &&
      state.normalFragmentsAbsorbed >= config.spectreThresholdFragments;

    if (reachedNow) {
      state.spectreThresholdReached = true;
      onSpectreThresholdReached(Object.freeze({
        normalFragmentsAbsorbed: state.normalFragmentsAbsorbed,
        threshold: config.spectreThresholdFragments
      }));
    }

    return snapshot();
  }

  function snapshot() {
    return Object.freeze({
      ...state,
      currentForm: state.spectreThresholdReached ? NYR_FORMS.SPECTRE : NYR_FORMS.ECLAT
    });
  }

  return Object.freeze({ recordNormalFragmentAbsorption, snapshot });
}
