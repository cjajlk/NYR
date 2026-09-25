const MAX_DELTA_SECONDS = 0.05;

export function createGameLoop({ isActive, update, render, requestFrame = requestAnimationFrame }) {
  let previousTimestamp = null;
  let running = false;

  function frame(timestamp) {
    if (!running) return;

    if (!isActive()) {
      previousTimestamp = null;
      render();
      requestFrame(frame);
      return;
    }

    if (previousTimestamp === null) {
      previousTimestamp = timestamp;
    } else {
      const deltaSeconds = Math.min(
        MAX_DELTA_SECONDS,
        Math.max(0, (timestamp - previousTimestamp) / 1000)
      );
      previousTimestamp = timestamp;
      update(deltaSeconds);
    }

    render();
    requestFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    previousTimestamp = null;
    requestFrame(frame);
  }

  function stop() {
    running = false;
    previousTimestamp = null;
  }

  return Object.freeze({ start, stop, resetClock() { previousTimestamp = null; } });
}
