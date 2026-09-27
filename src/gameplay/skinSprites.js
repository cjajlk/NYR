export const SKIN_PARTS = Object.freeze(["tete", "ecaille_01", "ecaille_02", "ecaille_03", "queue"]);
export const SKIN_FORMS = Object.freeze(["eclat", "spectre"]);
export const skinAssetPath = (form, part) => `./assets/images/nyr/nyr_${form}_${part}.png`;

// These offsets affect drawing only. Trail poses and collision dimensions stay untouched.
const visuals = Object.freeze({
  tete: { width: 48, anchorX: 0.72, anchorY: 0.6, angle: -0.25 },
  ecaille: { width: 26, anchorX: 0.5, anchorY: 0.5, angle: -0.48 },
  queue: { width: 31, anchorX: 0.8, anchorY: 0.6, angle: -0.2 }
});
export function createSkinSprites(readEquipped, createImage = () => new Image()) {
  const forms = new Map();
  function load(form) {
    if (!forms.has(form)) {
      const images = SKIN_PARTS.map(part => {
        const image = createImage();
        image.src = skinAssetPath(form, part);
        return image;
      });
      forms.set(form, images);
    }
    return forms.get(form);
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
    if (readEquipped() !== "test" || !SKIN_FORMS.includes(form)) return false;
    const images = load(form);
    // Keep the entire classic form while loading or if an asset cannot be decoded.
    if (!images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) return false;
    for (let index = poses.length - 1; index >= 0; index--) {
      const tail = index === poses.length - 1;
      draw(context, images[tail ? 4 : 1 + index % 3],
        { ...poses[index], angle: poses[index].angle + Math.PI }, tail ? visuals.queue : visuals.ecaille);
    }
    draw(context, images[0], { x: state.x, y: state.y, angle: state.heading }, visuals.tete);
    return true;
  };
}
