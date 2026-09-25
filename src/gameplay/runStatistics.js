export const STATISTICS_KEY = "nyrStatisticsV1";
const defaults = () => ({ bestScore: 0, bestTime: 0, bestCombo: 1, completedRuns: 0,
  normalFragments: 0, pureFragments: 0, cycles: 0, damageEvents: 0, stabilityLost: 0,
  spectreReached: 0, nocturneReached: 0, devoreurReached: 0 });
const forms = ["eclat", "spectre", "nocturne", "devoreur"];
export function createStatisticsStore(getStorage = () => globalThis.localStorage) {
  let totals = defaults();
  try {
    const saved = JSON.parse(getStorage()?.getItem(STATISTICS_KEY) ?? "null");
    if (saved?.version === 1) for (const key of Object.keys(totals)) {
      const value = saved.totals?.[key];
      if (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) {
        totals[key] = key === "bestTime" ? value : Math.floor(value);
      }
    }
    totals.bestCombo = Math.max(1, Math.min(4, totals.bestCombo));
  } catch { /* Storage is optional; gameplay and in-memory records remain available. */ }
  function record(run) {
    totals.bestScore = Math.max(totals.bestScore, run.score);
    totals.bestTime = Math.max(totals.bestTime, run.activeTime);
    totals.bestCombo = Math.max(totals.bestCombo, run.bestCombo);
    totals.completedRuns++;
    for (const key of ["normalFragments", "pureFragments", "cycles", "damageEvents", "stabilityLost"]) totals[key] += run[key];
    const rank = forms.indexOf(run.maxForm);
    for (const [index, key] of ["spectreReached", "nocturneReached", "devoreurReached"].entries()) {
      if (rank >= index + 1) totals[key]++;
    }
    try { getStorage()?.setItem(STATISTICS_KEY, JSON.stringify({ version: 1, totals })); } catch { /* Keep memory totals. */ }
    return snapshot();
  }
  function snapshot() { return Object.freeze({ ...totals }); }
  return Object.freeze({ record, snapshot });
}
export function createRunStatistics(readMetrics, store) {
  const counters = { pureFragments: 0, cycles: 0, damageEvents: 0, stabilityLost: 0, bestCombo: 1, maxForm: "eclat" };
  let final = null;
  function progress() {
    if (final) return;
    const metrics = readMetrics();
    counters.bestCombo = Math.max(counters.bestCombo, metrics.combo);
    if (forms.indexOf(metrics.form) > forms.indexOf(counters.maxForm)) counters.maxForm = metrics.form;
  }
  function pure() { if (!final) counters.pureFragments++; }
  function cycle() { if (!final) counters.cycles++; }
  function damage(before, after) {
    if (final || after >= before) return;
    counters.damageEvents++;
    counters.stabilityLost += before - after;
  }
  function snapshot() {
    if (final) return final;
    const metrics = readMetrics();
    return Object.freeze({ ...counters, score: metrics.score, activeTime: metrics.activeTime, normalFragments: metrics.normalFragments });
  }
  function finish() {
    if (!final) { progress(); final = snapshot(); store.record(final); }
    return final;
  }
  return Object.freeze({ progress, pure, cycle, damage, snapshot, finish });
}
