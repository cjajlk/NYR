import { NYR_PROTOTYPE_CONFIG } from "./nyrPrototypeConfig.js";
import { NYR_FORMS } from "./nyrProgression.js";
import { NYR_ABSORPTION_FEEDBACK_CONFIG } from "./nyrAbsorptionFeedback.js";

export const NYR_BODY_VISUAL_CONFIG = Object.freeze({
  // Réglages visuels provisoires PACK 9 — non canoniques et non finaux.
  segmentLengthRadius: 6.2,
  segmentWidthRadius: 5,
  tailLengthPixels: 10,
  tailWidthPixels: 3.4,
  eclatEnergyAlpha: 0.24,
  spectreEnergyAlpha: 0.58
});

function findTrailPose(trail, targetDistance) {
  if (!trail.length) return { x: 0, y: 0, angle: 0 };
  let travelled = 0;

  for (let index = 1; index < trail.length; index += 1) {
    const previous = trail[index - 1];
    const current = trail[index];
    const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
    if (travelled + distance >= targetDistance && distance > 0) {
      const progress = (targetDistance - travelled) / distance;
      return {
        x: previous.x + (current.x - previous.x) * progress,
        y: previous.y + (current.y - previous.y) * progress,
        angle: Math.atan2(current.y - previous.y, current.x - previous.x)
      };
    }
    travelled += distance;
  }

  const last = trail[trail.length - 1];
  const beforeLast = trail[Math.max(0, trail.length - 2)];
  return {
    x: last.x,
    y: last.y,
    angle: Math.atan2(last.y - beforeLast.y, last.x - beforeLast.x)
  };
}

function drawEnergyLinks(context, head, poses, isSpectre, visualConfig) {
  const points = [head, ...poses];
  context.save();
  context.strokeStyle = isSpectre
    ? `rgba(102, 224, 255, ${visualConfig.spectreEnergyAlpha})`
    : `rgba(119, 111, 220, ${visualConfig.eclatEnergyAlpha})`;
  context.lineWidth = isSpectre ? 2.2 : 1.3;
  context.shadowColor = isSpectre ? "#62dfff" : "#7652ff";
  context.shadowBlur = isSpectre ? 9 : 3;

  for (let index = 1; index < points.length; index += 1) {
    if (!isSpectre && index % 2 === 0) continue;
    context.beginPath();
    context.moveTo(points[index - 1].x, points[index - 1].y);
    context.lineTo(points[index].x, points[index].y);
    context.stroke();
  }
  context.restore();
}

function drawOrganicSegment(context, pose, lengthRadius, widthRadius, alpha, isSpectre) {
  context.save();
  context.translate(pose.x, pose.y);
  context.rotate(pose.angle);
  context.shadowColor = isSpectre ? "#62dfff" : "#7652ff";
  context.shadowBlur = isSpectre ? 7 : 2;
  context.beginPath();
  context.ellipse(0, 0, lengthRadius, widthRadius, 0, 0, Math.PI * 2);
  context.fillStyle = `rgba(83, 54, 151, ${alpha})`;
  context.fill();
  context.strokeStyle = `rgba(102, 218, 255, ${alpha * 0.7})`;
  context.lineWidth = 1.5;
  context.stroke();

  if (isSpectre) {
    context.beginPath();
    context.moveTo(-lengthRadius * 0.64, 0);
    context.lineTo(lengthRadius * 0.64, 0);
    context.strokeStyle = `rgba(127, 235, 255, ${Math.max(0.35, alpha)})`;
    context.lineWidth = 1.2;
    context.stroke();
  }
  context.restore();
}

function drawTail(context, pose, alpha, isSpectre, visualConfig) {
  const cos = Math.cos(pose.angle);
  const sin = Math.sin(pose.angle);
  const halfWidth = visualConfig.tailWidthPixels;
  const halfLength = visualConfig.tailLengthPixels * 0.5;
  const centerX = pose.x;
  const centerY = pose.y;

  context.save();
  context.shadowColor = isSpectre ? "#62dfff" : "#7652ff";
  context.shadowBlur = isSpectre ? 8 : 3;
  context.beginPath();
  context.moveTo(centerX + cos * halfLength, centerY + sin * halfLength);
  context.lineTo(centerX - sin * halfWidth, centerY + cos * halfWidth);
  context.lineTo(centerX - cos * halfLength, centerY - sin * halfLength);
  context.lineTo(centerX + sin * halfWidth, centerY - cos * halfWidth);
  context.closePath();
  context.fillStyle = `rgba(69, 43, 132, ${alpha})`;
  context.fill();
  context.strokeStyle = isSpectre
    ? `rgba(127, 235, 255, ${Math.max(0.4, alpha)})`
    : `rgba(102, 218, 255, ${alpha * 0.65})`;
  context.lineWidth = 1.2;
  context.stroke();
  context.restore();
}

