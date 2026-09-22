import { calculateCoverRect } from "./zoneOneBackground.js";
import { NYR_ZONES } from "../gameplay/nyrZoneProgression.js";

export const ZONE_TWO_BACKGROUND_SOURCE =
  "./assets/images/zones/NYR_ZONE_02_NEBULEUSE_V1.png";

export const ZONE_BACKGROUND_TRANSITION_CONFIG = Object.freeze({
  // Durée visuelle provisoire du PACK 19, en temps de simulation active.
  durationSeconds: 1
});

export function createZoneBackgroundTransition({
  zoneOneBackground,
  createImage = () => new Image(),
  zoneTwoSource = ZONE_TWO_BACKGROUND_SOURCE,
  config = ZONE_BACKGROUND_TRANSITION_CONFIG,
  onTransitionStarted = () => {}
} = {}) {
  const zoneTwoImage = createImage();
  let zoneTwoStatus = "loading";
  let targetZone = NYR_ZONES.ZONE_1;
  let activeTransitionSeconds = 0;

  zoneTwoImage.addEventListener("load", () => {
    zoneTwoStatus = zoneTwoImage.naturalWidth > 0 && zoneTwoImage.naturalHeight > 0
      ? "ready"
      : "failed";
  });
  zoneTwoImage.addEventListener("error", () => {
    zoneTwoStatus = "failed";
  });
  zoneTwoImage.decoding = "async";
  zoneTwoImage.src = zoneTwoSource;

  function sync(zoneSnapshot) {
    if (zoneSnapshot?.currentZone !== NYR_ZONES.ZONE_2 || targetZone === NYR_ZONES.ZONE_2) {
      return snapshot();
    }

    targetZone = NYR_ZONES.ZONE_2;
    onTransitionStarted(snapshot());
    return snapshot();
  }

  function update(deltaSeconds) {
    if (targetZone !== NYR_ZONES.ZONE_2 || zoneTwoStatus !== "ready") return snapshot();

    const duration = Math.max(Number.EPSILON, config.durationSeconds);
    const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const nextTime = Math.min(duration, activeTransitionSeconds + safeDelta);
    activeTransitionSeconds = nextTime >= duration - Number.EPSILON * 16
      ? duration
      : nextTime;
    return snapshot();
  }

  function render(context, width, height) {
    const zoneOneResult = zoneOneBackground.render(context, width, height);
    const state = snapshot();

    if (targetZone !== NYR_ZONES.ZONE_2 || zoneTwoStatus !== "ready") {
      return Object.freeze({
        mode: targetZone === NYR_ZONES.ZONE_2 ? "zone-one-fallback" : "zone-one",
        zoneOneResult,
        ...state
      });
    }

    const rect = calculateCoverRect(
      zoneTwoImage.naturalWidth,
      zoneTwoImage.naturalHeight,
      width,
      height
    );
    context.save();
    context.globalAlpha = state.progress;
    context.drawImage(zoneTwoImage, rect.x, rect.y, rect.width, rect.height);
    context.restore();

    return Object.freeze({
      mode: state.progress < 1 ? "crossfade" : "zone-two",
      zoneOneResult,
      rect,
      ...state
    });
  }

  function snapshot() {
    const duration = Math.max(Number.EPSILON, config.durationSeconds);
    const progress = targetZone === NYR_ZONES.ZONE_2 && zoneTwoStatus === "ready"
      ? Math.min(1, activeTransitionSeconds / duration)
      : 0;

    return Object.freeze({
      targetZone,
      zoneTwoStatus,
      activeTransitionSeconds,
      progress
    });
  }

  return Object.freeze({ sync, update, render, snapshot });
}
