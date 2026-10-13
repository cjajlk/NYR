import { MOBILE_ASTEROID_CONFIG } from "./mobileAsteroidSystem.js";

export const ACTION_EVENT_CONFIG = Object.freeze({
  "zone-1": { delay: 75, meteors: [3, 3], waveEvery: 0 },
  "zone-2": { delay: 55, meteors: [3, 4], waveEvery: 3 },
  "zone-3": { delay: 42, meteors: [4, 5], waveEvery: 2 },
  "zone-4": { delay: 34, meteors: [4, 5], waveEvery: 2 }
});
const headRadius = MOBILE_ASTEROID_CONFIG.headCollisionRadiusPixels;
const meteorRadius = 14, nearBand = 18, protection = 0.8;
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function sweptDistance(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a.x + dx * t, a.y + dy * t);
}

export function createActionEvents({ random = Math.random, onDamage = () => {}, onDodge = () => {} } = {}) {
  let zone = null, event = null, remaining = 75, serial = 0, shield = 0, previousHead = null;
  let feedback = 0, surface = null;
  function reset(nextZone = zone) {
    zone = nextZone; event = null; previousHead = null; shield = 0; feedback = 0;
    remaining = ACTION_EVENT_CONFIG[zone]?.delay ?? 75; serial = 0; surface = null;
  }
  function noteDamage() { shield = protection; }
  function damage(obstacle, amount) {
    obstacle.contacted = true; // Protected contact cannot become a free dodge reward.
    if (shield > 0 || obstacle.damaged) return;
    obstacle.damaged = true; shield = protection; onDamage(amount);
  }
  function award(obstacle) {
    if (!obstacle.near || obstacle.contacted || obstacle.rewarded) return;
    obstacle.rewarded = true; feedback = 0.9; onDodge(100);
  }
  function start(kind, width, height, head) {
    if (event || !ACTION_EVENT_CONFIG[zone] || Math.min(width, height) < 220) return false;
    if (kind === "wave") {
      if (zone === "zone-1") return false;
      const points = [{ x: width * 0.22, y: height * 0.25 }, { x: width * 0.78, y: height * 0.25 },
        { x: width * 0.22, y: height * 0.75 }, { x: width * 0.78, y: height * 0.75 }];
      const center = points.sort((a, b) => distance(b, head) - distance(a, head))[0];
      if (distance(center, head) < 140) return false;
      event = { kind, phase: "warning", elapsed: 0, ...center, radius: 0,
        maximum: Math.min(170, Math.min(width, height) * 0.36), contacted: false, damaged: false, near: false, rewarded: false };
    } else {
      const [min, max] = ACTION_EVENT_CONFIG[zone].meteors;
      const count = min + Math.floor(random() * (max - min + 1));
      if (Math.max(width, height) / (count + 1) < 95) return false;
      const vertical = width / (count + 1) >= 95 && (height / (count + 1) < 95 || random() < 0.5);
      const meteors = [];
      for (let i = 0; i < count; i++) {
        const lane = (i + 1) / (count + 1);
        const reverse = i % 2 === 1;
        const point = vertical ? { x: width * lane, y: reverse ? height + 45 : -45 } :
          { x: reverse ? width + 45 : -45, y: height * lane };
        if (distance(point, head) < 120) return false;
        const speed = 70 + random() * 20;
        // Parallel lanes with alternating entry edges leave open, readable corridors.
        meteors.push({ ...point, vx: vertical ? 0 : (reverse ? -speed : speed),
          vy: vertical ? (reverse ? -speed : speed) : 0, radius: meteorRadius,
          contacted: false, damaged: false, near: false, rewarded: false, done: false });
      }
      event = { kind: "rain", phase: "warning", elapsed: 0, meteors };
    }
    return true;
  }
  function update(delta, { active = true, zone: nextZone, width, height, head, blocked = false, enabled = true }) {
    if (!active) return;
    if (zone !== nextZone || (surface && (surface.width !== width || surface.height !== height))) reset(nextZone);
    surface = { width, height };
    if (!enabled) { event = null; previousHead = { ...head }; return; }
    const dt = Math.max(0, Math.min(0.05, delta));
    shield = Math.max(0, shield - dt); feedback = Math.max(0, feedback - dt);
    const oldHead = previousHead ?? head; previousHead = { x: head.x, y: head.y };
    if (blocked) { event = null; remaining = Math.max(remaining, 10); return; }
    if (!event) {
      remaining -= dt;
      if (remaining <= 0) {
        const config = ACTION_EVENT_CONFIG[zone];
        if (!config) return;
        serial++;
        start(config.waveEvery && serial % config.waveEvery === 0 ? "wave" : "rain", width, height, head);
        remaining = config.delay * (0.9 + random() * 0.2);
      }
      return;
    }
    const current = event;
    current.elapsed += dt;
    if (current.kind === "rain") {
      if (current.phase === "warning") {
        if (current.elapsed >= 1.5) { current.phase = "active"; current.elapsed = 0; }
        return;
      }
      for (const meteor of current.meteors) {
        if (meteor.done) continue;
        const old = { x: meteor.x, y: meteor.y };
        meteor.x += meteor.vx * dt; meteor.y += meteor.vy * dt;
        const gap = sweptDistance({ x: oldHead.x - old.x, y: oldHead.y - old.y },
          { x: head.x - meteor.x, y: head.y - meteor.y }) - headRadius - meteor.radius;
        if (gap <= 0) damage(meteor, 25);
        else if (gap <= nearBand) meteor.near = true;
        if (event !== current) return;
        // Outside only after traversal; initial off-screen entry is not completion.
        const outside = meteor.vx > 0 ? meteor.x > width + 45 : meteor.vx < 0 ? meteor.x < -45 :
          meteor.vy > 0 ? meteor.y > height + 45 : meteor.y < -45;
        if (outside) { meteor.done = true; award(meteor); }
      }
      if (current.meteors.every(m => m.done)) event = null;
    } else {
      if (current.elapsed < 2) { current.phase = "warning"; return; }
      if (current.elapsed < 3.5) {
        current.phase = "active";
        const oldRadius = current.radius;
        current.radius = current.maximum * ((current.elapsed - 2) / 1.5);
        const first = distance(oldHead, current) - oldRadius;
        const last = distance(head, current) - current.radius;
        const separation = first * last <= 0 ? 0 : Math.min(Math.abs(first), Math.abs(last));
        const gap = separation - headRadius - 5;
        if (gap <= 0) damage(current, 20);
        else if (gap <= nearBand) current.near = true;
      } else if (current.elapsed < 4) {
        current.phase = "dissipating"; current.radius = current.maximum;
      } else { award(current); event = null; }
    }
  }
  function snapshot() {
    return { zone, remaining, shield, feedback, event: event ?
      { ...event, ...(event.meteors ? { meteors: event.meteors.map(m => ({ ...m })) } : {}) } : null };
  }
  return Object.freeze({ update, reset, noteDamage, snapshot });
}

