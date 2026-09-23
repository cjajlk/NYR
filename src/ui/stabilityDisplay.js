export function createStabilityDisplay(createElement = tag => document.createElement(tag), onReplay = () => {}) {
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
  const replay = createElement("button");
  replay.type = "button";
  replay.className = "replay-button";
  replay.textContent = "REJOUER";
  replay.hidden = true;
  let canReplay = false;
  replay.addEventListener("click", () => {
    if (!canReplay) return;
    canReplay = false;
    replay.disabled = true;
    onReplay();
  });
  gameOverElement.append(title, detail, replay);
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
    canReplay = runtimeState.gameOver && !portrait;
    replay.hidden = !canReplay;
    replay.disabled = !canReplay;
  }

  return Object.freeze({ element, gameOverElement, update });
}
