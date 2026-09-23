import { FRAGMENT_PROTOTYPE_CONFIG } from "./fragmentPrototypeConfig.js";

export function renderNormalFragments(context, fragments, config = FRAGMENT_PROTOTYPE_CONFIG) {
  for (const fragment of fragments) {
    const pure = fragment.kind === "pure";
    const corrupted = fragment.kind === "corruption";
    const gradient = context.createRadialGradient(
      fragment.x,
      fragment.y,
      0,
      fragment.x,
      fragment.y,
      config.visualRadiusPixels * 2
    );
    gradient.addColorStop(0, "rgba(220, 252, 255, 1)");
    gradient.addColorStop(0.35, corrupted ? "rgba(255, 65, 150, 0.95)" : pure ? "rgba(145, 255, 190, 0.95)" : "rgba(93, 218, 255, 0.95)");
    gradient.addColorStop(1, "rgba(116, 65, 220, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(fragment.x, fragment.y, config.visualRadiusPixels * 2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = corrupted ? "#fb559b" : pure ? "#dcffe8" : "#bdf8ff";
    if (corrupted) {
      context.beginPath();
      for (let point = 0; point < 8; point++) {
        const angle = point * Math.PI / 4;
        const radius = config.visualRadiusPixels * (point % 2 ? 0.6 : 1.6);
        const x = fragment.x + Math.cos(angle) * radius;
        const y = fragment.y + Math.sin(angle) * radius;
        if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      continue;
    }
    if (pure) {
      context.save();
      context.strokeStyle = "#a0ffc4";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(fragment.x, fragment.y, config.visualRadiusPixels * 1.4, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    context.beginPath();
    context.moveTo(fragment.x, fragment.y - config.visualRadiusPixels);
    context.lineTo(fragment.x + config.visualRadiusPixels * 0.65, fragment.y);
    context.lineTo(fragment.x, fragment.y + config.visualRadiusPixels);
    context.lineTo(fragment.x - config.visualRadiusPixels * 0.65, fragment.y);
    context.closePath();
    context.fill();
  }
}
