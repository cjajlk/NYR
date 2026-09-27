import { createChallengesPanel } from "./challengesDisplay.js";
import { createShopPanel } from "./shopDisplay.js";
import { createStatisticsPanel } from "./statisticsDisplay.js";
export function createMainMenu(onPlay, readTotals = () => ({}), weekly = null, cosmetics = null) {
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
  const statistics = command("STATISTIQUES", () => { panel.refresh(); navigate("statistics"); });
  const panel = createStatisticsPanel(readTotals);
  const challenges = command("DÉFIS", () => navigate("challenges"));
  const challengePanel = weekly ? createChallengesPanel(weekly, () => available && page === "challenges") : null;
  const shop = command("BOUTIQUE", () => navigate("shop"));
  play.className += " menu-play";
  shop.className += " menu-shop";
  challenges.className += " menu-challenges";
  statistics.className += " menu-statistics";
  options.className += " menu-options";
  information.className += " menu-about";
  const shopPanel = cosmetics ? createShopPanel(cosmetics, () => weekly?.snapshot().balance ?? 0, () => available && page === "shop") : null;
  const back = command("RETOUR", () => navigate("home"));
  back.className += " menu-back";
  element.append(title, play, options, information, about, back, statistics, panel.element);
  if (challengePanel) element.append(challenges, challengePanel.element);
  if (shopPanel) element.append(shop, shopPanel.element);
  function navigate(next) {
    page = next;
    refresh();
  }
  function refresh() {
    element.setAttribute("data-page", page);
    title.textContent = page === "home" ? "NYR" : page === "options" ? "OPTIONS" : page === "statistics" ? "STATISTIQUES" : page === "challenges" ? "DÉFIS" : page === "shop" ? "BOUTIQUE" : "À PROPOS";
    for (const button of [play, options, information, statistics, challenges, shop]) button.hidden = page !== "home";
    if (shopPanel) {
      shopPanel.element.hidden = page !== "shop";
      if (page === "shop") shopPanel.refresh();
    }
    if (challengePanel) {
      challengePanel.element.hidden = page !== "challenges";
      if (page === "challenges") challengePanel.refresh();
    }
    panel.element.hidden = page !== "statistics";
    about.hidden = page !== "about";
    back.hidden = page === "home";
    for (const button of [play, options, information, back, statistics, challenges, shop]) button.disabled = !available;
  }
  function update(menu, portrait) {
    available = menu && !portrait;
    element.hidden = !available;
    refresh();
  }
  refresh();
  return Object.freeze({ element, update });
}
