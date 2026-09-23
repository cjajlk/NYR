export function createMainMenu(onPlay) {
  const element = document.createElement("div");
  element.className = "main-menu";
  const title = document.createElement("h1");
  const about = document.createElement("p");
  about.textContent = "NYR";
  let available = false;
  let page = "home";
  function command(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "replay-button";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (!available || button.hidden || button.disabled) return;
      action();
    });
    return button;
  }
  const play = command("JOUER", () => {
    available = false;
    refresh();
    onPlay();
  });
  const options = command("OPTIONS", () => navigate("options"));
  const information = command("À PROPOS", () => navigate("about"));
  const back = command("RETOUR", () => navigate("home"));
  element.append(title, play, options, information, about, back);
  function navigate(next) {
    page = next;
    refresh();
  }
  function refresh() {
    title.textContent = page === "home" ? "NYR" : page === "options" ? "OPTIONS" : "À PROPOS";
    for (const button of [play, options, information]) button.hidden = page !== "home";
    about.hidden = page !== "about";
    back.hidden = page === "home";
    for (const button of [play, options, information, back]) button.disabled = !available;
  }
  function update(menu, portrait) {
    available = menu && !portrait;
    element.hidden = !available;
    refresh();
  }
  refresh();
  return Object.freeze({ element, update });
}
