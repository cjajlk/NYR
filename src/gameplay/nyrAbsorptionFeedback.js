import { NYR_FORMS } from "./nyrProgression.js";

export const NYR_ABSORPTION_FEEDBACK_CONFIG = Object.freeze({
  // Réglages visuels provisoires PACK 10 — non canoniques et non finaux.
  durationSeconds: 0.36,
  startRadiusPixels: 7,
  endRadiusPixels: 25,
  eclatAlpha: 0.46,
  spectreAlpha: 0.72,
  nocturneAlpha: 0.9,
  nocturneLineWidthPixels: 3,
  eclatLineWidthPixels: 1.6,
  spectreLineWidthPixels: 2.3
});

export function createNyrAbsorptionFeedback(config = NYR_ABSORPTION_FEEDBACK_CONFIG) {
  const state = {
    active: false,
    elapsedSeconds: 0,
    form: NYR_FORMS.ECLAT,
    triggerCount: 0
  };

  function trigger(form = NYR_FORMS.ECLAT) {
    state.active = true;
    state.elapsedSeconds = 0;
    state.form = Object.values(NYR_FORMS).includes(form) ? form : NYR_FORMS.ECLAT;
    state.triggerCount += 1;
    return snapshot();
  }

  function update(deltaSeconds) {
    if (!state.active) return;
    const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    state.elapsedSeconds = Math.min(config.durationSeconds, state.elapsedSeconds + safeDelta);
    if (state.elapsedSeconds >= config.durationSeconds) state.active = false;
  }

  function snapshot() {
    return Object.freeze({
      active: state.active,
      elapsedSeconds: state.elapsedSeconds,
      durationSeconds: config.durationSeconds,
      progress: Math.min(1, state.elapsedSeconds / config.durationSeconds),
      form: state.form,
      triggerCount: state.triggerCount
    });
  }

  return Object.freeze({ trigger, update, snapshot });
}
