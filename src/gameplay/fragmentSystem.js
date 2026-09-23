import { FRAGMENT_PROTOTYPE_CONFIG } from "./fragmentPrototypeConfig.js";

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function createFallbackCandidates(width, height, margin) {
  const candidates = [];
  for (let row = 1; row <= 4; row += 1) {
    for (let column = 1; column <= 6; column += 1) {
      candidates.push({
        x: margin + (width - margin * 2) * (column / 7),
        y: margin + (height - margin * 2) * (row / 5)
      });
    }
  }
  return candidates;
}

export function createFragmentSystem({
  random = Math.random,
  config = FRAGMENT_PROTOTYPE_CONFIG,
  onAbsorbed = () => {}
} = {}) {
  const fragments = [];

  function isInsideSurface(point, width, height) {
    const margin = Math.min(config.spawnMarginPixels, width * 0.2, height * 0.2);
    return point.x >= margin && point.x <= width - margin &&
      point.y >= margin && point.y <= height - margin;
  }

  function isSafe(point, head, bodyPoints, otherFragments, width, height) {
    return isInsideSurface(point, width, height) &&
      distanceBetween(point, head) >= config.minimumHeadDistancePixels &&
      bodyPoints.every((bodyPoint) => distanceBetween(point, bodyPoint) >= config.minimumBodyDistancePixels) &&
      otherFragments.every((fragment) => distanceBetween(point, fragment) >= config.minimumFragmentDistancePixels);
  }

  function fallbackPosition(head, bodyPoints, otherFragments, width, height) {
    const margin = Math.min(config.spawnMarginPixels, width * 0.2, height * 0.2);
    const candidates = createFallbackCandidates(width, height, margin);
    const safeCandidate = candidates.find((candidate) =>
      isSafe(candidate, head, bodyPoints, otherFragments, width, height)
    );
    if (safeCandidate) return safeCandidate;

    const occupied = [head, ...bodyPoints, ...otherFragments];
    return candidates.reduce((best, candidate) => {
      const clearance = Math.min(...occupied.map((point) => distanceBetween(candidate, point)));
      return clearance > best.clearance ? { point: candidate, clearance } : best;
    }, { point: candidates[0], clearance: -1 }).point;
  }

  function findSafePosition(head, bodyPoints, otherFragments, width, height) {
    const margin = Math.min(config.spawnMarginPixels, width * 0.2, height * 0.2);
    const usableWidth = Math.max(1, width - margin * 2);
    const usableHeight = Math.max(1, height - margin * 2);

    for (let attempt = 0; attempt < config.maximumSpawnAttempts; attempt += 1) {
      const candidate = {
        x: margin + random() * usableWidth,
        y: margin + random() * usableHeight
      };
      if (isSafe(candidate, head, bodyPoints, otherFragments, width, height)) return candidate;
    }

    return fallbackPosition(head, bodyPoints, otherFragments, width, height);
  }

  function bodyPointsFrom(headState) {
    return headState.trail.slice(1, 5);
  }

  function placeFragment(fragment, headState, width, height) {
    const otherFragments = fragments.filter((candidate) => candidate !== fragment);
    const position = findSafePosition(
      headState,
      bodyPointsFrom(headState),
      otherFragments,
      width,
      height
    );
    fragment.x = position.x;
    fragment.y = position.y;
  }

  function initialize(width, height, headState) {
    fragments.length = 0;
    for (let index = 0; index < config.activeCount; index += 1) {
      const fragment = { id: index + 1, x: 0, y: 0 };
      fragments.push(fragment);
      placeFragment(fragment, headState, width, height);
    }
  }

  function update(headState, width, height) {
    for (const fragment of fragments) {
      if (distanceBetween(fragment, headState) > config.absorptionRadiusPixels) continue;
      const previousPosition = { x: fragment.x, y: fragment.y };
      placeFragment(fragment, headState, width, height);
      onAbsorbed(Object.freeze({
        fragmentId: fragment.id,
        previousPosition,
        newPosition: { x: fragment.x, y: fragment.y }
      }));
    }
  }

  function revalidate(width, height, headState) {
    for (const fragment of fragments) {
      if (!isInsideSurface(fragment, width, height)) {
        placeFragment(fragment, headState, width, height);
      }
    }
  }

  function snapshot() {
    return fragments.map((fragment) => Object.freeze({ ...fragment }));
  }

  function translate(offset) {
    for (const fragment of fragments) {
      fragment.x += offset.x;
      fragment.y += offset.y;
    }
  }

  return Object.freeze({ initialize, update, revalidate, translate, snapshot });
}
