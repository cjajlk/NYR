import { formatRunSummary } from "./statisticsDisplay.js";
export function createStabilityDisplay(createElement = tag => document.createElement(tag), onReplay = () => {}, onMenu = () => {}) {
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
  const menu = createElement("button");
  menu.type = "button";
  menu.className = "replay-button";
  menu.textContent = "MENU";
  menu.hidden = true;
  let canMenu = false;
  menu.addEventListener("click", () => {
    if (!canMenu) return;
    canMenu = false;
    menu.disabled = true;
    onMenu();
  });
  const summary = createElement("p");
  summary.className = "run-summary";
  summary.hidden = true;
  gameOverElement.append(title, detail, replay, menu, summary);
  gameOverElement.hidden = true;
  let previousValue;

  function update(stabilityState, runtimeState, run = null) {
    const value = stabilityState.stability;
    if (value !== previousValue) {
      label.textContent = `STABILITÉ ${value}/100`;
      gauge.value = value;
      previousValue = value;
    }
    summary.hidden = !runtimeState.gameOver || !run;
    if (!summary.hidden) summary.textContent = formatRunSummary(run);
    const portrait = runtimeState.suspensionReasons.includes("portrait-orientation");
    element.hidden = portrait;
    const finished = runtimeState.gameOver || runtimeState.journeyComplete;
    title.textContent = runtimeState.journeyComplete ? "ZONE 2 TERMINÉE" : "GAME OVER";
    detail.hidden = Boolean(runtimeState.journeyComplete);
    gameOverElement.hidden = portrait || !finished;
    canMenu = Boolean(runtimeState.journeyComplete) && !portrait;
    menu.hidden = !canMenu;
    menu.disabled = !canMenu;
    canReplay = finished && !portrait;
    replay.hidden = !canReplay;
    replay.disabled = !canReplay;
  }

  return Object.freeze({ element, gameOverElement, update });
}
