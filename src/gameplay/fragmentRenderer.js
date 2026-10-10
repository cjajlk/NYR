import { FRAGMENT_PROTOTYPE_CONFIG } from "./fragmentPrototypeConfig.js";

// PACK assets 61: cosmetic sprites only. Keep the canvas fallback for loading failures.
const fragmentSpriteSources = {
  normal: new URL("../../assets/images/collectibles/pack61/asset_07.png", import.meta.url).href,
  pure: new URL("../../assets/images/collectibles/pack61/asset_03.png", import.meta.url).href,
  corruption: new URL("../../assets/images/collectibles/pack61/asset_04.png", import.meta.url).href
};
const fragmentSprites = Object.fromEntries(Object.entries(fragmentSpriteSources).map(([kind, src]) => {
  const image = typeof Image !== "undefined" ? new Image() : null;
  if (image) image.src = src;
  return [kind, image];
}));

export function renderNormalFragments(context, fragments, config = FRAGMENT_PROTOTYPE_CONFIG) {
  for (const fragment of fragments) {
    const pure = fragment.kind === "pure";
    const corrupted = fragment.kind === "corruption";
    const sprite = fragmentSprites[corrupted ? "corruption" : pure ? "pure" : "normal"];
    if (sprite?.complete && sprite.naturalWidth > 0 && typeof context.drawImage === "function") {
      const diameter = config.visualRadiusPixels * (corrupted ? 4.2 : pure ? 4.4 : 3.8);
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      const width = diameter * Math.min(1, aspect);
      const height = diameter / Math.max(1, aspect);
      context.drawImage(sprite, fragment.x - width / 2, fragment.y - height / 2, width, height);
      continue;
    }
    const gradient = context.createRadialGradient(
      fragment.x,
      fragment.y,
      0,
      fragment.x,
      fragment.y,
      config.visualRadiusPixels * 2
    );
    gradient.addColorStop(0, "rgba(220, 252, 255, 1)");
    gradient.addColorStop(0.35, corrupted ? "rgba(255, 65, 150, 0.95)" : pure ? "rgba(145, 255, 190, 0.95)" : "rgba(93, 218, 255, 0.95)");
    gradient.addColorStop(1, "rgba(116, 65, 220, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(fragment.x, fragment.y, config.visualRadiusPixels * 2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = corrupted ? "#fb559b" : pure ? "#dcffe8" : "#bdf8ff";
    if (corrupted) {
      context.beginPath();
      for (let point = 0; point < 8; point++) {
        const angle = point * Math.PI / 4;
        const radius = config.visualRadiusPixels * (point % 2 ? 0.6 : 1.6);
        const x = fragment.x + Math.cos(angle) * radius;
        const y = fragment.y + Math.sin(angle) * radius;
        if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      continue;
    }
    if (pure) {
      context.save();
      context.strokeStyle = "#a0ffc4";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(fragment.x, fragment.y, config.visualRadiusPixels * 1.4, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    context.beginPath();
    context.moveTo(fragment.x, fragment.y - config.visualRadiusPixels);
    context.lineTo(fragment.x + config.visualRadiusPixels * 0.65, fragment.y);
    context.lineTo(fragment.x, fragment.y + config.visualRadiusPixels);
    context.lineTo(fragment.x - config.visualRadiusPixels * 0.65, fragment.y);
    context.closePath();
    context.fill();
  }
}
