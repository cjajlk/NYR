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

  return Object.freeze({ awardNormalFragment, snapshot });
}
