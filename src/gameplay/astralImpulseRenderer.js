import { IMPULSE_DURATION } from "./astralImpulseCombat.js";

export function renderAstralImpulse(context, pulse) {
  if (!pulse.active || pulse.radius <= 0) return;
  context.save();
  context.globalAlpha = Math.max(0, 1 - pulse.elapsed / IMPULSE_DURATION);
  context.strokeStyle = "#b589ff";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "#9cfaff";
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
}
