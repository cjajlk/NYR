export function createReturnMenu(onMenu) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "return-menu";
  element.textContent = "MENU";
  element.hidden = true;
  let available = false;
  element.addEventListener("click", () => {
    if (!available) return;
    available = false;
    element.disabled = true;
    onMenu();
  });
  function update(state) {
    available = state.phase !== "MENU" && state.suspensionReasons.length === 0;
    element.hidden = !available;
    element.disabled = !available;
  }
  return Object.freeze({ element, update });
}
