export function createStabilityDisplay(createElement = tag => document.createElement(tag)) {
  const element = createElement("div");
  element.className = "stability-display";
  const label = createElement("span");
  const gauge = createElement("meter");
  gauge.min = 0;
  gauge.max = 100;
  gauge.setAttribute("aria-label", "Stabilité");
  element.append(label, gauge);

  const gameOverElement = createElement("div");
  gameOverElement.className = "game-over-indication";
  gameOverElement.setAttribute("role", "status");
  const title = createElement("strong");
  title.textContent = "GAME OVER";
  const detail = createElement("span");
  detail.textContent = "STABILITÉ ÉPUISÉE";
  gameOverElement.append(title, detail);
  gameOverElement.hidden = true;
  let previousValue;

  function update(stabilityState, runtimeState) {
    const value = stabilityState.stability;
    if (value !== previousValue) {
      label.textContent = `STABILITÉ ${value}/100`;
      gauge.value = value;
      previousValue = value;
    }
    const portrait = runtimeState.suspensionReasons.includes("portrait-orientation");
    element.hidden = portrait;
    gameOverElement.hidden = portrait || !runtimeState.gameOver;
  }

  return Object.freeze({ element, gameOverElement, update });
}