function drawAbsorptionFeedback(context, tailPose, feedback, feedbackConfig) {
  if (!feedback?.active || !tailPose) return;

  const progress = Math.max(0, Math.min(1, feedback.progress));
  const remaining = 1 - progress;
  const isSpectre = feedback.form === NYR_FORMS.SPECTRE;
  const radius = feedbackConfig.startRadiusPixels +
    (feedbackConfig.endRadiusPixels - feedbackConfig.startRadiusPixels) * progress;
  const alpha = (isSpectre ? feedbackConfig.spectreAlpha : feedbackConfig.eclatAlpha) *
    remaining * remaining;

  context.save();
  context.shadowColor = isSpectre ? "#69e5ff" : "#8467ff";
  context.shadowBlur = isSpectre ? 16 : 9;
  context.strokeStyle = isSpectre
    ? `rgba(116, 235, 255, ${alpha})`
    : `rgba(143, 118, 255, ${alpha})`;
  context.lineWidth = isSpectre
    ? feedbackConfig.spectreLineWidthPixels
    : feedbackConfig.eclatLineWidthPixels;
  context.beginPath();
  context.arc(tailPose.x, tailPose.y, radius, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = isSpectre
    ? `rgba(105, 229, 255, ${alpha * 0.28})`
    : `rgba(132, 103, 255, ${alpha * 0.22})`;
  context.beginPath();
  context.arc(tailPose.x, tailPose.y, radius * 0.48, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawEclatHead(context) {
  context.shadowColor = "#7652ff";
  context.shadowBlur = 15;
  context.fillStyle = "#171128";
  context.strokeStyle = "#70dcff";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.shadowBlur = 4;
  context.fillStyle = "#5d3fa8";
  context.beginPath();
  context.moveTo(-8, -10);
  context.lineTo(-3, -20);
  context.lineTo(2, -11);
  context.moveTo(-8, 10);
  context.lineTo(-3, 20);
  context.lineTo(2, 11);
  context.fill();
}

function drawSpectreHead(context) {
  context.shadowColor = "#69ddff";
  context.shadowBlur = 22;
  context.strokeStyle = "#86ecff";
  context.lineWidth = 2.4;
  context.beginPath();
  context.ellipse(-2, 0, 22, 12.5, 0, 0, Math.PI * 2);
  context.fillStyle = "#151025";
  context.fill();
  context.stroke();

  context.shadowBlur = 8;
  for (const side of [-1, 1]) {
    context.fillStyle = "#6848b6";
    context.beginPath();
    context.moveTo(-10, side * 9);
    context.lineTo(-8, side * 25);
    context.lineTo(1, side * 11);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(-3, side * 10);
    context.lineTo(-15, side * 18);
    context.lineTo(-13, side * 7);
    context.closePath();
    context.fillStyle = "rgba(91, 101, 190, 0.9)";
    context.fill();
  }

  context.beginPath();
  context.moveTo(-15, 0);
  context.lineTo(12, 0);
  context.strokeStyle = "rgba(117, 230, 255, 0.72)";
  context.lineWidth = 1.4;
  context.stroke();
}

export function renderNyr(
  context,
  state,
  progression,
  absorptionFeedback = null,
  config = NYR_PROTOTYPE_CONFIG,
  visualConfig = NYR_BODY_VISUAL_CONFIG,
  feedbackConfig = NYR_ABSORPTION_FEEDBACK_CONFIG
) {
  const isSpectre = progression.currentForm === NYR_FORMS.SPECTRE;
  const poses = Array.from({ length: state.segmentCount }, (_, index) =>
    findTrailPose(state.trail, (index + 1) * config.segmentSpacingPixels)
  );

  drawEnergyLinks(context, state, poses, isSpectre, visualConfig);
  drawAbsorptionFeedback(context, poses.at(-1), absorptionFeedback, feedbackConfig);

  for (let index = poses.length - 1; index >= 0; index -= 1) {
    const tailProgress = index / Math.max(1, poses.length - 1);
    const alpha = Math.max(0.34, 0.94 - tailProgress * 0.42);
    if (index === poses.length - 1) {
      drawTail(context, poses[index], alpha, isSpectre, visualConfig);
      continue;
    }
    drawOrganicSegment(
      context,
      poses[index],
      visualConfig.segmentLengthRadius - tailProgress * 1.25,
      visualConfig.segmentWidthRadius - tailProgress * 1.8,
      alpha,
      isSpectre
    );
  }

  context.save();
  context.translate(state.x, state.y);
  context.rotate(state.heading);

  if (isSpectre) drawSpectreHead(context);
  else drawEclatHead(context);

  context.fillStyle = "#b9f5ff";
  context.shadowColor = "#65dcff";
  context.shadowBlur = 10;
  for (const eyeY of [-5, 5]) {
    context.beginPath();
    context.arc(7, eyeY, 2.7, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

export function renderNyrFormOne(context, state, config = NYR_PROTOTYPE_CONFIG) {
  renderNyr(context, state, { currentForm: NYR_FORMS.ECLAT }, null, config);
}
