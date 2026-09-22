export function createOrientationOverlay() {
  const element = document.createElement("aside");
  element.className = "orientation-overlay";
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");

  const message = document.createElement("p");
  message.className = "orientation-message";
  message.textContent = "Tournez votre appareil pour continuer en mode paysage.";
  element.append(message);

  function setVisible(visible) {
    element.hidden = !visible;
    element.setAttribute("aria-hidden", String(!visible));
  }

  setVisible(false);
  return Object.freeze({ element, setVisible });
}
