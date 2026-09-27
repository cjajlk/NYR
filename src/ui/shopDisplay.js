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
    detail.textContent = skin.id === "classic" ? "Apparence originale · Possédé" : "GRATUIT · 0 Éclat";
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
    note.textContent = skin.id === "test" ? "Un skin, plusieurs formes. Nocturne et Dévoreur : rendu classique provisoire." : "Les quatre formes actuelles de Nyr.";
    const button = document.createElement("button"); button.type = "button"; button.className = "replay-button";
    button.addEventListener("click", () => {
      if (!canInteract() || button.disabled) return;
      const state = cosmetics.snapshot();
      const success = state.owned.includes(skin.id) ? cosmetics.equip(skin.id) : cosmetics.unlock(skin.id);
      message.textContent = success ? "" : "Enregistrement local indisponible. Réessayez.";
      refresh();
    });
    card.append(name, preview, detail, note, button); list.append(card);
    return { skin, button };
  });
  function refresh() {
    balance.textContent = `✦ ${readBalance()} Éclats`;
    const state = cosmetics.snapshot();
    for (const { skin, button } of cards) {
      const equipped = state.equipped.skin === skin.id;
      button.textContent = equipped ? "ÉQUIPÉ" : state.owned.includes(skin.id) ? "ÉQUIPER" : "DÉBLOQUER";
      button.disabled = equipped || !canInteract();
    }
  }
  element.append(balance, list, message);
  refresh();
  return Object.freeze({ element, refresh });
}
