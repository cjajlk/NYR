import { NYR_PROTOTYPE_CONFIG } from "./nyrPrototypeConfig.js";

const FULL_TURN = Math.PI * 2;

function normalizeAngle(angle) {
  return ((angle + Math.PI) % FULL_TURN + FULL_TURN) % FULL_TURN - Math.PI;
}

export function shortestAngleDelta(from, to) {
  return normalizeAngle(to - from);
}

export function createNyrMovement(config = NYR_PROTOTYPE_CONFIG) {
  const state = {
    x: 0,
    y: 0,
    heading: 0,
    desiredHeading: 0,
    simulationTime: 0,
    segmentCount: config.initialSegmentCount,
    trailSamples: [],
    distanceSinceTrailSample: 0
  };

  function reset(width, height) {
    state.x = width * 0.38;
    state.y = height * 0.5;
    state.heading = 0;
    state.desiredHeading = 0;
    state.simulationTime = 0;
    state.segmentCount = config.initialSegmentCount;
    state.trailSamples = [{ x: state.x, y: state.y }];
    state.distanceSinceTrailSample = 0;
  }

  function aimAt(x, y) {
    const deltaX = x - state.x;
    const deltaY = y - state.y;
    if (Math.hypot(deltaX, deltaY) < 1) return;
    state.desiredHeading = Math.atan2(deltaY, deltaX);
  }

  function holdCurrentHeading() {
    state.desiredHeading = state.heading;
  }

  function fitViewport(width, height) {
    const marginX = Math.min(24, width / 2);
    const marginY = Math.min(24, height / 2);
    const x = Math.min(width - marginX, Math.max(marginX, state.x)) - state.x;
    const y = Math.min(height - marginY, Math.max(marginY, state.y)) - state.y;
    state.x += x;
    state.y += y;
    for (const point of state.trailSamples) {
      point.x += x;
      point.y += y;
    }
    return Object.freeze({ x, y });
  }

  function keepPrototypeObservable(width, height, previousX, previousY) {
    const margin = config.safetyMarginPixels;
    // Only crossing an edge by movement triggers this technical fallback.
    // A smaller viewport may leave the head outside without moving it.
    const outside = (state.x < -margin && previousX >= -margin) ||
      (state.x > width + margin && previousX <= width + margin) ||
      (state.y < -margin && previousY >= -margin) ||
      (state.y > height + margin && previousY <= height + margin);

    if (outside) {
      // Sécurité technique provisoire : recentrage, sans règle de bord canonique.
      const elapsed = state.simulationTime;
      const segmentCount = state.segmentCount;
      reset(width, height);
      state.simulationTime = elapsed;
      state.segmentCount = segmentCount;
    }
  }

  function addSegments(count = 1) {
    const amount = Math.max(0, Math.trunc(count));
    state.segmentCount += amount;
    return state.segmentCount;
  }

  function recordTrail(previousX, previousY) {
    const deltaX = state.x - previousX;
    const deltaY = state.y - previousY;
    const stepDistance = Math.hypot(deltaX, deltaY);
    if (stepDistance <= 0) return;

    const spacing = config.trailSampleSpacingPixels;
    let distanceAlongStep = spacing - state.distanceSinceTrailSample;

    while (distanceAlongStep <= stepDistance) {
      const progress = distanceAlongStep / stepDistance;
      state.trailSamples.unshift({
        x: previousX + deltaX * progress,
        y: previousY + deltaY * progress
      });
      distanceAlongStep += spacing;
    }

    state.distanceSinceTrailSample =
      (state.distanceSinceTrailSample + stepDistance) % spacing;
  }

  function trimTrail() {
    const requiredDistance =
      state.segmentCount * config.segmentSpacingPixels + config.trailSafetyMarginPixels;
    let travelled = 0;
    let keepCount = state.trailSamples.length;

    for (let index = 1; index < state.trailSamples.length; index += 1) {
      const previous = state.trailSamples[index - 1];
      const current = state.trailSamples[index];
      travelled += Math.hypot(current.x - previous.x, current.y - previous.y);
      if (travelled >= requiredDistance) {
        keepCount = index + 1;
        break;
      }
    }

    if (keepCount < state.trailSamples.length) state.trailSamples.length = keepCount;
  }

  function update(deltaSeconds, width, height) {
    const previousX = state.x;
    const previousY = state.y;
    const maxTurn = config.turnRadiansPerSecond * deltaSeconds;
    const turnDelta = shortestAngleDelta(state.heading, state.desiredHeading);
    state.heading = normalizeAngle(
      state.heading + Math.max(-maxTurn, Math.min(maxTurn, turnDelta))
    );

    state.x += Math.cos(state.heading) * config.speedPixelsPerSecond * deltaSeconds;
    state.y += Math.sin(state.heading) * config.speedPixelsPerSecond * deltaSeconds;
    state.simulationTime += deltaSeconds;
    recordTrail(previousX, previousY);
    trimTrail();
    keepPrototypeObservable(width, height, previousX, previousY);
  }

  function snapshot() {
    return Object.freeze({
      x: state.x,
      y: state.y,
      heading: state.heading,
      desiredHeading: state.desiredHeading,
      simulationTime: state.simulationTime,
      segmentCount: state.segmentCount,
      trail: [
        { x: state.x, y: state.y },
        ...state.trailSamples.map((point) => ({ ...point }))
      ]
    });
  }

  return Object.freeze({ reset, aimAt, holdCurrentHeading, fitViewport, addSegments, update, snapshot });
}
