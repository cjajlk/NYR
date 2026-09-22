const SCORE_DIGITS = 6;

export function formatScore(scoreSnapshot) {
  const points = Number.isFinite(scoreSnapshot?.points)
    ? Math.max(0, Math.trunc(scoreSnapshot.points))
    : 0;

  return `SCORE ${String(points).padStart(SCORE_DIGITS, "0")}`;
}

export function createScoreDisplay(createElement = (tagName) => document.createElement(tagName)) {
  const element = createElement("output");
  element.className = "score-display";
  element.setAttribute("aria-label", "Score");

  function update(scoreSnapshot) {
    element.textContent = formatScore(scoreSnapshot);
  }

  return Object.freeze({ element, update });
}
