export const NYR_PROGRESSION_CONFIG = Object.freeze({
  // Seuils des formes visuelles sur le compteur normal global.
  spectreThresholdFragments: 50,
  nocturneThresholdFragments: 150,
  devoreurThresholdFragments: 300
});

export const NYR_FORMS = Object.freeze({
  ECLAT: "eclat",
  SPECTRE: "spectre",
  NOCTURNE: "nocturne",
  DEVOREUR: "devoreur"
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
      currentForm: state.normalFragmentsAbsorbed >= (config.devoreurThresholdFragments ?? NYR_PROGRESSION_CONFIG.devoreurThresholdFragments)
        ? NYR_FORMS.DEVOREUR
        : state.normalFragmentsAbsorbed >= (config.nocturneThresholdFragments ?? NYR_PROGRESSION_CONFIG.nocturneThresholdFragments)
        ? NYR_FORMS.NOCTURNE
        : state.spectreThresholdReached ? NYR_FORMS.SPECTRE : NYR_FORMS.ECLAT
    });
  }

  return Object.freeze({ recordNormalFragmentAbsorption, snapshot });
}
