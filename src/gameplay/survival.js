import { NYR_PROTOTYPE_CONFIG, MAX_VISIBLE_SEGMENTS } from "./nyrPrototypeConfig.js";

export const SURVIVAL_CHALLENGES = Object.freeze([
  { id: "time", title: "Premier survivant", reward: 50, metric: "activeTime", target: 300 },
  { id: "length", title: "Maître des trajectoires", reward: 75, metric: "maxLength", target: 80 },
  { id: "cycle", title: "Survivant du Vide", reward: 125, metric: "cycles", target: 1 }
].map(Object.freeze));
export const survivalSpeed = cycles => 1 + Math.min(4, Math.max(0, Math.floor(cycles))) * 0.05;

// Physical trail only: skip four neighbours (56 px), radius 10.5 px.
// Only materialized segments participate; never extend a short initialization trail.
export function hasSelfCollision(movement, config = NYR_PROTOTYPE_CONFIG) {
  const radius = config.segmentSpacingPixels * 0.75;
  const trail = movement.trail;
  let travelled = 0, segment = 5;
  const limit = Math.min(MAX_VISIBLE_SEGMENTS, movement.segmentCount);
  for (let i = 1; i < trail.length && segment <= limit; i++) {
    const a = trail[i - 1], b = trail[i];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!distance) continue;
    while (segment <= limit && segment * config.segmentSpacingPixels <= travelled + distance) {
      const t = (segment * config.segmentSpacingPixels - travelled) / distance;
      if (Math.hypot(a.x + (b.x - a.x) * t - movement.x,
        a.y + (b.y - a.y) * t - movement.y) <= radius) return true;
      segment++;
    }
    travelled += distance;
  }
  return false;
}

export function createSurvivalRun(readMetrics, wallet) {
  let maxLength = 0, cause = null;
  const rewards = new Map();
  function observe() {
    const run = readMetrics();
    maxLength = Math.max(maxLength, run.segmentCount);
    const metrics = { ...run, maxLength };
    for (const challenge of wallet.recordSurvival(metrics)) rewards.set(challenge.id, challenge);
    return snapshot();
  }
  function snapshot() { return Object.freeze({ maxLength, cause, survival: true, rewards: [...rewards.values()] }); }
  function defeat(reason) { if (cause === null) cause = reason; }
  return Object.freeze({ observe, snapshot, defeat });
}
