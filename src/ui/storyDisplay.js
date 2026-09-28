import { STORY_CHAPTERS, STORY_OBJECTIVES } from "../gameplay/storyProgression.js";
const NARRATION = [
  "Au cœur d'un espace presque éteint, quelque chose s'éveille.\nUne présence minuscule. Un éclat vivant.\nIl ne connaît ni son origine, ni sa destination.\nMais les fragments dispersés dans le vide l'appellent.",
  "Nyr grandit.\nChaque fragment absorbé semble réveiller quelque chose en lui.\nEt le portail devant lui paraît déjà le connaître.",
  "La Nébuleuse porte une autre énergie.\nUne corruption s'est répandue parmi les fragments.\nPour survivre, Nyr change.\nMais cette transformation ressemble moins à une évolution qu'à un souvenir.",
  "Les souvenirs reviennent par fragments.\nNyr comprend enfin : il n'est pas étranger à cet univers brisé.\nLes fragments faisaient autrefois partie d'une même énergie.\nEt lui aussi.",
  "Au cœur du Vide, Nyr retrouve ce qu'il cherchait depuis son éveil.\nIl croyait chercher des fragments.\nIl récupérait les morceaux de lui-même."
];
export function createStoryDisplay(onContinue) {
  const element = document.createElement("section"); element.className = "story-overlay";
  const card = document.createElement("div"); card.className = "story-card";
  const title = document.createElement("h2");
  const text = document.createElement("p"); text.className = "story-text";
  const objectives = document.createElement("p"); objectives.className = "story-objectives";
  const status = document.createElement("p"); status.setAttribute("role", "status");
  const button = document.createElement("button"); button.type = "button"; button.className = "replay-button";
  let available = false;
  button.addEventListener("click", () => { if (available) onContinue(); });
  card.append(title, text, objectives, status, button); element.append(card);
  function update(stage, portrait, saved, failed = false) {
    available = stage !== null && !portrait;
    element.hidden = !available; button.disabled = !available;
    if (stage === null) return;
    title.textContent = stage === 4 ? "HISTOIRE TERMINÉE" : STORY_CHAPTERS[stage];
    text.textContent = NARRATION[stage];
    objectives.hidden = stage === 4;
    objectives.textContent = "Objectifs facultatifs · 25 Éclats chacun, une seule fois\n" + STORY_OBJECTIVES.map(o =>
      `${saved.rewarded[`${stage + 1}:${o.id}`] ? "✓ Déjà récompensé · " : ""}${o.label}`).join("\n");
    status.textContent = failed ? "Sauvegarde indisponible. Réessayez pour conserver votre progression." : stage === 4 ? "VOYAGE INFINI DÉBLOQUÉ" : "";
    button.textContent = failed ? "RÉESSAYER" : stage === 4 ? "RETOUR AUX MODES" : "CONTINUER";
  }
  update(null, false, { rewarded: {} });
  return Object.freeze({ element, update });
}
