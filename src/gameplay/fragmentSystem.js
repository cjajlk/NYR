import { FRAGMENT_PROTOTYPE_CONFIG } from "./fragmentPrototypeConfig.js";
import { NYR_ZONES } from "./nyrZoneProgression.js";
export const CORRUPTION_MOTION = Object.freeze({ amplitudeX: 40, amplitudeY: 20, period: 4 });
export const PURE_FRAGMENT_INTERVAL = 10;
export const CORRUPTION_CONFIG = Object.freeze({ firstAbsorption: 35, interval: 10 });

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
  onAbsorbed = () => {},
  onPureAbsorbed = null,
  onCorruptionContact = null,
  getCurrentZone = () => null
} = {}) {
  const fragments = [];
  let pureFragment = null;
  let normalAbsorptions = 0;
  let corruption = null;

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
    const otherFragments = [...fragments, ...(pureFragment ? [pureFragment] : []), ...(corruption ? [corruption] : [])]
      .filter((candidate) => candidate !== fragment);
    const position = (fragment.kind ? fallbackPosition : findSafePosition)(
      headState,
      bodyPointsFrom(headState),
      otherFragments,
      width,
      height
    );
    fragment.x = position.x;
    fragment.y = position.y;
    if (fragment.kind === "corruption") {
      fragment.anchorX = position.x;
      fragment.anchorY = position.y;
      fragment.motionTime = 0;
    }
  }

  function initialize(width, height, headState) {
    fragments.length = 0;
    pureFragment = null;
    normalAbsorptions = 0;
    corruption = null;
    for (let index = 0; index < config.activeCount; index += 1) {
      const fragment = { id: index + 1, x: 0, y: 0 };
      fragments.push(fragment);
      placeFragment(fragment, headState, width, height);
    }
  }

  function advanceCorruption(delta, width, height) {
    if (!corruption || !Number.isFinite(delta) || delta <= 0) return;
    const margin = Math.min(config.spawnMarginPixels, width * 0.2, height * 0.2);
    const amplitudeX = Math.max(0, Math.min(CORRUPTION_MOTION.amplitudeX,
      corruption.anchorX - margin, width - margin - corruption.anchorX));
    const amplitudeY = Math.max(0, Math.min(CORRUPTION_MOTION.amplitudeY,
      corruption.anchorY - margin, height - margin - corruption.anchorY));
    corruption.motionTime = (corruption.motionTime + delta) % CORRUPTION_MOTION.period;
    const phase = corruption.motionTime * Math.PI * 2 / CORRUPTION_MOTION.period;
    corruption.x = corruption.anchorX + amplitudeX * Math.sin(phase);
    corruption.y = corruption.anchorY + amplitudeY * Math.sin(phase * 2);
  }

  function update(headState, width, height) {
    if (![NYR_ZONES.ZONE_2, NYR_ZONES.ZONE_3].includes(getCurrentZone())) corruption = null;
    if (corruption) {
      const touching = distanceBetween(corruption, headState) <= config.absorptionRadiusPixels;
      if (touching && !corruption.headContact) {
        corruption.headContact = true;
        if (onCorruptionContact() === false) return;
      } else if (!touching) corruption.headContact = false;
    }
    if (pureFragment && distanceBetween(pureFragment, headState) <= config.absorptionRadiusPixels) {
      pureFragment = null;
      onPureAbsorbed();
    }
    for (const fragment of fragments) {
      if (distanceBetween(fragment, headState) > config.absorptionRadiusPixels) continue;
      const previousPosition = { x: fragment.x, y: fragment.y };
      placeFragment(fragment, headState, width, height);
      onAbsorbed(Object.freeze({
        fragmentId: fragment.id,
        previousPosition,
        newPosition: { x: fragment.x, y: fragment.y }
      }));
      normalAbsorptions++;
      if (onPureAbsorbed && normalAbsorptions % PURE_FRAGMENT_INTERVAL === 0) {
        pureFragment = { id: "pure", kind: "pure", x: 0, y: 0 };
        placeFragment(pureFragment, headState, width, height);
      }
      if (onCorruptionContact && [NYR_ZONES.ZONE_2, NYR_ZONES.ZONE_3].includes(getCurrentZone()) &&
          normalAbsorptions >= CORRUPTION_CONFIG.firstAbsorption &&
          (normalAbsorptions - CORRUPTION_CONFIG.firstAbsorption) % CORRUPTION_CONFIG.interval === 0) {
        corruption = { id: "corruption", kind: "corruption", generation: normalAbsorptions,
          x: 0, y: 0, headContact: false };
        placeFragment(corruption, headState, width, height);
      }
    }
  }

  function revalidate(width, height, headState) {
    for (const fragment of [...fragments, ...(pureFragment ? [pureFragment] : []), ...(corruption ? [corruption] : [])]) {
      if (!isInsideSurface(fragment, width, height) ||
          (fragment.kind === "corruption" && !isInsideSurface({ x: fragment.anchorX, y: fragment.anchorY }, width, height))) {
        placeFragment(fragment, headState, width, height);
      }
    }
  }

  function snapshot() {
    return [...fragments, ...(pureFragment ? [pureFragment] : []), ...(corruption ? [corruption] : [])]
      .map((fragment) => Object.freeze({ ...fragment }));
  }

  function translate(offset) {
    for (const fragment of fragments) {
      fragment.x += offset.x;
      fragment.y += offset.y;
    }
    if (pureFragment) {
      pureFragment.x += offset.x;
      pureFragment.y += offset.y;
    }
    if (corruption) {
      corruption.x += offset.x;
      corruption.y += offset.y;
      corruption.anchorX += offset.x;
      corruption.anchorY += offset.y;
    }
  }

  return Object.freeze({ initialize, update, advanceCorruption, revalidate, translate, snapshot });
}
