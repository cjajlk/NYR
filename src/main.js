import { APP_CONFIG } from "./core/appConfig.js";
import { createDisplayManager } from "./core/displayManager.js";
import { createGameLoop } from "./core/gameLoop.js";
import { endGame, isRuntimeActive, resumeRuntime, suspendRuntime } from "./core/runtimeState.js";
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
import { createNyrZoneProgression } from "./gameplay/nyrZoneProgression.js";
import { createMobileAsteroidSystem } from "./gameplay/mobileAsteroidSystem.js";
import { renderMobileAsteroid } from "./gameplay/mobileAsteroidRenderer.js";
import { renderNyr } from "./gameplay/nyrRenderer.js";
import { createNyrAbsorptionFeedback } from "./gameplay/nyrAbsorptionFeedback.js";
import { createFragmentSystem } from "./gameplay/fragmentSystem.js";
import { renderNormalFragments } from "./gameplay/fragmentRenderer.js";
import { createPointerInput } from "./systems/pointerInput.js";
import { createOrientationOverlay } from "./ui/orientationOverlay.js";
import { createScoreDisplay } from "./ui/scoreDisplay.js";

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

if (app) {
  const { screen, canvas } = createPreproductionScreen();
  const orientationOverlay = createOrientationOverlay();
  const displayManager = createDisplayManager(canvas, screen);
  const zoneOneBackground = createZoneOneBackground();
  const zoneBackgroundTransition = createZoneBackgroundTransition({ zoneOneBackground });
  const farStarsParallax = createFarStarsParallax();
  const midNebulaParallax = createMidNebulaParallax();
  const nearParticlesParallax = createNearParticlesParallax();
  const decorativeAsteroidsParallax = createDecorativeAsteroidsParallax();
  const movement = createNyrMovement();
  const stability = createNyrStability();
  const mobileAsteroid = createMobileAsteroidSystem({
    onHeadContactStarted() {
      stability.applyAsteroidContact();
      if (stability.snapshot().stability === 0) endGame();
    }
  });
  const progression = createNyrProgression();
  const zoneProgression = createNyrZoneProgression({
    onZoneTwoReached(zoneState) {
      zoneBackgroundTransition.sync(zoneState);
    }
  });
  const score = createNyrScore();
  const scoreDisplay = createScoreDisplay();
  scoreDisplay.update(score.snapshot());
  const absorptionFeedback = createNyrAbsorptionFeedback();
  const fragmentSystem = createFragmentSystem({
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
      const updatedScore = score.awardNormalFragment();
      scoreDisplay.update(updatedScore);
      absorptionFeedback.trigger(progression.snapshot().currentForm);
    }
  });
  let displaySize = { cssWidth: 1, cssHeight: 1, pixelRatio: 1 };

  app.replaceChildren(screen, orientationOverlay.element, scoreDisplay.element);

  function syncOrientationState() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    const isMobileViewport = Math.min(width, height) <= 600;
    const shouldSuspend = isMobileViewport && isPortrait;

    orientationOverlay.setVisible(shouldSuspend);

    if (shouldSuspend) {
      suspendRuntime("portrait-orientation");
    } else {
      resumeRuntime("portrait-orientation");
    }

    document.body.dataset.runtimeState = isRuntimeActive() ? "active" : "suspended";
  }

  function syncDisplayState() {
    syncOrientationState();
    const previousSize = displaySize;
    displaySize = displayManager.resize();
    if (previousSize.cssWidth === displaySize.cssWidth &&
        previousSize.cssHeight === displaySize.cssHeight) return;
    if (isRuntimeActive() && movement.snapshot().trail.length) {
      fragmentSystem.revalidate(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot());
      mobileAsteroid.revalidate(
        displaySize.cssWidth,
        displaySize.cssHeight,
        movement.snapshot(),
        fragmentSystem.snapshot()
      );
    }
  }

  let displaySyncPending = false;
  function requestDisplaySync() {
    /* Suspend portrait immediately, even before the next animation frame. */
    syncOrientationState();
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
  syncDisplayState();
  movement.reset(displaySize.cssWidth, displaySize.cssHeight);
  fragmentSystem.initialize(displaySize.cssWidth, displaySize.cssHeight, movement.snapshot());
  createPointerInput(canvas, movement);

  const gameLoop = createGameLoop({
    isActive: isRuntimeActive,
    update(deltaSeconds) {
      flushDisplaySync();
      zoneBackgroundTransition.update(deltaSeconds);
      farStarsParallax.update(deltaSeconds);
      midNebulaParallax.update(deltaSeconds);
      nearParticlesParallax.update(deltaSeconds);
      decorativeAsteroidsParallax.update(deltaSeconds);
      absorptionFeedback.update(deltaSeconds);
      movement.update(deltaSeconds, displaySize.cssWidth, displaySize.cssHeight);
      fragmentSystem.update(movement.snapshot(), displaySize.cssWidth, displaySize.cssHeight);
      mobileAsteroid.update(
        deltaSeconds,
        displaySize.cssWidth,
        displaySize.cssHeight,
        movement.snapshot(),
        fragmentSystem.snapshot()
      );
    },
    render() {
      /* Also resize while portrait or Game Over keeps update suspended. */
      flushDisplaySync();
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
