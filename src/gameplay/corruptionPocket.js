import { MOBILE_ASTEROID_CONFIG } from "./mobileAsteroidSystem.js";
import { NYR_ZONES } from "./nyrZoneProgression.js";
export const POCKET_CONFIG = Object.freeze({ radius: 52, warning: 1, active: 4, cooldown: 5, zoneThreeCooldown: 4 });
export function createCorruptionPocket(onContact) {
  let cooldownDuration = POCKET_CONFIG.cooldown;
  const state = { phase: "inactive", remaining: 0, x: 0, y: 0, radius: 0, generation: 0, contact: false };
  function place(width, height, head, obstacles) {
    state.radius = Math.min(POCKET_CONFIG.radius, Math.min(width, height) / 5);
    const margin = state.radius + 12;
    const candidates = [];
    for (let row = 0; row < 4; row++) for (let column = 0; column < 6; column++) {
      candidates.push({ x: margin + (width - 2 * margin) * column / 5,
        y: margin + (height - 2 * margin) * row / 3 });
    }
    let best;
    for (let i = 0; i < candidates.length; i++) {
      const point = candidates[(i + state.generation * 7) % candidates.length];
      const headDistance = Math.hypot(point.x - head.x, point.y - head.y);
      const clearance = Math.min(1000, ...obstacles.map(o =>
        Math.hypot(point.x - o.x, point.y - o.y) - (o.radius ?? 14)));
      const safe = headDistance > state.radius + 90 && clearance > state.radius + 16;
      const rank = (safe ? 10000 : 0) + Math.min(headDistance, 240) + Math.min(clearance, 120);
      if (!best || rank > best.rank) best = { ...point, rank };
    }
    state.x = best.x; state.y = best.y;
  }
  function warn(width, height, head, obstacles) {
    state.generation++;
    place(width, height, head, obstacles);
    state.phase = "warning"; state.remaining = POCKET_CONFIG.warning; state.contact = false;
  }
  function update(delta, zone, width, height, head, obstacles = [], voidCooldown = POCKET_CONFIG.zoneThreeCooldown) {
    if (![NYR_ZONES.ZONE_2, NYR_ZONES.ZONE_3, NYR_ZONES.ZONE_4].includes(zone) || !Number.isFinite(delta) || delta < 0) return;
    if (state.phase === "inactive") { warn(width, height, head, obstacles); return; }
    const nextCooldown = zone === NYR_ZONES.ZONE_4 ? voidCooldown : zone === NYR_ZONES.ZONE_3 ? POCKET_CONFIG.zoneThreeCooldown : POCKET_CONFIG.cooldown;
    if (zone !== NYR_ZONES.ZONE_4 && state.phase === "cooldown" && cooldownDuration !== nextCooldown) {
      state.remaining = Math.max(0, state.remaining + nextCooldown - cooldownDuration);
    }
    cooldownDuration = nextCooldown;
    let elapsed = delta;
    while (elapsed + 1e-9 >= state.remaining) {
      elapsed = Math.max(0, elapsed - state.remaining);
      if (state.phase === "warning") {
        state.phase = "active"; state.remaining = POCKET_CONFIG.active;
      } else if (state.phase === "active") {
        state.phase = "cooldown"; state.remaining = cooldownDuration; state.contact = false;
      } else warn(width, height, head, obstacles);
    }
    state.remaining -= elapsed;
    if (state.phase !== "active") return;
    const touching = Math.hypot(head.x - state.x, head.y - state.y) <= state.radius + MOBILE_ASTEROID_CONFIG.headCollisionRadiusPixels;
    if (touching && !state.contact) { state.contact = true; onContact(); }
    else if (!touching) state.contact = false;
  }
  function translate(offset) {
    if (state.phase !== "warning" && state.phase !== "active") return;
    state.x += offset.x; state.y += offset.y;
  }
  function revalidate(width, height, head, obstacles = []) {
    if (state.phase !== "warning" && state.phase !== "active") return;
    const margin = state.radius + 12;
    if (state.x < margin || state.x > width - margin || state.y < margin || state.y > height - margin) {
      place(width, height, head, obstacles);
      state.phase = "warning"; state.remaining = POCKET_CONFIG.warning; state.contact = false;
    } else if (state.phase === "active" && Math.hypot(head.x - state.x, head.y - state.y) <= state.radius + MOBILE_ASTEROID_CONFIG.headCollisionRadiusPixels) {
      state.contact = true;
    }
  }
  return Object.freeze({ update, translate, revalidate, snapshot: () => Object.freeze({ ...state }) });
}
export function renderCorruptionPocket(context, pocket) {
  if (pocket.phase !== "warning" && pocket.phase !== "active") return;
  const warning = pocket.phase === "warning";
  context.save();
  context.beginPath();
  context.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
  context.fillStyle = warning ? "rgba(230, 80, 180, 0.05)" : "rgba(215, 35, 155, 0.32)";
  context.fill();
  context.setLineDash(warning ? [5, 7] : []);
  context.strokeStyle = warning ? "rgba(255, 180, 225, 0.85)" : "#f36bc6";
  context.lineWidth = warning ? 1.5 : 3;
  context.stroke();
  context.restore();
}
