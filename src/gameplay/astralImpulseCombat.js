export const IMPULSE_RADIUS = 110;
export const IMPULSE_DURATION = 0.4;
const EPS = 1e-7;
const TARGET_TYPES = new Set(["meteor", "shockwave", "corruption", "pocket", "parasite"]);

// Exact intersection of a moving disk and a linearly expanding, thin circle.
function hitsDisk(sweep, target, low, high) {
  const old = target.previous ?? target.current, now = target.current;
  const x = old.x - sweep.x, y = old.y - sweep.y;
  const vx = now.x - old.x, vy = now.y - old.y, radius = target.radius;
  const candidates = [low, high];
  for (const side of [-1, 1]) {
    const r = sweep.radius + side * radius, speed = sweep.growth;
    const a = vx * vx + vy * vy - speed * speed;
    const b = 2 * (x * vx + y * vy - r * speed);
    const c = x * x + y * y - r * r;
    if (Math.abs(a) < EPS) {
      if (Math.abs(b) > EPS) candidates.push(-c / b);
    } else {
      const discriminant = b * b - 4 * a * c;
      const tolerance = Number.EPSILON * 32 * (b * b + Math.abs(4 * a * c) + 1);
      if (discriminant >= -tolerance) {
        const root = Math.sqrt(Math.max(0, discriminant));
        candidates.push((-b - root) / (2 * a), (-b + root) / (2 * a));
      }
    }
  }
  let first = null;
  for (let t of candidates) {
    if (t < low - EPS || t > high + EPS) continue;
    t = Math.max(low, Math.min(high, t));
    const distance = Math.hypot(x + vx * t, y + vy * t);
    if (Math.abs(distance - (sweep.radius + sweep.growth * t)) <= radius + EPS) first = first === null ? t : Math.min(first, t);
  }
  return first;
}

// Enemy shockwave centers are stationary. Intersect three linear inequalities
// over time: d <= r+s+w, r-s <= d+w, s-r <= d+w (including concentric rings).
function hitsRing(sweep, target, low, high) {
  const d = Math.hypot(target.current.x - sweep.x, target.current.y - sweep.y);
  const r = sweep.radius, dr = sweep.growth;
  const s = target.radius, ds = target.growth, w = target.halfWidth;
  for (const [a, b] of [[r + s + w - d, dr + ds], [d + w - r + s, ds - dr], [d + w + r - s, dr - ds]]) {
    if (Math.abs(b) < EPS) { if (a < -EPS) return null; }
    else if (b > 0) low = Math.max(low, -a / b);
    else high = Math.min(high, -a / b);
    if (low > high + EPS) return null;
  }
  return Math.min(high, Math.max(0, low));
}

export function createAstralImpulseCombat({ energy, readHead, readState, onNeutralized = () => {} }) {
  let pulse = null, sweep = null;
  const touched = new Set(), pending = new Map();
  function isActive() { return Boolean(pulse && pulse.elapsed < IMPULSE_DURATION - 1e-12); }
  function trigger() {
    const state = readState();
    if (!state.active || state.transitioning || isActive() || !energy.isReady()) return false;
    const head = readHead();
    if (!Number.isFinite(head.x) || !Number.isFinite(head.y) || !energy.consume()) return false;
    pulse = { x: head.x, y: head.y, elapsed: 0 };
    sweep = null; touched.clear(); pending.clear();
    return true;
  }
  function update(delta) {
    sweep = null; pending.clear();
    if (!readState().active || !isActive() || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(0.05, delta);
    const available = IMPULSE_DURATION - pulse.elapsed;
    sweep = { x: pulse.x, y: pulse.y, radius: IMPULSE_RADIUS * pulse.elapsed / IMPULSE_DURATION,
      growth: IMPULSE_RADIUS * dt / IMPULSE_DURATION, end: Math.min(1, available / dt) };
    pulse.elapsed = Math.min(IMPULSE_DURATION, pulse.elapsed + dt);
  }
  // Pure probe: target endpoints describe the complete frame, active bounds clip it.
  function firstIntersection(target) {
    if (!sweep || !readState().active || touched.has(target.id) || !target.id || !TARGET_TYPES.has(target.category)) return null;
    const low = Math.max(0, target.activeFrom ?? 0), high = Math.min(sweep.end, target.activeTo ?? 1);
    if (low > high || !target.current) return null;
    return target.kind === "ring" ? hitsRing(sweep, target, low, high) : hitsDisk(sweep, target, low, high);
  }
  function intersects(target) {
    const time = firstIntersection(target);
    if (time === null) return false;
    pending.set(target.id, target.category === "parasite" ? 75 : 50);
    return true;
  }
  function confirmNeutralized(id) {
    if (!readState().active || !pending.has(id) || touched.has(id)) return false;
    const amount = pending.get(id); pending.delete(id);
    touched.add(id); onNeutralized(amount, id);
    return true;
  }
  function cancel() { pulse = null; sweep = null; touched.clear(); pending.clear(); }
  function snapshot() {
    return Object.freeze({ active: isActive(), x: pulse?.x ?? null, y: pulse?.y ?? null,
      elapsed: pulse?.elapsed ?? 0, radius: pulse ? IMPULSE_RADIUS * pulse.elapsed / IMPULSE_DURATION : 0,
      neutralized: touched.size });
  }
  return Object.freeze({ trigger, update, intersects, firstIntersection, confirmNeutralized, cancel, isActive, snapshot });
}
