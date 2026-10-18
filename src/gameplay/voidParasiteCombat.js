import { createVoidParasite } from "./voidParasite.js";
import { movingCircleContact, parasiteImpulseTarget } from "./voidParasiteCollisions.js";
import { createAstralImpulse } from "./astralImpulse.js";
import { createAstralImpulseCombat } from "./astralImpulseCombat.js";
import { createImpulsePresentation } from "./impulsePresentation.js";
import { createNyrScore } from "./nyrScore.js";
import { createNyrStability } from "./nyrStability.js";

let serial = 0;
// Isolated owner only: no normal mode imports this module. This update owns the
// single impulse advance; hooks probe its unchanged sweep for every FSM portion.
export function createVoidParasiteCombat({ parasiteOptions = {}, energy = createAstralImpulse(),
  score = createNyrScore(), stability = createNyrStability(), readHead = null,
  readState = () => ({ active: true }), canTakeDamage = () => true,
  audio = { play() {} }, onScore = () => {}, onGameOver = () => {} } = {}) {
  const owner = ++serial;
  let ended = false, frameAllowed = true, lastHead = { x: 0, y: 0 }, candidate = null, parasite;
  const state = () => { const current = readState(); return { ...current, active: !ended && frameAllowed && current.active === true }; };
  const combat = createAstralImpulseCombat({ energy, readHead: readHead ?? (() => lastHead), readState: state,
    onNeutralized(amount, id) {
      const value = amount === 75 ? score.awardNeutralizedParasite() : score.awardNeutralizedDanger();
      presentation.confirmed(id, amount);
      onScore(value, Object.freeze({ amount, id }));
    }
  });
  const presentation = createImpulsePresentation({ combat, audio });
  parasite = createVoidParasite({ ...parasiteOptions,
    detectContact(portion) {
      const fraction = movingCircleContact(portion.headFrom, portion.headTo, portion.from, portion.to, 17 + parasite.snapshot().radius);
      return fraction === null ? null : { fraction };
    },
    detectNeutralization(portion) {
      candidate = parasiteImpulseTarget(portion, `parasite:${owner}:${portion.generation}`, parasite.snapshot().radius);
      if (!candidate) return null;
      const time = combat.firstIntersection(candidate);
      return time === null ? null : { fraction: Math.max(0, Math.min(1, (time - portion.activeFrom) / (portion.activeTo - portion.activeFrom))) };
    },
    onContact(event) {
      if (!state().active || event.protected || !canTakeDamage(event)) return;
      const before = stability.snapshot().stability;
      // The historical stability operation applies only 20 numeric damage and
      // its standard before/after callback; no corruption entity/effect is used.
      const after = stability.applyCorruptionContact().stability;
      if (after < before) parasite.noteDamage();
      if (before > 0 && after === 0 && !ended) {
        ended = true; parasite.interrupt("game-over"); presentation.cancel();
        onGameOver(Object.freeze({ cause: "void-parasite", stability: 0 }));
      }
    },
    onNeutralized(event) {
      // The FSM has already removed the actor before any confirmation or score.
      if (parasite.snapshot().phase !== "destroyed" || !candidate) return;
      const target = { ...candidate, impactPosition: event.position };
      if (presentation.intersects(target)) presentation.confirmNeutralized(target.id);
      candidate = null;
    }
  });
  function update(delta, frame = {}) {
    if (ended) return parasite.snapshot();
    if (!Number.isFinite(delta) || delta <= 0 || !frame.head || !Number.isFinite(frame.head.x) || !Number.isFinite(frame.head.y)) return parasite.snapshot();
    const dt = Math.min(0.05, delta), current = readState();
    frameAllowed = frame.active !== false && current.active === true && !current.transitioning;
    lastHead = { ...frame.head }; candidate = null;
    combat.update(dt);
    presentation.update(frameAllowed ? dt : 0);
    return parasite.update(dt, { ...frame, active: frameAllowed });
  }
  function interrupt(reason) {
    parasite.interrupt(reason); candidate = null; frameAllowed = false;
    if (reason !== "pause") presentation.cancel();
    if (reason === "game-over" || reason === "session-end") ended = true;
  }
  return Object.freeze({ update, interrupt, trigger: presentation.trigger, parasite, combat, presentation, energy, score, stability,
    snapshot: () => Object.freeze({ parasite: parasite.snapshot(), impulse: combat.snapshot(), score: score.snapshot(), stability: stability.snapshot(), ended }) });
}
