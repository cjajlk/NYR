import { createWeeklyChallenges } from "./gameplay/weeklyChallenges.js";
import { createPauseDisplay } from "./ui/pauseDisplay.js";
import { createRunStatistics, createStatisticsStore } from "./gameplay/runStatistics.js";
import { createTimeDisplay } from "./ui/timeDisplay.js";
import { createVoidDifficulty } from "./gameplay/voidDifficulty.js";
import { NYR_PROTOTYPE_CONFIG, ZONE_THREE_SPEED_MULTIPLIER } from "./gameplay/nyrPrototypeConfig.js";
import { createZoneTwoObjective, createRelativeZoneObjective, ZONE_TWO_TARGET, ZONE_THREE_TARGET, ZONE_FOUR_TARGET } from "./gameplay/zoneTwoObjective.js";
import { createCorruptionPocket, renderCorruptionPocket } from "./gameplay/corruptionPocket.js";
import { createZoneExitPortal, renderZoneExitPortal } from "./gameplay/zoneExitPortal.js";
import { createNyrCombo } from "./gameplay/nyrCombo.js";
import { createComboDisplay } from "./ui/comboDisplay.js";
import { createReturnMenu } from "./ui/returnMenu.js";
import { createMainMenu } from "./ui/mainMenu.js";
import { APP_CONFIG } from "./core/appConfig.js";
import { createDisplayManager } from "./core/displayManager.js";
import { createGameLoop } from "./core/gameLoop.js";
import { beginNewGame, endGame as endRuntimeGame, getRuntimeState, isRuntimeActive, resumeRuntime, suspendRuntime } from "./core/runtimeState.js";
import { createZoneOneBackground } from "./core/zoneOneBackground.js";
import { createZoneBackgroundTransition } from "./core/zoneBackgroundTransition.js";
import { createFarStarsParallax } from "./core/farStarsParallax.js";
import { createMidNebulaParallax } from "./core/midNebulaParallax.js";
import { createNearParticlesParallax } from "./core/nearParticlesParallax.js";
import { createDecorativeAsteroidsParallax } from "./core/decorativeAsteroidsParallax.js";
import { createNyrMovement } from "./gameplay/nyrMovement.js";
import { createNyrProgression } from "./gameplay/nyrProgression.js";
import { createNyrScore } from "./gameplay/nyrScore.js";
import { createNyrStability } from "./gameplay/nyrStability.js";
import { createNyrZoneProgression, NYR_ZONES } from "./gameplay/nyrZoneProgression.js";
import { createMobileAsteroidSystem } from "./gameplay/mobileAsteroidSystem.js";
import { renderMobileAsteroid } from "./gameplay/mobileAsteroidRenderer.js";
import { renderNyr } from "./gameplay/nyrRenderer.js";
import { createNyrAbsorptionFeedback } from "./gameplay/nyrAbsorptionFeedback.js";
import { createFragmentSystem } from "./gameplay/fragmentSystem.js";
import { renderNormalFragments } from "./gameplay/fragmentRenderer.js";
import { createPointerInput } from "./systems/pointerInput.js";
import { createOrientationOverlay } from "./ui/orientationOverlay.js";
import { createScoreDisplay } from "./ui/scoreDisplay.js";
import { createStabilityDisplay } from "./ui/stabilityDisplay.js";
import { createFullscreenControl } from "./ui/fullscreenControl.js";

function createPreproductionScreen() {
  const screen = document.createElement("section");
  screen.className = "preproduction-screen";
  screen.setAttribute("aria-labelledby", "game-title");

  const canvas = document.createElement("canvas");
  canvas.className = "display-surface";
  canvas.setAttribute("aria-label", "Surface technique de NYR");

  const label = document.createElement("div");
  label.className = "foundation-label";

  const title = document.createElement("h1");
  title.id = "game-title";
  title.className = "game-title";
  title.textContent = APP_CONFIG.name;

  const slogan = document.createElement("p");
  slogan.className = "tagline";
  slogan.textContent = APP_CONFIG.slogan;

  const status = document.createElement("p");
  status.className = "project-status";
  status.textContent = "Préproduction — socle technique";

  label.append(title, slogan, status);
  screen.append(canvas, label);
  return { screen, canvas };
}

const app = document.querySelector("#app");
const statisticsStore = createStatisticsStore();
const weeklyChallenges = createWeeklyChallenges();
window.addEventListener("pagehide", weeklyChallenges.flush);
document.addEventListener("visibilitychange", () => { if (document.hidden) weeklyChallenges.flush(); });

