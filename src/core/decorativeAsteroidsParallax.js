import { calculateCoverRect } from "./zoneOneBackground.js";

export const DECORATIVE_ASTEROIDS_PARALLAX_SOURCE =
  "./assets/images/parallax/NYR_PARALLAX_ASTEROIDS_DECOR_V1.png";

export const DECORATIVE_ASTEROIDS_PARALLAX_CONFIG = Object.freeze({
  // Réglages visuels provisoires PACK 15 — non canoniques et non finaux.
  opacity: 0.1,
  horizontalAmplitudePixels: 18,
  verticalAmplitudePixels: 10,
  cycleDurationSeconds: 26
});

export function createDecorativeAsteroidsParallax({
  createImage = () => new Image(),
  source = DECORATIVE_ASTEROIDS_PARALLAX_SOURCE,
  config = DECORATIVE_ASTEROIDS_PARALLAX_CONFIG
} = {}) {
  const image = createImage();
  let status = "loading";
  let activeTimeSeconds = 0;

  image.addEventListener("load", () => {
    status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "failed";
  });
  image.addEventListener("error", () => {
    status = "failed";
  });
  image.decoding = "async";
  image.src = source;

  function update(deltaSeconds) {
    const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    activeTimeSeconds = (activeTimeSeconds + safeDelta) % config.cycleDurationSeconds;
  }

  function snapshot() {
    const phase = activeTimeSeconds / config.cycleDurationSeconds * Math.PI * 2;
    return Object.freeze({
      status,
      source,
      activeTimeSeconds,
      offsetX: Math.sin(phase) * config.horizontalAmplitudePixels,
      offsetY: -Math.cos(phase) * config.verticalAmplitudePixels
    });
  }

  function render(context, width, height) {
    const state = snapshot();
    if (status !== "ready") return Object.freeze({ mode: "hidden", ...state });

    const rect = calculateCoverRect(
      image.naturalWidth,
      image.naturalHeight,
      width,
      height
    );
    context.save();
    context.globalAlpha = config.opacity;
    context.drawImage(
      image,
      rect.x + state.offsetX,
      rect.y + state.offsetY,
      rect.width,
      rect.height
    );
    context.restore();

    return Object.freeze({ mode: "image", ...state, rect });
  }

  return Object.freeze({ update, render, snapshot });
}
