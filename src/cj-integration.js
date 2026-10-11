/* Adapter only: rewards, storage and locks belong to the shared Hub engine. */
(() => {
  'use strict';
  let previous = null;
  const suspend = () => { previous = null; try { window.CJEngine?.suspend?.(); } catch {} };
  window.CJGameIntegration = Object.freeze({
    suspend,
    tick(now, id) {
      const state = window.getGameState?.();
      if (!state?.running || state.paused || document.hidden || !document.hasFocus() || !window.CJEngine) { suspend(); return 0; }
      if (previous === null) { previous = now; return 0; }
      const delta = now - previous;
      previous = now;
      if (!Number.isFinite(delta) || delta <= 0 || delta > 200) { suspend(); return 0; }
      try { return window.CJEngine.tick(delta, id) || 0; } catch { suspend(); return 0; }
    }
  });
  for (const event of ['blur', 'focus', 'pagehide', 'pageshow']) window.addEventListener(event, suspend);
  document.addEventListener('visibilitychange', suspend);
  const account = document.createElement('script');
  account.src = 'https://cjajlk.github.io/cjajlkGames-V2-test/core/cjAccount.js';
  account.dataset.universal = 'true';
  account.onload = async () => {
    const ready = await window.CJajlkAccount?.ready;
    if (ready && !ready.ok) return;
    const engine = document.createElement('script');
    engine.src = 'https://cjajlk.github.io/cjajlkGames-V2-test/core/cjEngine.js';
    engine.onerror = suspend;
    document.head.appendChild(engine);
  };
  account.onerror = suspend;
  document.head.appendChild(account);
})();
