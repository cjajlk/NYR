export function createPauseDisplay(onResume, onQuit) {
  const element = document.createElement("div");
  element.className = "pause-overlay";
  element.setAttribute("role", "dialog");
  element.setAttribute("aria-label", "Pause");
  element.setAttribute("aria-modal", "true");
  const title = document.createElement("strong");
  title.textContent = "PAUSE";
  let available = false;
  function button(label, action) {
    const control = document.createElement("button");
    control.type = "button";
    control.className = "replay-button";
    control.textContent = label;
    control.addEventListener("click", () => {
      if (!available) return;
      available = false;
      action();
    });
    return control;
  }
  const resume = button("REPRENDRE", onResume);
  const quit = button("QUITTER LA PARTIE", onQuit);
  element.append(title, resume, quit);
  function update(state) {
    available = !state.gameOver && state.suspensionReasons.includes("user-pause") &&
      state.suspensionReasons.every(reason => reason === "user-pause");
    element.hidden = !available;
    resume.disabled = quit.disabled = !available;
  }
  element.hidden = true;
  return Object.freeze({ element, update });
}
