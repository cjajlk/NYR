export function needsLandscape({ width, height, surfaceWidth = width, surfaceHeight = height,
  navigator = globalThis.navigator, matchMedia = globalThis.matchMedia } = {}) {
  const desktop = /Windows|X11|Linux x86_64/i.test(navigator?.userAgent ?? "");
  const mobile = navigator?.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator?.userAgent ?? "") ||
    (navigator?.maxTouchPoints > 1 && navigator?.platform === "MacIntel") ||
    (!desktop && navigator?.maxTouchPoints > 0 && Boolean(matchMedia?.("(pointer: coarse)")?.matches));
  return mobile && (height > width || surfaceHeight > surfaceWidth);
}
