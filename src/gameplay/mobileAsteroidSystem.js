import { NYR_ZONES } from "./nyrZoneProgression.js";

export const MOBILE_ASTEROID_CONFIG = Object.freeze({
  // Réglages provisoires du PACK 21 — rendu et équilibrage non finaux.
  speedPixelsPerSecond: 42,
  radiusPixels: 24,
  spawnMarginPixels: 36,
  headCollisionRadiusPixels: 17,
  minimumHeadSpawnDistancePixels: 120,
  minimumFragmentSpawnDistancePixels: 64,
  maximumSpawnAttempts: 16
});

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function isFullyOutside(state, width, height) {
  return state.x + state.radius < 0 || state.x - state.radius > width ||
    state.y + state.radius < 0 || state.y - state.radius > height;
}

function intersectsSurface(state, width, height) {
  return state.x + state.radius >= 0 && state.x - state.radius <= width &&
    state.y + state.radius >= 0 && state.y - state.radius <= height;
}

export function createMobileAsteroidSystem({
  random = Math.random,
  config = MOBILE_ASTEROID_CONFIG,
  onHeadContactStarted = () => {}
} = {}) {
  const state = {
    active: false,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    radius: config.radiusPixels,
    hasEnteredSurface: false,
    headContact: false,
    previousSpawnEdge: -1
  };

  function createSpawnCandidate(edge, width, height) {
    const offset = state.radius + config.spawnMarginPixels;
    const horizontalRange = Math.max(1, width - state.radius * 2);
    const verticalRange = Math.max(1, height - state.radius * 2);
    const lateralAngle = (random() - 0.5) * 0.5;
    const alongX = state.radius + random() * horizontalRange;
    const alongY = state.radius + random() * verticalRange;
    const direction = [0, Math.PI, Math.PI * 0.5, -Math.PI * 0.5][edge] + lateralAngle;

    if (edge === 0) {
      return { edge, x: -offset, y: alongY, direction };
    }
    if (edge === 1) {
      return { edge, x: width + offset, y: alongY, direction };
    }
    if (edge === 2) {
      return { edge, x: alongX, y: -offset, direction };
    }
    return { edge, x: alongX, y: height + offset, direction };
  }

  function candidateClearance(candidate, headState, fragments) {
    const headClearance = distanceBetween(candidate, headState) -
      config.minimumHeadSpawnDistancePixels;
    const fragmentClearance = fragments.length
      ? Math.min(...fragments.map((fragment) => distanceBetween(candidate, fragment))) -
        config.minimumFragmentSpawnDistancePixels
      : Number.POSITIVE_INFINITY;
    return Math.min(headClearance, fragmentClearance);
  }

  function spawn(width, height, headState, fragments = []) {
    let best = null;
    for (let attempt = 0; attempt < config.maximumSpawnAttempts; attempt += 1) {
      let edge = Math.floor(random() * 4) % 4;
      if (edge === state.previousSpawnEdge) edge = (edge + 1) % 4;
      const candidate = createSpawnCandidate(edge, width, height);
      const clearance = candidateClearance(candidate, headState, fragments);
      if (!best || clearance > best.clearance) best = { candidate, clearance };
      if (clearance >= 0) break;
    }

    const selected = best.candidate;
    state.x = selected.x;
    state.y = selected.y;
    state.velocityX = Math.cos(selected.direction) * config.speedPixelsPerSecond;
    state.velocityY = Math.sin(selected.direction) * config.speedPixelsPerSecond;
    state.hasEnteredSurface = false;
    state.headContact = false;
    state.previousSpawnEdge = selected.edge;
  }

  function syncZone(zoneSnapshot, width, height, headState, fragments = []) {
    if (state.active || ![NYR_ZONES.ZONE_2, NYR_ZONES.ZONE_3, NYR_ZONES.ZONE_4].includes(zoneSnapshot?.currentZone)) return snapshot();
    state.active = true;
    spawn(width, height, headState, fragments);
    return snapshot();
  }

  function update(deltaSeconds, width, height, headState, fragments = []) {
    if (!state.active) return snapshot();

    const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    state.x += state.velocityX * safeDelta;
    state.y += state.velocityY * safeDelta;

    if (intersectsSurface(state, width, height)) state.hasEnteredSurface = true;
    if (state.hasEnteredSurface && isFullyOutside(state, width, height)) {
      spawn(width, height, headState, fragments);
      return snapshot();
    }

    const touchingHead = distanceBetween(state, headState) <=
      state.radius + config.headCollisionRadiusPixels;
    if (touchingHead && !state.headContact) {
      state.headContact = true;
      onHeadContactStarted(Object.freeze({
        asteroid: Object.freeze({ x: state.x, y: state.y, radius: state.radius }),
        head: Object.freeze({ x: headState.x, y: headState.y })
      }));
    } else if (!touchingHead) {
      state.headContact = false;
    }

    return snapshot();
  }

  function revalidate(width, height, headState, fragments = []) {
    if (state.active && state.hasEnteredSurface && isFullyOutside(state, width, height)) {
      spawn(width, height, headState, fragments);
    }
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({
      active: state.active,
      x: state.x,
      y: state.y,
      velocityX: state.velocityX,
      velocityY: state.velocityY,
      radius: state.radius,
      headContact: state.headContact
    });
  }

  function translate(offset) {
    if (!state.active) return;
    state.x += offset.x;
    state.y += offset.y;
  }

  return Object.freeze({ syncZone, update, revalidate, translate, snapshot });
}
