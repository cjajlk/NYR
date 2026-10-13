export function createOrientationOverlay() {
  const element = document.createElement("aside");
  element.className = "orientation-overlay";
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");

  const illustration = document.createElement("img");
  illustration.src = new URL("../../assets/images/ui/rotate-phone.svg", import.meta.url).href;
  illustration.alt = "Un téléphone tourne du portrait vers le paysage";
  illustration.className = "orientation-illustration";
  illustration.width = 240; illustration.height = 180;
  const title = document.createElement("h1");
  title.className = "orientation-title";
  title.textContent = "TOURNEZ VOTRE TÉLÉPHONE";
  const message = document.createElement("p");
  message.className = "orientation-message";
  message.textContent = "NYR se joue en mode paysage.";
  const panel = document.createElement("div");
  panel.className = "orientation-panel";
  panel.append(illustration, title, message);
  element.append(panel);

  function setVisible(visible) {
    element.hidden = !visible;
    element.setAttribute("aria-hidden", String(!visible));
  }

  setVisible(false);
  return Object.freeze({ element, setVisible });
}
