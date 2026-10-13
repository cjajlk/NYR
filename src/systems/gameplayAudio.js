export const GAMEPLAY_SOUNDS = Object.freeze({
  fragment1: "nyr_fragment_absorb_1", fragment2: "nyr_fragment_absorb_2",
  fragment3: "nyr_fragment_absorb_3", pure: "nyr_fragment_pur",
  collision: "nyr_collision", corruption: "nyr_corruption_hit",
  portal: "nyr_portal_enter", death: "nyr_death", movement: "nyr_movement_loop"
});
export const AUDIO_PREFERENCES_KEY = "nyrAudioPreferencesV1";

export function createGameplayAudio({
  Context = globalThis.AudioContext ?? globalThis.webkitAudioContext,
  fetchAudio = globalThis.fetch?.bind(globalThis),
  getStorage = () => globalThis.localStorage
} = {}) {
  let context = null, master = null, movement = null;
  let active = false, enabled = true, hidden = false, variant = 0;
  try {
    const preferences = JSON.parse(getStorage()?.getItem(AUDIO_PREFERENCES_KEY) ?? "null");
    if (preferences?.version === 1 && typeof preferences.enabled === "boolean") enabled = preferences.enabled;
  } catch { /* Unavailable storage keeps the existing default and gameplay working. */ }
  let loading = null;
  const buffers = new Map(), voices = new Set();

  function stopMovement() {
    if (!movement) return;
    try { movement.stop(); } catch {}
    movement = null;
  }
  function silence() {
    stopMovement();
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function syncMovement() {
    if (!active || !enabled || hidden || context?.state !== "running") { stopMovement(); return; }
    if (movement || !buffers.has("movement")) return;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffers.get("movement"); source.loop = true;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, context.currentTime + 0.25);
    source.connect(gain); gain.connect(master);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(); movement = source;
  }
  async function unlock() {
    if (!Context || !fetchAudio) return false;
    try {
      if (!context) {
        context = new Context(); master = context.createGain();
        master.gain.value = 0.65; master.connect(context.destination);
        if (context.createDynamicsCompressor) {
          const limiter = context.createDynamicsCompressor();
          limiter.threshold.value = -12; limiter.knee.value = 12;
          limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.15;
          master.disconnect(); master.connect(limiter); limiter.connect(context.destination);
        }
      }
      // Called from a real pointer/key gesture, including after mobile interruption.
      await context.resume();
      if (!loading) loading = Promise.all(Object.entries(GAMEPLAY_SOUNDS).map(async ([key, name]) => {
        try {
          const response = await fetchAudio(new URL(`../../assets/audio/sfx/${name}.wav`, import.meta.url));
          if (!response.ok) return;
          buffers.set(key, await context.decodeAudioData(await response.arrayBuffer()));
        } catch { /* A missing sound must never interrupt gameplay. */ }
      }));
      await loading;
      syncMovement(); return context.state === "running";
    } catch { return false; }
  }
  function play(kind) {
    if (!active || !enabled || hidden || context?.state !== "running") return false;
    const key = kind === "fragment" ? `fragment${variant++ % 3 + 1}` : kind;
    const buffer = buffers.get(key);
    // Do not replay missed events once loading/unlock finishes.
    if (!buffer || voices.size >= 12) return false;
    try {
      const source = context.createBufferSource(); source.buffer = buffer;
      source.connect(master); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); };
      source.start(); return true;
    } catch { return false; }
  }
  function setActive(value, stopEffects = false) {
    active = Boolean(value);
    if (stopEffects) silence();
    syncMovement();
  }
  function setHidden(value) { hidden = Boolean(value); if (hidden) silence(); syncMovement(); }
  function setEnabled(value) {
    enabled = Boolean(value);
    try { getStorage()?.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ version: 1, enabled })); } catch {}
    if (!enabled) silence(); syncMovement();
  }
  return Object.freeze({ unlock, play, setActive, setHidden, setEnabled, silence,
    isEnabled: () => enabled });
}
