const suspensionReasons = new Set();
const listeners = new Set();
let gameOver = false;
let journeyComplete = false;

function notifyRuntimeState() {
  const state = getRuntimeState();
  listeners.forEach((listener) => listener(state));
}

export function isRuntimeActive() {
  return !gameOver && !journeyComplete && suspensionReasons.size === 0;
}

export function endGame() {
  if (gameOver || journeyComplete) return;
  gameOver = true;
  notifyRuntimeState();
}

export function completeJourney() {
  if (!isRuntimeActive()) return;
  journeyComplete = true;
  notifyRuntimeState();
}

export function beginNewGame() {
  if (!gameOver && !journeyComplete) return false;
  gameOver = false;
  journeyComplete = false;
  notifyRuntimeState();
  return true;
}

export function getRuntimeState() {
  return Object.freeze({
    active: isRuntimeActive(),
    gameOver,
    journeyComplete,
    phase: journeyComplete ? "JOURNEY_COMPLETE" : gameOver ? "GAME_OVER" : suspensionReasons.has("main-menu") ? "MENU" : "PLAYING",
    suspensionReasons: Object.freeze([...suspensionReasons])
  });
}

export function suspendRuntime(reason) {
  if (!reason || suspensionReasons.has(reason)) return;
  suspensionReasons.add(reason);
  notifyRuntimeState();
}

export function resumeRuntime(reason) {
  if (!suspensionReasons.delete(reason)) return;
  notifyRuntimeState();
}

export function onRuntimeStateChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
