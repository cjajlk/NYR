import { calculateCoverRect } from "./zoneOneBackground.js";
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
  let targetZone = NYR_ZONES.ZONE_1;
  let activeTransitionSeconds = 0;
  let previousTwoProgress = 0;
  let previousThreeProgress = 0;
  function targetLayer() { return targetZone === NYR_ZONES.ZONE_4 ? four : targetZone === NYR_ZONES.ZONE_3 ? three : two; }
  function sync(zoneSnapshot) {
    const next = zoneSnapshot?.currentZone;
    if (next === targetZone || ![NYR_ZONES.ZONE_2, NYR_ZONES.ZONE_3, NYR_ZONES.ZONE_4].includes(next) ||
        next < targetZone) return snapshot();
    if (next === NYR_ZONES.ZONE_3) previousTwoProgress = snapshot().progress;
    if (next === NYR_ZONES.ZONE_4) previousThreeProgress = snapshot().progress;
    targetZone = next;
    activeTransitionSeconds = 0;
    onTransitionStarted(snapshot());
    return snapshot();
  }
  function update(deltaSeconds) {
    if (targetZone === NYR_ZONES.ZONE_1 || targetLayer().status !== "ready") return snapshot();
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
    if (targetZone === NYR_ZONES.ZONE_1) return Object.freeze({ mode: "zone-one", zoneOneResult, ...state });
    const isFour = targetZone === NYR_ZONES.ZONE_4;
    const isThree = targetZone === NYR_ZONES.ZONE_3 || isFour;
    if (isThree && two.status === "ready") {
      draw(context, two, width, height, three.status === "ready" ? previousTwoProgress : 1);
    }
    if (isFour && three.status === "ready") {
      draw(context, three, width, height, four.status === "ready" ? previousThreeProgress : 1);
    }
    if (targetLayer().status !== "ready") {
      return Object.freeze({ mode: isFour && three.status === "ready" ? "zone-three-fallback" : isThree && two.status === "ready" ? "zone-two-fallback" : "zone-one-fallback",
        zoneOneResult, ...state });
    }
    const rect = draw(context, targetLayer(), width, height, state.progress);
    return Object.freeze({ mode: state.progress < 1 ? "crossfade" : isFour ? "zone-four" : isThree ? "zone-three" : "zone-two",
      zoneOneResult, rect, ...state });
  }
  function snapshot() {
    const duration = Math.max(Number.EPSILON, config.durationSeconds);
    return Object.freeze({ targetZone, zoneTwoStatus: two.status, zoneThreeStatus: three.status, zoneFourStatus: four.status,
      activeTransitionSeconds,
      progress: targetZone !== NYR_ZONES.ZONE_1 && targetLayer().status === "ready"
        ? Math.min(1, activeTransitionSeconds / duration) : 0 });
  }
  return Object.freeze({ sync, update, render, snapshot });
}
