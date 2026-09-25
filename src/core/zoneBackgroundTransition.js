import { calculateCoverRect, ZONE_ONE_BACKGROUND_SOURCE } from "./zoneOneBackground.js";
import { NYR_ZONES } from "../gameplay/nyrZoneProgression.js";
export const ZONE_TWO_BACKGROUND_SOURCE = "./assets/images/zones/NYR_ZONE_02_NEBULEUSE_V1.png";
export const ZONE_THREE_BACKGROUND_SOURCE = "./assets/images/zones/NYR_ZONE_03_FAILLE_ASTRALE_V1.png";
export const ZONE_FOUR_BACKGROUND_SOURCE = "./assets/images/zones/NYR_ZONE_04_LE_VIDE_V1.png";
export const ZONE_BACKGROUND_TRANSITION_CONFIG = Object.freeze({ durationSeconds: 1 });
export function createZoneBackgroundTransition({
  zoneOneBackground, createImage = () => new Image(),
  zoneTwoSource = ZONE_TWO_BACKGROUND_SOURCE,
  zoneThreeSource = ZONE_THREE_BACKGROUND_SOURCE,
  zoneFourSource = ZONE_FOUR_BACKGROUND_SOURCE,
  config = ZONE_BACKGROUND_TRANSITION_CONFIG, onTransitionStarted = () => {}
} = {}) {
  function preload(source) {
    const image = createImage();
    const layer = { image, status: "loading" };
    image.addEventListener("load", () => {
      layer.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "failed";
    });
    image.addEventListener("error", () => { layer.status = "failed"; });
    image.decoding = "async"; image.src = source;
    return layer;
  }
  const two = preload(zoneTwoSource), three = preload(zoneThreeSource), four = preload(zoneFourSource);
  const one = preload(ZONE_ONE_BACKGROUND_SOURCE);
  const layers = { "zone-1": one, "zone-2": two, "zone-3": three, "zone-4": four };
  const names = { "zone-1": "zone-one", "zone-2": "zone-two", "zone-3": "zone-three", "zone-4": "zone-four" };
  let targetZone = NYR_ZONES.ZONE_1;
  let activeTransitionSeconds = 0;
  let transitioning = false;
  let previous = [];
  function progress() {
    return transitioning && layers[targetZone].status === "ready"
      ? Math.min(1, activeTransitionSeconds / Math.max(Number.EPSILON, config.durationSeconds)) : 0;
  }
  function visibleLayers() {
    const alpha = progress();
    if (alpha === 1) return [{ zone: targetZone, alpha: 1 }];
    return [...previous.map(item => ({ ...item, alpha: item.alpha * (1 - alpha) })),
      ...(alpha > 0 ? [{ zone: targetZone, alpha }] : [])];
  }
  function sync(zoneSnapshot) {
    const next = zoneSnapshot?.currentZone;
    if (!layers[next] || next === targetZone) return snapshot();
    /* Collapse repeated layers to keep memory bounded across unlimited cycles. */
    const weights = new Map();
    for (const item of visibleLayers()) weights.set(item.zone, (weights.get(item.zone) ?? 0) + item.alpha);
    previous = [...weights].map(([zone, alpha]) => ({ zone, alpha }));
    targetZone = next;
    transitioning = true;
    activeTransitionSeconds = 0;
    onTransitionStarted(snapshot());
    return snapshot();
  }
  function update(deltaSeconds) {
    if (!transitioning || layers[targetZone].status !== "ready") return snapshot();
    const duration = Math.max(Number.EPSILON, config.durationSeconds);
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const next = Math.min(duration, activeTransitionSeconds + delta);
    activeTransitionSeconds = next >= duration - Number.EPSILON * 16 ? duration : next;
    return snapshot();
  }
  function draw(context, layer, width, height, alpha) {
    const rect = calculateCoverRect(layer.image.naturalWidth, layer.image.naturalHeight, width, height);
    context.save(); context.globalAlpha = alpha;
    context.drawImage(layer.image, rect.x, rect.y, rect.width, rect.height);
    context.restore();
    return rect;
  }
  function render(context, width, height) {
    const zoneOneResult = zoneOneBackground.render(context, width, height);
    const state = snapshot();
    if (!transitioning) return Object.freeze({ mode: "zone-one", zoneOneResult, ...state });
    /* Draw the captured previous composition, then the new target over it. */
    let remaining = previous.reduce((sum, item) => sum + item.alpha, 0);
    for (const item of previous) {
      if (layers[item.zone].status === "ready") {
        const beneath = remaining - item.alpha;
        draw(context, layers[item.zone], width, height, item.alpha / Math.max(1e-12, 1 - beneath));
      }
      remaining -= item.alpha;
    }
    if (layers[targetZone].status !== "ready") {
      const last = previous.filter(item => layers[item.zone].status === "ready").at(-1);
      return Object.freeze({ mode: `${names[last?.zone ?? "zone-1"]}-fallback`, zoneOneResult, ...state });
    }
    const rect = draw(context, layers[targetZone], width, height, state.progress);
    return Object.freeze({ mode: state.progress < 1 ? "crossfade" : names[targetZone], zoneOneResult, rect, ...state });
  }
  function snapshot() {
    return Object.freeze({ targetZone, zoneTwoStatus: two.status, zoneThreeStatus: three.status, zoneFourStatus: four.status,
      activeTransitionSeconds, progress: progress() });
  }
  return Object.freeze({ sync, update, render, snapshot });
}