function startGame() {
  const { screen, canvas } = createPreproductionScreen();
  const mainMenu = createMainMenu(replayGame, statisticsStore.snapshot, weeklyChallenges);
  const returnMenu = createReturnMenu(() => {
    if (disposed) return;
    if (getRuntimeState().gameOver) { replaceSession(true); return; }
    if (!isRuntimeActive()) return;
    suspendRuntime("user-pause");
    gameLoop.resetClock();
    observeWeekly();
    weeklyChallenges.flush();
    syncMenuDisplay();
  });
  const pauseDisplay = createPauseDisplay(() => {
    if (!canLeavePause()) return;
    resumeRuntime("user-pause");
    gameLoop.resetClock();
    requestDisplaySync();
    syncMenuDisplay();
  }, () => {
    if (!canLeavePause()) return;
    runStatistics.finish();
    replaceSession(true);
  });
  function canLeavePause() {
    const state = getRuntimeState();
    return !disposed && !state.gameOver && state.suspensionReasons.includes("user-pause") &&
      state.suspensionReasons.every(reason => reason === "user-pause");
  }
  let disposed = false;
  const orientationOverlay = createOrientationOverlay();
  const displayManager = createDisplayManager(canvas, screen);
  const zoneOneBackground = createZoneOneBackground();
  const zoneBackgroundTransition = createZoneBackgroundTransition({ zoneOneBackground });
  const farStarsParallax = createFarStarsParallax();
  const midNebulaParallax = createMidNebulaParallax();
  const nearParticlesParallax = createNearParticlesParallax();
  const decorativeAsteroidsParallax = createDecorativeAsteroidsParallax();
  const movement = createNyrMovement();
  const runStatistics = createRunStatistics(() => ({
    score: score.snapshot().points,
    activeTime: movement.snapshot().simulationTime,
    normalFragments: progression.snapshot().normalFragmentsAbsorbed,
    combo: combo.snapshot().multiplier,
    form: progression.snapshot().currentForm
  }), statisticsStore);
  const observeWeekly = weeklyChallenges.trackRun(runStatistics.snapshot);
  const stability = createNyrStability(undefined, runStatistics.damage);
  const mobileAsteroid = createMobileAsteroidSystem({
    onHeadContactStarted() {
      stability.applyAsteroidContact();
      if (stability.snapshot().stability === 0) endGame();
    }
  });
  const progression = createNyrProgression();
  const voidDifficulty = createVoidDifficulty();
  const zoneTwoObjective = createZoneTwoObjective();
  const zoneThreeObjective = createRelativeZoneObjective();
  const zoneFourObjective = createRelativeZoneObjective();
  const zoneOneObjective = createRelativeZoneObjective();
  zoneOneObjective.enter(0);
  const zoneProgression = createNyrZoneProgression({
    onZoneTwoReached(zoneState) {
      exitPortal.reset();
      zoneTwoObjective.enter(progression.snapshot().normalFragmentsAbsorbed);
      combo.reset();
      zoneBackgroundTransition.sync(zoneState);
    }
  });
  const portal = createZoneExitPortal(() => {
    const zoneState = zoneProgression.sync(progression.snapshot(), true);
    mobileAsteroid.syncZone(zoneState, displaySize.cssWidth, displaySize.cssHeight,
      movement.snapshot(), fragmentSystem.snapshot());
  });
  const exitPortal = createZoneExitPortal(() => {
    zoneThreePortal.reset();
    zoneThreeObjective.enter(progression.snapshot().normalFragmentsAbsorbed);
    combo.reset();
    zoneBackgroundTransition.sync(zoneProgression.enterZoneThree());
  }, ZONE_TWO_TARGET);
  const zoneThreePortal = createZoneExitPortal(() => {
    if (!isRuntimeActive() || zoneProgression.snapshot().currentZone !== NYR_ZONES.ZONE_3) return;
    combo.reset();
    zoneFourPortal.reset();
    zoneFourObjective.enter(progression.snapshot().normalFragmentsAbsorbed);
    voidDifficulty.enter(movement.snapshot().simulationTime);
    fragmentSystem.enterVoid();
    zoneBackgroundTransition.sync(zoneProgression.enterZoneFour());
  }, ZONE_THREE_TARGET);
  const zoneFourPortal = createZoneExitPortal(() => {
    if (!isRuntimeActive() || zoneProgression.snapshot().currentZone !== NYR_ZONES.ZONE_4) return;
    combo.reset();
    const count = progression.snapshot().normalFragmentsAbsorbed;
    zoneOneObjective.enter(count);
    portal.reset();
    zoneBackgroundTransition.sync(zoneProgression.enterZoneOne(count));
    runStatistics.cycle();
  }, ZONE_FOUR_TARGET);
  const pocket = createCorruptionPocket(() => {
    if (!isRuntimeActive()) return;
    stability.applyCorruptionContact();
    if (stability.snapshot().stability === 0) endGame();
  });
  function pocketObstacles() {
    return [...fragmentSystem.snapshot(), ...[mobileAsteroid.snapshot(), portal.snapshot(), exitPortal.snapshot(), zoneThreePortal.snapshot(), zoneFourPortal.snapshot()].filter(o => o.active)];
  }
  const combo = createNyrCombo();
  const comboDisplay = createComboDisplay();
  function endGame() {
    runStatistics.finish();
    combo.reset();
    endRuntimeGame();
  }
  const score = createNyrScore();
  const scoreDisplay = createScoreDisplay();
  const timeDisplay = createTimeDisplay();
  const fragmentsDisplay = document.createElement("output");
  fragmentsDisplay.className = "fragments-display";
  fragmentsDisplay.setAttribute("aria-label", "Fragments normaux");
  const stabilityDisplay = createStabilityDisplay(undefined, replayGame, () => replaceSession(true));
  scoreDisplay.update(score.snapshot());
  const absorptionFeedback = createNyrAbsorptionFeedback();
  const fragmentSystem = createFragmentSystem({
    getCurrentZone: () => zoneProgression.snapshot().currentZone,
    getVoidCorruptionInterval: () => voidDifficulty.snapshot().corruptionInterval,
    onCorruptionContact() {
      if (!isRuntimeActive()) return false;
      stability.applyCorruptionContact();
      if (stability.snapshot().stability === 0) endGame();
      return isRuntimeActive();
    },
    onPureAbsorbed() {
      if (isRuntimeActive()) { stability.applyPureFragment(); runStatistics.pure(); }
    },
    onAbsorbed() {
      movement.addSegments(1);
      const progressionState = progression.recordNormalFragmentAbsorption();
      const zoneState = zoneProgression.sync(progressionState);
      mobileAsteroid.syncZone(
        zoneState,
        displaySize.cssWidth,
        displaySize.cssHeight,
        movement.snapshot(),
        fragmentSystem.snapshot()
      );
      if (zoneState.currentZone === NYR_ZONES.ZONE_1) portal.unlock(zoneOneObjective.sync(progressionState.normalFragmentsAbsorbed).absorbed, displaySize.cssWidth, displaySize.cssHeight,
        movement.snapshot(), fragmentSystem.snapshot(), mobileAsteroid.snapshot());
      const objective = zoneTwoObjective.sync(progressionState.normalFragmentsAbsorbed);
      if (zoneState.currentZone === NYR_ZONES.ZONE_2 && objective.entryCount !== null) {
        const hazard = pocket.snapshot();
        exitPortal.unlock(objective.absorbed, displaySize.cssWidth, displaySize.cssHeight,
          movement.snapshot(), [...fragmentSystem.snapshot(),
            ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])], mobileAsteroid.snapshot());
      }
      if (zoneProgression.snapshot().currentZone === NYR_ZONES.ZONE_3) {
        const objectiveThree = zoneThreeObjective.sync(progressionState.normalFragmentsAbsorbed);
        const hazard = pocket.snapshot();
        zoneThreePortal.unlock(objectiveThree.absorbed, displaySize.cssWidth, displaySize.cssHeight,
          movement.snapshot(), [...fragmentSystem.snapshot(),
            ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])], mobileAsteroid.snapshot());
      }
      if (zoneState.currentZone === NYR_ZONES.ZONE_4) {
        const objectiveFour = zoneFourObjective.sync(progressionState.normalFragmentsAbsorbed);
        const hazard = pocket.snapshot();
        zoneFourPortal.unlock(objectiveFour.absorbed, displaySize.cssWidth, displaySize.cssHeight,
          movement.snapshot(), [...fragmentSystem.snapshot(),
            ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])], mobileAsteroid.snapshot());
      }
      const updatedScore = score.awardNormalFragment(combo.absorb());
      scoreDisplay.update(updatedScore);
      runStatistics.progress();
      absorptionFeedback.trigger(progression.snapshot().currentForm);
    }
  });
  let displaySize = { cssWidth: 1, cssHeight: 1, pixelRatio: 1 };
  let playableSize = null;

  app.replaceChildren(screen, orientationOverlay.element, scoreDisplay.element);
  app.append(stabilityDisplay.element, stabilityDisplay.gameOverElement);
  app.append(mainMenu.element, returnMenu.element, comboDisplay.element, timeDisplay.element);
  app.append(pauseDisplay.element, fragmentsDisplay);

  function syncOrientationState(shouldSuspend) {
    orientationOverlay.setVisible(shouldSuspend);

    if (shouldSuspend) {
      suspendRuntime("portrait-orientation");
    } else {
      resumeRuntime("portrait-orientation");
    }

    document.body.dataset.runtimeState = isRuntimeActive() ? "active" : "suspended";
    stabilityDisplay.update(stability.snapshot(), getRuntimeState(), runStatistics.snapshot());
    syncMenuDisplay();
  }

  function syncMenuDisplay() {
    const state = getRuntimeState();
    const menu = state.phase === "MENU";
    mainMenu.update(menu, state.suspensionReasons.includes("portrait-orientation"));
    returnMenu.update(state);
    pauseDisplay.update(state);
    fullscreenControl.update(state);
    fragmentsDisplay.textContent = `FRAGMENTS ${progression.snapshot().normalFragmentsAbsorbed}`;
    fragmentsDisplay.hidden = menu || state.suspensionReasons.includes("portrait-orientation");
    if (state.gameOver || state.journeyComplete) combo.reset();
    comboDisplay.update(combo.snapshot(), state);
    scoreDisplay.element.hidden = menu;
    timeDisplay.update(movement.snapshot().simulationTime, state);
    if (menu) stabilityDisplay.element.hidden = true;
    screen.children[1].hidden = menu;
  }

  function syncDisplayState() {
    displaySize = displayManager.resize();
    syncOrientationState(window.innerHeight > window.innerWidth ||
      displaySize.cssHeight > displaySize.cssWidth);
    if (!isRuntimeActive()) return;
    if (!playableSize) {
      movement.reset(displaySize.cssWidth, displaySize.cssHeight);
      fragmentSystem.initialize(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot());
      playableSize = displaySize;
      return;
    }
    if (playableSize.cssWidth === displaySize.cssWidth &&
        playableSize.cssHeight === displaySize.cssHeight) return;
    if (isRuntimeActive() && movement.snapshot().trail.length) {
      const offset = movement.fitViewport(displaySize.cssWidth, displaySize.cssHeight);
      fragmentSystem.translate(offset);
      mobileAsteroid.translate(offset);
      portal.translate(offset);
      pocket.translate(offset);
      exitPortal.translate(offset);
      zoneThreePortal.translate(offset);
      zoneFourPortal.translate(offset);
      const hazard = pocket.snapshot();
      exitPortal.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(),
        [...fragmentSystem.snapshot(), ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])],
        mobileAsteroid.snapshot());
      zoneThreePortal.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(),
        [...fragmentSystem.snapshot(), ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])],
        mobileAsteroid.snapshot());
      zoneFourPortal.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(),
        [...fragmentSystem.snapshot(), ...(["warning", "active"].includes(hazard.phase) ? [hazard] : [])],
        mobileAsteroid.snapshot());
      pocket.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(), pocketObstacles());
      portal.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(),
        fragmentSystem.snapshot(), mobileAsteroid.snapshot());
      fragmentSystem.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot());
      mobileAsteroid.revalidate(
        displaySize.cssWidth,
        displaySize.cssHeight,
        movement.snapshot(),
        fragmentSystem.snapshot()
      );
    }
    playableSize = displaySize;
  }

  let displaySyncPending = false;
  function requestDisplaySync() {
    /* Suspend portrait immediately, even before the next animation frame. */
    if (window.innerHeight > window.innerWidth) syncOrientationState(true);
    displaySyncPending = true;
  }
  function flushDisplaySync() {
    if (!displaySyncPending) return;
    displaySyncPending = false;
    syncDisplayState();
  }
  window.addEventListener("resize", requestDisplaySync);
  window.addEventListener("orientationchange", requestDisplaySync);
  window.visualViewport?.addEventListener("resize", requestDisplaySync);
  const fullscreenControl = createFullscreenControl(requestDisplaySync);
  app.append(fullscreenControl.element);
  syncDisplayState();
  const pointerInput = createPointerInput(canvas, movement);

  function replayGame() {
    replaceSession(false);
  }

  function replaceSession(toMenu) {
    if (disposed) return;
    const state = getRuntimeState();
    const menu = state.phase === "MENU";
    if (state.suspensionReasons.some(reason => reason !== "main-menu" && !(toMenu && reason === "user-pause"))) return;
    if (toMenu ? menu : (!state.gameOver && !state.journeyComplete && !menu)) return;
    observeWeekly();
    weeklyChallenges.flush();
    disposed = true;
    gameLoop.stop();
    pointerInput.destroy();
    fullscreenControl.destroy();
    window.removeEventListener("resize", requestDisplaySync);
    window.removeEventListener("orientationchange", requestDisplaySync);
    window.visualViewport?.removeEventListener("resize", requestDisplaySync);
    if (toMenu) suspendRuntime("main-menu");
    else if (menu) resumeRuntime("main-menu");
    resumeRuntime("user-pause");
    if (state.gameOver || state.journeyComplete) beginNewGame();
    startGame();
  }

  const gameLoop = createGameLoop({
    isActive: isRuntimeActive,
    update(deltaSeconds) {
      flushDisplaySync();
      if (!isRuntimeActive()) return;
      combo.update(deltaSeconds);
      zoneBackgroundTransition.update(deltaSeconds);
      farStarsParallax.update(deltaSeconds);
      midNebulaParallax.update(deltaSeconds);
      nearParticlesParallax.update(deltaSeconds);
      decorativeAsteroidsParallax.update(deltaSeconds);
      absorptionFeedback.update(deltaSeconds);
      movement.update(deltaSeconds, displaySize.cssWidth, displaySize.cssHeight,
        zoneProgression.snapshot().currentZone === NYR_ZONES.ZONE_4
          ? voidDifficulty.snapshot().speed / NYR_PROTOTYPE_CONFIG.speedPixelsPerSecond
          : zoneProgression.snapshot().currentZone === NYR_ZONES.ZONE_3 ? ZONE_THREE_SPEED_MULTIPLIER : 1);
      if (zoneProgression.snapshot().currentZone === NYR_ZONES.ZONE_4) {
        voidDifficulty.sync(movement.snapshot().simulationTime);
      }
      fragmentSystem.advanceCorruption(deltaSeconds, displaySize.cssWidth, displaySize.cssHeight);
      fragmentSystem.update(movement.snapshot(), displaySize.cssWidth, displaySize.cssHeight);
      if (!isRuntimeActive()) return;
      portal.update(movement.snapshot());
      exitPortal.update(movement.snapshot());
      zoneThreePortal.update(movement.snapshot());
      zoneFourPortal.update(movement.snapshot());
      if (!isRuntimeActive()) return;
      mobileAsteroid.update(
        deltaSeconds,
        displaySize.cssWidth,
        displaySize.cssHeight,
        movement.snapshot(),
        fragmentSystem.snapshot()
      );
      if (!isRuntimeActive()) return;
      pocket.update(deltaSeconds, zoneProgression.snapshot().currentZone,
        displaySize.cssWidth, displaySize.cssHeight, movement.snapshot(), pocketObstacles(), voidDifficulty.snapshot().pocketCooldown);
    },
    render() {
      if (getRuntimeState().gameOver) runStatistics.finish();
      observeWeekly();
      if (!isRuntimeActive()) weeklyChallenges.flush();
      /* Also resize while portrait or Game Over keeps update suspended. */
      flushDisplaySync();
      stabilityDisplay.update(stability.snapshot(), getRuntimeState(), runStatistics.snapshot());
      zoneBackgroundTransition.render(
        displayManager.context,
        displaySize.cssWidth,
        displaySize.cssHeight
      );
      farStarsParallax.render(
        displayManager.context,
        displaySize.cssWidth,
        displaySize.cssHeight
      );
      midNebulaParallax.render(
        displayManager.context,
        displaySize.cssWidth,
        displaySize.cssHeight
      );
      nearParticlesParallax.render(
        displayManager.context,
        displaySize.cssWidth,
        displaySize.cssHeight
      );
      decorativeAsteroidsParallax.render(
        displayManager.context,
        displaySize.cssWidth,
        displaySize.cssHeight
      );
      syncMenuDisplay();
      if (getRuntimeState().phase === "MENU") return;
      if (zoneProgression.snapshot().currentZone !== NYR_ZONES.ZONE_1) {
        renderCorruptionPocket(displayManager.context, pocket.snapshot());
      }
      renderZoneExitPortal(displayManager.context, portal.snapshot());
      renderZoneExitPortal(displayManager.context, exitPortal.snapshot());
      renderZoneExitPortal(displayManager.context, zoneThreePortal.snapshot());
      renderZoneExitPortal(displayManager.context, zoneFourPortal.snapshot());
      renderMobileAsteroid(displayManager.context, mobileAsteroid.snapshot());
      renderNormalFragments(displayManager.context, fragmentSystem.snapshot());
      renderNyr(
        displayManager.context,
        movement.snapshot(),
        progression.snapshot(),
        absorptionFeedback.snapshot()
      );
    }
  });

  gameLoop.start();
}

if (app) {
  suspendRuntime("main-menu");
  startGame();
}
