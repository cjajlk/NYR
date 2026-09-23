export function createFullscreenControl(onDisplayChange, ownerDocument = document) {
  const element = ownerDocument.createElement("button");
  element.type = "button";
  element.className = "fullscreen-control";
  let pending = false;
  let refused = false;

  function refresh() {
    const available = ownerDocument.fullscreenEnabled === true &&
      typeof ownerDocument.documentElement?.requestFullscreen === "function";
    element.hidden = !available;
    element.disabled = !available || pending;
    element.textContent = ownerDocument.fullscreenElement
      ? "QUITTER PLEIN ÉCRAN"
      : refused ? "RÉESSAYER PLEIN ÉCRAN" : "PLEIN ÉCRAN";
    element.title = refused ? "Le navigateur a refusé le plein écran. Vous pouvez réessayer." : "";
  }

  element.addEventListener("click", async () => {
    if (pending || ownerDocument.fullscreenEnabled !== true ||
        typeof ownerDocument.documentElement?.requestFullscreen !== "function") {
      refresh();
      return;
    }
    pending = true;
    refused = false;
    refresh();
    try {
      if (ownerDocument.fullscreenElement) {
        await ownerDocument.exitFullscreen();
      } else {
        // Call directly in the click handler, before any asynchronous work.
        await ownerDocument.documentElement.requestFullscreen();
      }
    } catch {
      refused = true;
    } finally {
      pending = false;
      refresh();
    }
  });

  function onFullscreenChange() {
    refused = false;
    refresh();
    onDisplayChange();
  }
  ownerDocument.addEventListener("fullscreenchange", onFullscreenChange);
  refresh();
  return Object.freeze({ element, destroy() {
    ownerDocument.removeEventListener("fullscreenchange", onFullscreenChange);
  } });
}
