import { NYR_ZONE_PROGRESSION_CONFIG } from "./nyrZoneProgression.js";
export const PORTAL_CONFIG = Object.freeze({ radius: 28, contactRadius: 24, margin: 56 });
export function createZoneExitPortal(onEnter, threshold = NYR_ZONE_PROGRESSION_CONFIG.zoneTwoThresholdFragments) {
  let state = { active: false, used: false, x: 0, y: 0 };
  let readyForContact = true;
  function reset() {
    state = { active: false, used: false, x: 0, y: 0 };
    readyForContact = true;
  }
  function place(width, height, head, fragments, asteroid) {
    const margin = Math.min(PORTAL_CONFIG.margin, width / 4, height / 4);
    const occupied = [...(head.trail ?? []), ...fragments];
    if (asteroid?.active) occupied.push(asteroid);
    let best;
    for (let row = 0; row <= 4; row++) for (let column = 0; column <= 6; column++) {
      const point = { x: margin + (width - 2 * margin) * column / 6,
        y: margin + (height - 2 * margin) * row / 4 };
      const distance = Math.hypot(point.x - head.x, point.y - head.y);
      const clearance = Math.min(...occupied.map(p => Math.hypot(point.x - p.x, point.y - p.y) - (p.radius ?? 0)), 1000);
      const safe = distance >= 140 && clearance >= 60;
      const rank = (safe ? 10000 : 0) + Math.min(distance, 250) + Math.min(clearance, 120);
      if (!best || rank > best.rank) best = { ...point, rank };
    }
    state.x = best.x; state.y = best.y;
  }
  function unlock(count, width, height, head, fragments, asteroid) {
    if (state.active || state.used || count < threshold) return;
    place(width, height, head, fragments, asteroid);
    state.active = true;
  }
  function update(head) {
    if (!state.active) return;
    const touching = Math.hypot(head.x - state.x, head.y - state.y) <= PORTAL_CONFIG.contactRadius;
    if (!readyForContact) { if (!touching) readyForContact = true; return; }
    if (!touching) return;
    state.active = false; state.used = true;
    onEnter();
  }
  function translate(offset) {
    if (!state.active) return;
    state.x += offset.x; state.y += offset.y;
  }
  function revalidate(width, height, head, fragments, asteroid) {
    if (!state.active) return;
    const margin = Math.min(PORTAL_CONFIG.margin, width / 4, height / 4);
    if (state.x < margin || state.x > width - margin || state.y < margin || state.y > height - margin) {
      place(width, height, head, fragments, asteroid);
    }
    // A resize is never an entry gesture: require separation if it overlaps Nyr.
    readyForContact = Math.hypot(head.x - state.x, head.y - state.y) > PORTAL_CONFIG.contactRadius;
  }
  return Object.freeze({ reset, unlock, update, translate, revalidate, snapshot: () => Object.freeze({ ...state }) });
}
export function renderZoneExitPortal(context, portal) {
  if (!portal.active) return;
  context.save();
  context.beginPath();
  context.arc(portal.x, portal.y, PORTAL_CONFIG.radius, 0, Math.PI * 2);
  context.fillStyle = "rgba(130, 100, 255, 0.12)";
  context.fill();
  context.strokeStyle = "#c6b8ff";
  context.lineWidth = 3;
  context.shadowColor = "#9272ff";
  context.shadowBlur = 18;
  context.stroke();
  context.beginPath();
  context.arc(portal.x, portal.y, PORTAL_CONFIG.radius + 6, 0, Math.PI * 2);
  context.lineWidth = 1;
  context.strokeStyle = "rgba(165, 225, 255, 0.65)";
  context.stroke();
  context.restore();
}
