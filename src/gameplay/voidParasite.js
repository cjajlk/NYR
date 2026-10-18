export const VOID_PARASITE_CONFIG = Object.freeze({
  radius: 12, detectionRadius: 160, preparationDuration: 0.8,
  chargeDuration: 0.6, recoveryDuration: 1.5, lockMinimum: 80, lockMaximum: 192,
  appearanceDuration: 0.6, initialDelay: 8, respawnDelay: 12, spawnRetryDelay: 2,
  spawnHeadDistance: 220, spawnBodyDistance: 45, spawnPortalDistance: 96,
  edgeMargin: 36, minimumDimension: 260, protectionDuration: 0.8
});
const EPS = 1e-9, MAX_STEP = 0.05;
const living = new Set(["appearing", "observing", "preparing", "charging", "recovering"]);
const terminalReasons = new Set(["game-over", "session-end"]);
const interruptionReasons = new Set(["pause", "zone-change", "portal", "resize", "recenter", ...terminalReasons]);
const point = p => Boolean(p && Number.isFinite(p.x) && Number.isFinite(p.y));
const copy = p => p ? Object.freeze({ x: p.x, y: p.y }) : null;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* No environment imports, storage, combat, score, rendering or automatic placement.
 * All hooks must be synchronous. A spawn requires an explicit safety approval.
 * Updates consume at most 50 ms; callers must not submit paused wall-clock time.
 */