export function renderActionEvents(ctx, state, width, height) {
  const event = state.event;
  ctx.save();
  if (event?.kind === "rain") {
    const warning = event.phase === "warning";
    for (const m of event.meteors) {
      if (m.done) continue;
      if (warning) {
        ctx.strokeStyle = "rgba(255, 181, 107, 0.55)"; ctx.lineWidth = 3;
        ctx.setLineDash([8, 9]); ctx.beginPath();
        ctx.moveTo(Math.max(0, Math.min(width, m.x)), Math.max(0, Math.min(height, m.y)));
        ctx.lineTo(m.vx ? (m.vx > 0 ? width : 0) : m.x, m.vy ? (m.vy > 0 ? height : 0) : m.y);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.save();
        ctx.translate(Math.max(18, Math.min(width - 18, m.x)), Math.max(18, Math.min(height - 18, m.y)));
        ctx.rotate(Math.atan2(m.vy, m.vx)); ctx.fillStyle = "#ffd0a6";
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.strokeStyle = "rgba(255, 166, 104, 0.45)"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(m.x - m.vx * 0.25, m.y - m.vy * 0.25); ctx.lineTo(m.x, m.y); ctx.stroke();
        ctx.fillStyle = "#9c7190"; ctx.strokeStyle = "#ffd0a6"; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4, r = m.radius * (i % 2 ? 0.82 : 1);
          const x = m.x + Math.cos(angle) * r, y = m.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
  } else if (event) {
    const warning = event.phase === "warning";
    ctx.strokeStyle = warning ? "#ffbf8d" : "#eeb9ff";
    ctx.lineWidth = warning ? 3 : 10;
    ctx.globalAlpha = event.phase === "dissipating" ? Math.max(0, (4 - event.elapsed) * 2) : 0.8;
    if (warning) ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.arc(event.x, event.y, warning ? event.maximum : event.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  if (event?.phase === "warning") {
    ctx.font = "bold 14px system-ui"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(7,8,22,0.9)"; ctx.fillRect(width / 2 - 115, 70, 230, 30);
    ctx.fillStyle = "#ffe0bb"; ctx.fillText(event.kind === "rain" ? "PLUIE DE MÉTÉORITES" : "ONDE DE CHOC", width / 2, 90);
  }
  if (state.feedback > 0) {
    ctx.strokeStyle = `rgba(90,230,255,${state.feedback * 0.28})`; ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, width - 6, height - 6);
    ctx.font = "bold 15px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = "#9bf5ff";
    ctx.fillText("ESQUIVE +100", width / 2, 126);
  }
  ctx.restore();
}
