const MAX_DEVICE_PIXEL_RATIO = 3;

export function drawTechnicalMarker(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#090817");
  gradient.addColorStop(0.55, "#17102d");
  gradient.addColorStop(1, "#071724");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(124, 91, 213, 0.22)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(width / 2, height * 0.12);
  context.lineTo(width / 2, height * 0.88);
  context.moveTo(width * 0.12, height / 2);
  context.lineTo(width * 0.88, height / 2);
  context.stroke();
}

export function createDisplayManager(canvas, container, environment = window) {
  const context = canvas.getContext("2d");

  function resize() {
    const bounds = container.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(bounds.width));
    const cssHeight = Math.max(1, Math.round(bounds.height));
    const pixelRatio = Math.min(
      MAX_DEVICE_PIXEL_RATIO,
      Math.max(1, environment.devicePixelRatio || 1)
    );

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawTechnicalMarker(context, cssWidth, cssHeight);

    return Object.freeze({ cssWidth, cssHeight, pixelRatio });
  }

  return Object.freeze({ resize, context });
}