export function createVoidParasite({ config: overrides = {}, requestSpawn = () => null,
  isSpawnSafe = () => false, isCorridorValid = () => false, detectContact = () => null, detectNeutralization = () => null,
  onContact = () => {}, onNeutralized = () => {} } = {}) {
  for (const key of Object.keys(overrides)) {
    if (!Object.hasOwn(VOID_PARASITE_CONFIG, key)) throw new RangeError(`Unknown parasite parameter: ${key}`);
  }
  const config = Object.freeze({ ...VOID_PARASITE_CONFIG, ...overrides });
  for (const [key, value] of Object.entries(config)) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`Invalid parasite parameter: ${key}`);
    if (/(Duration|Delay)$/.test(key) && value < MAX_STEP) throw new RangeError(`Parasite timer below 50 ms: ${key}`);
  }
  if (config.lockMinimum > config.lockMaximum) throw new RangeError("Invalid parasite lock window");
  if (config.respawnDelay < 12) throw new RangeError("Parasite respawn must wait at least 12 active seconds");
  let phase = "waiting", remaining = config.initialDelay, elapsed = 0;
  let position = null, target = null, origin = null, velocity = { x: 0, y: 0 };
  let generation = 0, chargeSerial = 0, chargeId = null, contactConsumed = false;
  let activeTime = 0, protection = 0, paused = false, stopped = false, revision = 0;
  let events = [];
  function emit(type, time = activeTime, detail = {}) {
    if (events.length === 64) events.shift();
    const event = Object.freeze({ type, time, generation, chargeId, ...detail });
    events.push(event); return event;
  }
  function enter(next, duration = 0) { phase = next; elapsed = 0; remaining = duration; }
  function recover(reason, time) {
    velocity = { x: 0, y: 0 };
    target = null;
    enter("recovering", config.recoveryDuration);
    if (reason) emit("chargeInterrupted", time, { reason });
  }
  function interrupt(reason) {
    if (!interruptionReasons.has(reason)) throw new RangeError("Unknown parasite interruption");
    revision++;
    events = [];
    if (reason === "pause") {
      if (paused || stopped) return snapshot();
      paused = true;
      if (phase === "preparing" || phase === "charging") recover(reason, activeTime);
      return snapshot();
    }
    const interrupted = phase === "preparing" || phase === "charging";
    position = target = origin = null; velocity = { x: 0, y: 0 };
    protection = 0; paused = false; contactConsumed = false;
    stopped = stopped || terminalReasons.has(reason);
    enter("waiting", config.initialDelay);
    if (interrupted) emit("chargeInterrupted", activeTime, { reason });
    return snapshot();
  }
  function destroyAt(time) {
    if (stopped || !living.has(phase)) return false;
    const interrupted = phase === "preparing" || phase === "charging";
    revision++; events = [];
    if (interrupted) emit("chargeInterrupted", time, { reason: "destroyed" });
    const at = copy(position);
    position = target = origin = null; velocity = { x: 0, y: 0 }; protection = 0;
    enter("destroyed", config.respawnDelay);
    emit("destroyed", time, { position: at });
    return true;
  }
  function destroy() { return destroyAt(activeTime); }
  function snapshot() {
    return Object.freeze({ phase, remaining, elapsed, position: copy(position), target: copy(target),
      velocity: copy(velocity), generation, chargeId, contactConsumed, protection, activeTime, paused, stopped,
      radius: config.radius, config });
  }
  function update(delta, frame = {}) {
    if (stopped) return snapshot();
    if (frame.active === false) return interrupt("pause");
    if (!Number.isFinite(delta) || delta <= 0 || !point(frame.head)) return snapshot();
    paused = false;
    const dt = Math.min(MAX_STEP, delta), startTime = activeTime;
    const oldHead = point(frame.previousHead) ? frame.previousHead : frame.head;
    const headAt = t => ({ x: oldHead.x + (frame.head.x - oldHead.x) * t / dt,
      y: oldHead.y + (frame.head.y - oldHead.y) * t / dt });
    activeTime += dt;
    let cursor = 0;
    const version = revision;
    // Timers >= 50 ms bound the number of boundaries in one update.
    for (let boundary = 0; boundary < 8 && cursor < dt; boundary++) {
      const time = startTime + cursor;
      if (phase === "observing") {
        if (distance(position, headAt(cursor)) <= config.detectionRadius + EPS) {
          chargeId = null; contactConsumed = false; origin = null;
          target = headAt(cursor); enter("preparing", config.preparationDuration);
          emit("preparationStarted", time);
          continue;
        }

      }
      const duration = phase === "observing" ? dt - cursor : Math.min(dt - cursor, remaining);
      const endHead = headAt(cursor + duration);
      const from = copy(position);
      const to = phase === "charging" ? { x: origin.x + velocity.x * (elapsed + duration),
        y: origin.y + velocity.y * (elapsed + duration) } : copy(position);
      const portion = Object.freeze({ generation, chargeId, from, to: copy(to),
        headFrom: copy(headAt(cursor)), headTo: copy(endHead), duration,
        activeFrom: cursor / dt, activeTo: (cursor + duration) / dt, protected: protection > 0 });
      const validFraction = value => Number.isFinite(value) && value >= 0 && value <= 1;
      const contact = phase === "charging" ? detectContact(portion) : null;
      if (revision !== version) return snapshot();
      const neutralization = living.has(phase) && duration > 0 ? detectNeutralization(portion) : null;
      if (revision !== version) return snapshot();
      const hit = !contactConsumed && validFraction(contact?.fraction) ? contact.fraction : null;
      const neutral = validFraction(neutralization?.fraction) ? neutralization.fraction : null;
      if (neutral !== null && (hit === null || neutral <= hit + EPS)) {
        const used = duration * neutral;
        position = { x: from.x + (to.x - from.x) * neutral, y: from.y + (to.y - from.y) * neutral };
        cursor += used;
        const event = Object.freeze({ type: "neutralized", time: startTime + cursor, generation,
          chargeId, position: copy(position) });
        destroyAt(event.time); // Removal must precede reward/feedback confirmation.
        const removedVersion = revision;
        onNeutralized(event);
        if (revision !== removedVersion) return snapshot();
        // Only the non-hazardous respawn timer remains in this frame.
        protection = 0;
        const rest = dt - cursor; remaining = Math.max(0, remaining - rest); elapsed += rest;
        break;
      }
      if (phase === "charging") {
        if (hit !== null) {
          const used = duration * hit;
          position = { x: from.x + (to.x - from.x) * hit, y: from.y + (to.y - from.y) * hit };
          protection = Math.max(0, protection - used);
          cursor += used; contactConsumed = true;
          if (dt - cursor < EPS) cursor = dt;
          const event = emit("firstContact", startTime + cursor, { position: copy(position), protected: protection > 0 });
          recover(null, startTime + cursor);
          onContact(event);
          if (revision !== version) return snapshot();
          continue;
        }
        position = to;
      }
      if (phase === "observing") { protection = Math.max(0, protection - duration); cursor = dt; break; }
      if (phase === "preparing") target = endHead;
      remaining = Math.max(0, remaining - duration); elapsed += duration;
      protection = Math.max(0, protection - duration); cursor += duration;
      if (dt - cursor < EPS) cursor = dt;
      if (remaining > EPS) break;
      const endTime = startTime + cursor;
      if (phase === "waiting" || phase === "destroyed") {
        const context = Object.freeze({ ...frame, head: copy(endHead), config });
        const candidate = requestSpawn(context);
        if (revision !== version) return snapshot();
        const fits = point(candidate) && Number.isFinite(frame.width) && Number.isFinite(frame.height) &&
          Math.min(frame.width, frame.height) >= config.minimumDimension &&
          candidate.x >= config.edgeMargin && candidate.y >= config.edgeMargin &&
          candidate.x <= frame.width - config.edgeMargin && candidate.y <= frame.height - config.edgeMargin &&
          distance(candidate, endHead) >= config.spawnHeadDistance - EPS;
        const approved = fits && isSpawnSafe(copy(candidate), context) === true;
        if (revision !== version) return snapshot();
        if (approved) {
          generation++; chargeId = null; contactConsumed = false;
          position = { x: candidate.x, y: candidate.y };
          enter("appearing", config.appearanceDuration); emit("spawned", endTime, { position: copy(position) });
        } else enter("waiting", config.spawnRetryDelay);
      } else if (phase === "appearing" || phase === "recovering") enter("observing");
      else if (phase === "preparing") {
        const length = distance(position, target);
        const admissible = length >= config.lockMinimum - EPS && length <= config.lockMaximum + EPS;
        const valid = admissible && isCorridorValid(Object.freeze({ from: copy(position), to: copy(target), config, frame })) === true;
        if (revision !== version) return snapshot();
        if (!valid) recover(admissible ? "invalid-corridor" : "lock-distance", endTime);
        else {
          target = { ...target }; origin = { ...position };
          velocity = { x: (target.x - position.x) / config.chargeDuration,
            y: (target.y - position.y) / config.chargeDuration };
          chargeId = `${generation}:${++chargeSerial}`; contactConsumed = false;
          enter("charging", config.chargeDuration);
          emit("chargeStarted", endTime, { from: copy(origin), target: copy(target), velocity: copy(velocity) });
        }
      } else if (phase === "charging") {
        position = { ...target };
        emit("chargeMissed", endTime, { position: copy(position) });
        recover(null, endTime);
      }
    }
    return snapshot();
  }
  return Object.freeze({ update, snapshot, interrupt, destroy,
    noteDamage() { if (!stopped && living.has(phase)) protection = config.protectionDuration; },
    drainEvents() { const pending = Object.freeze(events); events = []; return pending; } });
}
