export function createImpulseDisplay({ story = false, mobile = false, ownerDocument = document } = {}) {
  const element = ownerDocument.createElement("div");
  element.className = "impulse-control";
  element.hidden = true;
  const label = ownerDocument.createElement("output");
  label.className = "impulse-energy";
  label.setAttribute("aria-label", "Énergie d'impulsion");
  const meter = ownerDocument.createElement("progress");
  meter.max = 20;
  meter.value = 0;
  meter.setAttribute("aria-label", "Charge d'impulsion");
  const button = ownerDocument.createElement("button");
  button.type = "button";
  button.className = "impulse-button";
  button.setAttribute("aria-label", "Impulsion astrale");
  button.title = "Impulsion astrale — Espace";
  const symbol = ownerDocument.createElement("span");
  symbol.className = "impulse-symbol";
  symbol.setAttribute("aria-hidden", "true");
  button.append(symbol);
  button.setAttribute("aria-keyshortcuts", "Space");
  const hint = ownerDocument.createElement("p");
  hint.className = "impulse-hint";
  hint.setAttribute("role", "status");
  hint.textContent = mobile
    ? "IMPULSION PRÊTE — Appuie sur IMPULSION pour attaquer !"
    : "IMPULSION PRÊTE — Appuie sur Espace pour attaquer !";
  hint.hidden = true;
  element.append(label, meter, button);
  let discovered = false, hintRemaining = 0;
  return Object.freeze({ element, button, hint,
    update(energy, active, available) {
      element.hidden = !active;
      label.textContent = `${energy.energy}/${energy.capacity}`;
      meter.value = energy.energy;
      button.disabled = !active || !available || !energy.ready;
      element.setAttribute("data-ready", String(energy.ready));
      if (story && active && energy.ready && !discovered) {
        discovered = true;
        hintRemaining = 4;
      }
      hint.hidden = !active || hintRemaining <= 0;
    },
    advance(delta) { hintRemaining = Math.max(0, hintRemaining - delta); }
  });
}
