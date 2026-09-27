import { SKINS } from "../gameplay/cosmetics.js";
import { skinAssetPath } from "../gameplay/skinSprites.js";

export function createShopPanel(cosmetics, readBalance, canInteract) {
  const element = document.createElement("section");
  element.className = "shop-panel";
  const balance = document.createElement("p");
  balance.className = "shards-balance";
  const list = document.createElement("div");
  list.className = "shop-list";
  const message = document.createElement("p");
  message.className = "shop-message";
  message.setAttribute("role", "status");
  const cards = SKINS.map(skin => {
    const card = document.createElement("article");
    card.className = "shop-card";
    const name = document.createElement("strong"); name.textContent = skin.name;
    const detail = document.createElement("p");
    detail.textContent = skin.id === "classic" ? "Apparence originale · Possédé" : `${skin.price} Éclats`;
    const preview = document.createElement("div"); preview.className = "skin-preview";
    if (skin.id === "test") {
      for (const form of ["eclat", "spectre"]) {
        const image = document.createElement("img");
        image.src = skinAssetPath(form, "tete"); image.alt = form === "eclat" ? "Éclat" : "Spectre";
        preview.append(image);
      }
    } else {
      preview.textContent = "NYR";
    }
    const note = document.createElement("p");
    note.textContent = skin.id === "test" ? "Un skin complet : Éclat, Spectre, Nocturne, Dévoreur." : "Les quatre formes actuelles de Nyr.";
    const button = document.createElement("button"); button.type = "button"; button.className = "replay-button";
    button.addEventListener("click", () => {
      if (!canInteract() || button.disabled) return;
      const state = cosmetics.snapshot();
      const success = state.owned.includes(skin.id) ? cosmetics.equip(skin.id) : cosmetics.purchase(skin.id);
      message.textContent = success ? "" : "Achat ou enregistrement indisponible. Vérifiez le solde et réessayez.";
      refresh();
    });
    card.append(name, preview, detail, note, button); list.append(card);
    return { skin, button, detail };
  });
  function refresh() {
    const amount = readBalance();
    balance.textContent = `✦ ${amount} Éclats`;
    const state = cosmetics.snapshot();
    for (const { skin, button, detail } of cards) {
      const equipped = state.equipped.skin === skin.id;
      const owned = state.owned.includes(skin.id);
      const missing = Math.max(0, skin.price - amount);
      detail.textContent = owned ? "Possédé" : `${skin.price} Éclats${missing ? ` · Il manque ${missing} Éclats` : ""}`;
      button.textContent = equipped ? "ÉQUIPÉ" : owned ? "ÉQUIPER" : `ACHETER — ${skin.price} ÉCLATS`;
      button.disabled = equipped || !canInteract() || (!owned && missing > 0);
    }
  }
  element.append(balance, list, message);
  refresh();
  return Object.freeze({ element, refresh });
}
