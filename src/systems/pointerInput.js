export function createPointerInput(canvas, movement) {
  let activeTouchPointerId = null;

  function aimFromEvent(event) {
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
    if (event.pointerType === "mouse") return;
    activeTouchPointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    aimFromEvent(event);
  }

  function onPointerEnd(event) {
    if (event.pointerId !== activeTouchPointerId) return;
    activeTouchPointerId = null;
    movement.holdCurrentHeading();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);

  return Object.freeze({
    destroy() {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
    }
  });
}
