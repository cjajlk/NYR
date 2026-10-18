export function createImpulseInput({ button, canAttack, attack, ownerDocument = document }) {
  let spaceHeld = false;
  function editable(target) {
    return target?.isContentEditable || Boolean(target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
  }
  function keydown(event) {
    if (event.code !== "Space" || editable(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target !== button && event.target?.closest?.("button, a, [role='button']")) return;
    if (!canAttack()) return;
    event.preventDefault();
    if (event.repeat || spaceHeld) return;
    spaceHeld = true;
    attack();
  }
  function keyup(event) {
    if (event.code !== "Space") return;
    if (spaceHeld) event.preventDefault();
    spaceHeld = false;
  }
  function pointerdown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (canAttack() && !button.disabled) attack();
  }
  function click(event) {
    event.preventDefault();
    event.stopPropagation();
    // Pointer activation happens on pointerdown; detail zero is assistive activation.
    if (event.detail === 0 && !spaceHeld && canAttack() && !button.disabled) attack();
  }
  function reset() { spaceHeld = false; }
  ownerDocument.addEventListener("keydown", keydown);
  ownerDocument.addEventListener("keyup", keyup);
  ownerDocument.addEventListener("visibilitychange", reset);
  button.addEventListener("pointerdown", pointerdown);
  button.addEventListener("click", click);
  return Object.freeze({ reset, destroy() {
    reset();
    ownerDocument.removeEventListener("keydown", keydown);
    ownerDocument.removeEventListener("keyup", keyup);
    ownerDocument.removeEventListener("visibilitychange", reset);
    button.removeEventListener("pointerdown", pointerdown);
    button.removeEventListener("click", click);
  } });
}
