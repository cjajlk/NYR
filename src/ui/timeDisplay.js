export function formatTime(seconds) {
  const total = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) + 1e-9);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const rest = String(total % 60).padStart(2, "0");
  return `TEMPS ${hours ? hours + ":" : ""}${String(minutes).padStart(2, "0")}:${rest}`;
}
export function createTimeDisplay() {
  const element = document.createElement("output");
  element.className = "time-display";
  element.setAttribute("aria-label", "Temps de partie");
  function update(seconds, runtime) {
    element.textContent = formatTime(seconds);
    element.hidden = runtime.phase === "MENU" || runtime.suspensionReasons.includes("portrait-orientation");
  }
  return Object.freeze({ element, update });
}
