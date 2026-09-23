export function createMainMenu(onPlay) {
  const element = document.createElement("div");
  element.className = "main-menu";
  const title = document.createElement("h1");
  title.textContent = "NYR";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "replay-button";
  button.textContent = "JOUER";
  let available = false;
  button.addEventListener("click", () => {
    if (!available) return;
    available = false;
    button.disabled = true;
    onPlay();
  });
  element.append(title, button);
  function update(menu, portrait) {
    available = menu && !portrait;
    element.hidden = !available;
    button.disabled = !available;
  }
  return Object.freeze({ element, update });
}
