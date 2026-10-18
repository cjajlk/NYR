import { isRuntimeActive, onRuntimeStateChange } from "../core/runtimeState.js";

export function createPointerInput(canvas, movement) {
  let activeTouchPointerId = null;
  function reset() {
    if (activeTouchPointerId === null) return;
    const id = activeTouchPointerId;
    activeTouchPointerId = null;
    if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    movement.holdCurrentHeading();
  }
  const unsubscribe = onRuntimeStateChange(state => { if (!state.active) reset(); });

  function aimFromEvent(event) {
    if (!isRuntimeActive()) return;
    const bounds = canvas.getBoundingClientRect();
    movement.aimAt(event.clientX - bounds.left, event.clientY - bounds.top);
  }

  function onPointerMove(event) {
    if (event.pointerType === "mouse") {
      aimFromEvent(event);
      return;
    }

    if (event.pointerId === activeTouchPointerId) {
      event.preventDefault();
      aimFromEvent(event);
    }
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" || !isRuntimeActive() || activeTouchPointerId !== null) return;
    activeTouchPointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    aimFromEvent(event);
  }

  function onPointerEnd(event) {
    if (event.pointerId !== activeTouchPointerId) return;
    reset();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);

  return Object.freeze({
    reset,
    destroy() {
      reset();
      unsubscribe();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
    }
  });
}
