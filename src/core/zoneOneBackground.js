import { drawTechnicalMarker } from "./displayManager.js";

export const ZONE_ONE_BACKGROUND_SOURCE =
  "./assets/images/zones/NYR_ZONE_01_ESPACE_NOCTURNE_V1.png";

export function calculateCoverRect(imageWidth, imageHeight, surfaceWidth, surfaceHeight) {
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const scale = Math.max(surfaceWidth / safeImageWidth, surfaceHeight / safeImageHeight);
  const width = safeImageWidth * scale;
  const height = safeImageHeight * scale;

  return Object.freeze({
    x: (surfaceWidth - width) * 0.5,
    y: (surfaceHeight - height) * 0.5,
    width,
    height,
    scale
  });
}

export function createZoneOneBackground({
  createImage = () => new Image(),
  source = ZONE_ONE_BACKGROUND_SOURCE,
  fallback = drawTechnicalMarker
} = {}) {
  const image = createImage();
  let status = "loading";

  image.addEventListener("load", () => {
    status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "failed";
  });
  image.addEventListener("error", () => {
    status = "failed";
  });
  image.decoding = "async";
  image.src = source;

  function render(context, width, height) {
    if (status !== "ready") {
      fallback(context, width, height);
      return Object.freeze({ mode: "fallback", status });
    }

    const rect = calculateCoverRect(
      image.naturalWidth,
      image.naturalHeight,
      width,
      height
    );
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    return Object.freeze({ mode: "image", status, rect });
  }

  function snapshot() {
    return Object.freeze({ status, source });
  }

  return Object.freeze({ render, snapshot });
}
