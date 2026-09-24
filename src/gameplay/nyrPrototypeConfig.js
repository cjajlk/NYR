export const ZONE_THREE_SPEED_MULTIPLIER = 1.15;
// Plafond canonique du corps visible, indépendant de la progression.
export const MAX_VISIBLE_SEGMENTS = 120;

export const NYR_PROTOTYPE_CONFIG = Object.freeze({
  // Réglages provisoires du prototype PACK 3 — non canoniques et non finaux.
  speedPixelsPerSecond: 95,
  turnRadiansPerSecond: Math.PI * 0.9,
  initialSegmentCount: 4,
  segmentSpacingPixels: 14,
  trailSampleSpacingPixels: 4,
  trailSafetyMarginPixels: 56,
  safetyMarginPixels: 42
});
