import { SKINS, SKIN_PARTS } from "./skinCatalog.js";
import { LEVIATHAN_VISUALS } from "./leviathanVisuals.js";
export { SKIN_PARTS, SKIN_FORMS, skinAssetPath } from "./skinCatalog.js";

// These offsets affect drawing only. Trail poses and collision dimensions stay untouched.
const visuals = Object.freeze({
  tete: { width: 48, anchorX: 0.72, anchorY: 0.6, angle: -0.25 },
  ecaille: { width: 26, anchorX: 0.5, anchorY: 0.5, angle: -0.48 },
  queue: { width: 31, anchorX: 0.8, anchorY: 0.6, angle: -0.2 }
});
// Spectre's artwork occupies less of its transparent canvas: enlarge only body scales.
const spectreScaleVisual = Object.freeze({ ...visuals.ecaille, width: 36 });
const lateForms = Object.freeze({
  nocturne: { tete: { width: 52, anchorX: 0.3, anchorY: 0.65, angle: -2.7 },
    ecaille: { ...visuals.ecaille, width: 36, angle: -2.65 },
    queue: { width: 36, anchorX: 0.15, anchorY: 0.75, angle: Math.PI + 0.55 } },
  devoreur: { tete: { width: 58, anchorX: 0.28, anchorY: 0.65, angle: -2.7 },
    ecaille: { ...visuals.ecaille, width: 40, angle: -2.65 },
    queue: { width: 40, anchorX: 0.15, anchorY: 0.75, angle: Math.PI + 0.7 } }
});
export function createSkinSprites(readEquipped, createImage = () => new Image()) {
  const forms = new Map();
  function load(skin, form) {
    const key = `${skin.id}:${form}`;
    if (!forms.has(key)) {
      const images = SKIN_PARTS.map(part => {
        const image = createImage();
        image.src = skin.forms[form][part];
        return image;
      });
      forms.set(key, images);
    }
    return forms.get(key);
  }
  function draw(context, image, pose, config) {
    const height = config.width * image.naturalHeight / image.naturalWidth;
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(pose.x, pose.y);
    context.rotate(pose.angle + config.angle);
    context.drawImage(image, -config.width * config.anchorX, -height * config.anchorY, config.width, height);
    context.restore();
  }
  return (context, state, poses, form) => {
    const skin = SKINS.find(item => item.id === readEquipped());
    if (!skin?.forms[form]) return false;
    const images = load(skin, form);
    // Keep the entire classic form while loading or if an asset cannot be decoded.
    if (!images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) return false;
    const bodyVisual = lateForms[form]?.ecaille ?? (form === "spectre" ? spectreScaleVisual : visuals.ecaille);
    const leviathan = skin.id === "leviathan_astral" ? LEVIATHAN_VISUALS[form] : null;
    for (let index = poses.length - 1; index >= 0; index--) {
      const tail = index === poses.length - 1;
      const partIndex = tail ? 4 : 1 + index % 3;
      draw(context, images[partIndex],
        { ...poses[index], angle: poses[index].angle + Math.PI },
        leviathan?.[SKIN_PARTS[partIndex]] ?? (tail ? (lateForms[form]?.queue ?? visuals.queue) : bodyVisual));
    }
    draw(context, images[0], { x: state.x, y: state.y, angle: state.heading }, leviathan?.tete ?? lateForms[form]?.tete ?? visuals.tete);
    return true;
  };
}
