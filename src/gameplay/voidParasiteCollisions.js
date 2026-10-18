// First contact of two moving disks on the same normalized time interval.
export function movingCircleContact(a0, a1, b0, b1, radius = 29) {
  if (![a0, a1, b0, b1].every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)) || !Number.isFinite(radius) || radius < 0) return null;
  const x = a0.x - b0.x, y = a0.y - b0.y;
  const dx = a1.x - a0.x - b1.x + b0.x, dy = a1.y - a0.y - b1.y + b0.y;
  const c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (x * dx + y * dy), discriminant = b * b - 4 * a * c;
  const tolerance = Number.EPSILON * 32 * (b * b + Math.abs(4 * a * c) + 1);
  if (discriminant < -tolerance) return null;
  const time = (-b - Math.sqrt(Math.max(0, discriminant))) / (2 * a);
  return time >= -1e-10 && time <= 1 + 1e-10 ? Math.max(0, Math.min(1, time)) : null;
}

// V1 interprets endpoints on the entire frame, not on an active sub-portion.
export function parasiteImpulseTarget(portion, id, radius = 12) {
  const span = portion.activeTo - portion.activeFrom;
  if (!(span > 0) || !portion.from || !portion.to) return null;
  const vx = (portion.to.x - portion.from.x) / span, vy = (portion.to.y - portion.from.y) / span;
  const previous = { x: portion.from.x - vx * portion.activeFrom, y: portion.from.y - vy * portion.activeFrom };
  return { id, category: "parasite", previous, current: { x: previous.x + vx, y: previous.y + vy },
    radius, activeFrom: portion.activeFrom, activeTo: portion.activeTo };
}
