const suspensionReasons = new Set();
const listeners = new Set();

function notifyRuntimeState() {
  const state = getRuntimeState();
  listeners.forEach((listener) => listener(state));
}

export function isRuntimeActive() {
  return suspensionReasons.size === 0;
}

export function getRuntimeState() {
  return Object.freeze({
    active: isRuntimeActive(),
    suspensionReasons: Object.freeze([...suspensionReasons])
  });
}

export function suspendRuntime(reason) {
  if (!reason || suspensionReasons.has(reason)) return;
  suspensionReasons.add(reason);
  notifyRuntimeState();
}

export function resumeRuntime(reason) {
  if (!suspensionReasons.delete(reason)) return;
  notifyRuntimeState();
}

export function onRuntimeStateChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
