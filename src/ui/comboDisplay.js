export function createComboDisplay() {
  const element = document.createElement("output");
  element.className = "combo-display";
  element.hidden = true;
  function update(combo, runtime) {
    element.hidden = runtime.phase !== "PLAYING" || !runtime.active || combo.multiplier < 2;
    element.textContent = "COMBO x" + combo.multiplier;
  }
  return Object.freeze({ element, update });
}
