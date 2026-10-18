export const NYR_SCORE_CONFIG = Object.freeze({
  normalFragmentPoints: 100
});

export function createNyrScore(config = NYR_SCORE_CONFIG) {
  let points = 0;

  function awardNormalFragment(multiplier = 1) {
    points += config.normalFragmentPoints * multiplier;
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({ points });
  }

  function awardDodge() {
    points += 100;
    return snapshot();
  }
  function awardNeutralizedDanger() {
    points += 50;
    return snapshot();
  }

  function awardNeutralizedParasite() {
    points += 75;
    return snapshot();
  }

  return Object.freeze({ awardNormalFragment, awardDodge, awardNeutralizedDanger, awardNeutralizedParasite, snapshot });
}
