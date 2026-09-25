export function createChallengesPanel(weekly, canInteract) {
  const element = document.createElement("section"); element.className = "challenges-panel";
  const balance = document.createElement("div"); balance.className = "shards-balance";
  const period = document.createElement("div"); period.className = "challenge-period";
  const list = document.createElement("div"); list.className = "challenges-list";
  const message = document.createElement("p"); message.className = "challenge-message"; message.setAttribute("role", "status");
  element.append(balance, period, list, message);
  const cards = [];
  let shownWeek = null, previous = "";
  for (const challenge of weekly.snapshot().challenges) {
    const card = document.createElement("article"); card.className = "challenge-card";
    const title = document.createElement("strong"), progress = document.createElement("span"), reward = document.createElement("span"), status = document.createElement("span"), button = document.createElement("button");
    title.textContent = challenge.title; reward.textContent = `+${challenge.reward} Éclats`;
    button.type = "button"; button.className = "replay-button"; button.textContent = "RÉCUPÉRER";
    button.addEventListener("click", () => {
      if (!canInteract() || button.hidden || button.disabled) return;
      const expectedWeek = shownWeek;
      button.disabled = true;
      const success = weekly.claim(challenge.id, expectedWeek);
      message.textContent = success ? "Récompense récupérée." : "Récupération indisponible. Vérifiez la semaine et le stockage local.";
      previous = ""; refresh();
    });
    card.append(title, progress, reward, status, button); list.append(card);
    cards.push({ progress, status, button });
  }
  function refresh() {
    const view = weekly.snapshot();
    const signature = JSON.stringify(view);
    if (signature === previous) return;
    previous = signature;
    if (shownWeek !== view.week.id) message.textContent = "";
    shownWeek = view.week.id;
    balance.textContent = `✦ ${view.balance} Éclats`;
    period.textContent = `Semaine du ${view.week.start} au ${view.week.end}`;
    view.challenges.forEach((c, i) => {
      cards[i].progress.textContent = c.unit === "min" ? `${Math.floor(c.progress / 60)} / ${c.target / 60} min` : `${Math.floor(c.progress)} / ${c.target} ${c.unit}`;
      cards[i].status.textContent = c.claimed ? "RÉCUPÉRÉ" : c.completed ? "TERMINÉ — À RÉCUPÉRER" : "EN COURS";
      cards[i].button.hidden = !c.completed || c.claimed;
      cards[i].button.disabled = !c.completed || c.claimed;
    });
  }
  refresh();
  return Object.freeze({ element, refresh });
}
