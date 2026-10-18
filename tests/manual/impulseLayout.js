/* Run on an active game page, including a mobile viewport in browser tools. */
export function verifyImpulseLayout(ownerDocument = document) {
  const button = ownerDocument.querySelector(".impulse-button");
  const symbol = ownerDocument.querySelector(".impulse-symbol");
  const control = ownerDocument.querySelector(".impulse-control");
  if (!button || control.hidden) throw Error("An active gameplay HUD is required");
  const target = button.getBoundingClientRect(), visual = symbol.getBoundingClientRect();
  const group = control.getBoundingClientRect(), viewport = ownerDocument.defaultView;
  const fail = message => { throw Error(message); };
  if (target.width < 48 || target.height < 48) fail("Touch target below 48 px");
  if (visual.width !== 44 || visual.height !== 44) fail("Visual button differs from 44 px");
  if (group.width > 56) fail("Gauge is no longer compact");
  if (target.left < 0 || target.top < 0 || target.right > viewport.innerWidth || target.bottom > viewport.innerHeight) fail("Button outside viewport");
  if (button.getAttribute("aria-label") !== "Impulsion astrale") fail("Missing accessible name");
  for (const other of ownerDocument.querySelectorAll(".return-menu,.stability-display,.fragments-display,.score-display,.time-display,.fullscreen-control")) {
    if (!other.getClientRects().length) continue;
    const rect = other.getBoundingClientRect();
    if (group.left < rect.right && group.right > rect.left && group.top < rect.bottom && group.bottom > rect.top) fail(`HUD overlap: ${other.className}`);
  }
  return { width: viewport.innerWidth, height: viewport.innerHeight, touch: [target.width, target.height],
    visual: [visual.width, visual.height], gauge: group.width, overlap: false };
}

export function measureImpulseFrames(frameCount = 90) {
  return new Promise(resolve => {
    let previous = null;
    const intervals = [];
    function sample(now) {
      if (previous !== null) intervals.push(now - previous);
      previous = now;
      if (intervals.length < frameCount) { requestAnimationFrame(sample); return; }
      const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
      resolve({ frames: intervals.length, initialMeanMs: mean(intervals.slice(0, 30)),
        restMeanMs: mean(intervals.slice(30)), longestMs: Math.max(...intervals),
        over50Ms: intervals.filter(v => v > 50).length });
    }
    requestAnimationFrame(sample);
  });
}
