/* Presentation adapter: every collision and confirmation stays owned by Lot 2. */
export function createImpulsePresentation({ combat, audio, reducedMotion = () => false }) {
  let armed = false, bursts = [], soundCooldown = 0;
  const candidates = new Map();
  function trigger() {
    if (!combat.trigger()) return false;
    armed = true;
    candidates.clear();
    audio.play("impulse");
    return true;
  }
  function intersects(target) {
    const hit = combat.intersects(target);
    if (hit && armed) candidates.set(target.id, { x: target.current.x, y: target.current.y });
    return hit;
  }
  function confirmed(id) {
    const position = candidates.get(id);
    if (!armed || !position) return;
    candidates.delete(id);
    bursts.push({ ...position, age: 0 });
    if (bursts.length > 3) bursts.shift();
    if (soundCooldown <= 0) {
      audio.play("impulseNeutralized");
      soundCooldown = 0.12;
    }
  }
  function update(delta) {
    candidates.clear();
    soundCooldown = Math.max(0, soundCooldown - delta);
    bursts = bursts.map(b => ({ ...b, age: b.age + delta })).filter(b => b.age < 0.55);
  }
  function cancel() {
    combat.cancel();
    audio.stopImpulse?.();
    armed = false; bursts = []; candidates.clear(); soundCooldown = 0;
  }
  function render(ctx) {
    const reduced = reducedMotion();
    for (const burst of bursts) {
      const fade = 1 - burst.age / 0.55;
      ctx.save();
      ctx.globalAlpha = fade * 0.9;
      ctx.font = "600 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "#b9faff";
      ctx.fillText("+50", burst.x, burst.y - 15 - (reduced ? 0 : burst.age * 16));
      if (!reduced) {
        for (let i = 0; i < 4; i++) {
          const angle = i * Math.PI / 2 + Math.PI / 4;
          const distance = 5 + burst.age * 27;
          ctx.fillStyle = i % 2 ? "#b59aff" : "#9cfaff";
          ctx.fillRect(burst.x + Math.cos(angle) * distance - 1,
            burst.y + Math.sin(angle) * distance - 1, 2, 2);
        }
      }
      ctx.restore();
    }
  }
  return Object.freeze({ trigger, intersects, confirmNeutralized: combat.confirmNeutralized,
    confirmed, update, cancel, render,
    snapshot: () => ({ bursts: bursts.map(b => ({ ...b })), armed }) });
}
