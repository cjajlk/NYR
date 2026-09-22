import { MOBILE_ASTEROID_CONFIG } from "./mobileAsteroidSystem.js";

const ASTEROID_SHAPE = Object.freeze([1, 0.82, 1.08, 0.76, 1.02, 0.88, 1.1, 0.79, 0.96, 0.84]);

export function renderMobileAsteroid(context, asteroid, config = MOBILE_ASTEROID_CONFIG) {
  if (!asteroid.active) return false;

  context.save();
  context.translate(asteroid.x, asteroid.y);
  context.shadowColor = "rgba(116, 105, 255, 0.72)";
  context.shadowBlur = 9;
  context.beginPath();

  ASTEROID_SHAPE.forEach((scale, index) => {
    const angle = index / ASTEROID_SHAPE.length * Math.PI * 2;
    const radius = config.radiusPixels * scale;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.fillStyle = "#171526";
  context.strokeStyle = "rgba(105, 220, 255, 0.68)";
  context.lineWidth = 1.6;
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.fillStyle = "rgba(80, 63, 125, 0.38)";
  context.beginPath();
  context.arc(-config.radiusPixels * 0.25, -config.radiusPixels * 0.18, config.radiusPixels * 0.25, 0, Math.PI * 2);
  context.fill();
  context.restore();
  return true;
}
