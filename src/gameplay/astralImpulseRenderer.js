import { IMPULSE_DURATION } from "./astralImpulseCombat.js";

export function renderAstralImpulse(context, pulse, reducedMotion = false) {
  if (!pulse.active || pulse.radius <= 0) return;
  context.save();
  context.globalAlpha = Math.max(0, 1 - pulse.elapsed / IMPULSE_DURATION);
  context.strokeStyle = "#b589ff";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "#9cfaff";
  context.lineWidth = 2;
  context.stroke();
  if (!reducedMotion && pulse.elapsed < 0.1) {
    context.globalAlpha *= 0.2 * (1 - pulse.elapsed / 0.1);
    context.fillStyle = "#9cfaff";
    context.beginPath();
    context.arc(pulse.x, pulse.y, Math.min(12, pulse.radius), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
