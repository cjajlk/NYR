/* Calendar arithmetic uses local dates; UTC is used only to number the ISO week. */
export function getLocalWeek(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const next = new Date(monday); next.setDate(next.getDate() + 7);
  const thursday = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3));
  const year = thursday.getUTCFullYear();
  const week = Math.ceil((((thursday - Date.UTC(year, 0, 1)) / 86400000) + 1) / 7);
  const localDate = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const sunday = new Date(next); sunday.setDate(sunday.getDate() - 1);
  return Object.freeze({ id: `${year}-W${String(week).padStart(2, "0")}`, start: localDate(monday), end: localDate(sunday) });
}
export const WEEKLY_KEY = "nyrWeeklyChallengesV1";
export const WEEKLY_CHALLENGES = Object.freeze([
  { id: "contact", title: "PREMIER CONTACT", metric: "normalFragments", target: 250, reward: 50, unit: "fragments" },
  { id: "traveler", title: "VOYAGEUR", metric: "cycles", target: 5, reward: 75, unit: "cycles" },
  { id: "evolution", title: "ÉVOLUTION", metric: "devoreurRuns", target: 3, reward: 100, unit: "Dévoreurs" },
  { id: "endurance", title: "ENDURANCE", metric: "activeTime", target: 1800, reward: 100, unit: "min" },
  { id: "master", title: "MAÎTRE DU VIDE", metric: "activeTime", target: 3600, reward: 175, unit: "min" }
].map(Object.freeze));
const limits = { normalFragments: 250, cycles: 5, devoreurRuns: 3, activeTime: 3600 };
const safe = value => Number.isFinite(value) && value >= 0 ? Math.min(value, Number.MAX_SAFE_INTEGER) : 0;
export function createWeeklyChallenges({ now = () => new Date(), getStorage = () => globalThis.localStorage } = {}) {
  const fresh = (week, balance = 0) => ({ version: 1, weekId: week.id, balance,
    progress: { normalFragments: 0, cycles: 0, devoreurRuns: 0, activeTime: 0 }, completed: {}, claimed: {} });
  let week = getLocalWeek(now());
  let state = fresh(week), dirty = false, unsavedTime = 0;
  function read() {
    try {
      const value = JSON.parse(getStorage()?.getItem(WEEKLY_KEY) ?? "null");
      return value?.version === 1 ? value : null;
    } catch { return null; }
  }
  function merge(saved) {
    if (!saved) return;
    state.balance = Math.max(state.balance, Math.floor(safe(saved.balance)));
    if (saved.weekId !== state.weekId) return;
    for (const key of Object.keys(limits)) state.progress[key] = Math.min(limits[key], Math.max(state.progress[key], safe(saved.progress?.[key])));
    for (const challenge of WEEKLY_CHALLENGES) {
      if (saved.claimed?.[challenge.id] === true) state.claimed[challenge.id] = true;
    }
  }
  function markCompleted() {
    for (const c of WEEKLY_CHALLENGES) state.completed[c.id] = state.progress[c.metric] + 1e-9 >= c.target;
  }
  const saved = read();
  merge(saved); markCompleted();
  dirty = Boolean(saved && saved.weekId !== week.id);
  function refreshWeek() {
    const current = getLocalWeek(now());
    if (current.id !== week.id) {
      merge(read()); week = current; state = fresh(week, state.balance); dirty = true; unsavedTime = 0;
    }
  }
  function flush() {
    refreshWeek();
    if (!dirty) return true;
    merge(read()); markCompleted();
    try {
      const storage = getStorage();
      if (!storage) return false;
      storage.setItem(WEEKLY_KEY, JSON.stringify(state));
      dirty = false; unsavedTime = 0; return true;
    } catch { return false; }
  }
  function add(delta) {
    refreshWeek();
    const wasComplete = { ...state.completed };
    let events = false;
    for (const key of Object.keys(limits)) {
      const amount = safe(delta[key]);
      const sum = state.progress[key] + amount;
      const next = sum + 1e-9 >= limits[key] ? limits[key] : sum;
      if (next === state.progress[key]) continue;
      state.progress[key] = next; dirty = true;
      if (key === "activeTime") unsavedTime += amount; else events = true;
    }
    markCompleted();
    if (events || unsavedTime >= 5 || WEEKLY_CHALLENGES.some(c => state.completed[c.id] && !wasComplete[c.id])) flush();
  }
  function snapshot() {
    refreshWeek(); markCompleted();
    return Object.freeze({ week: Object.freeze({ ...week }), balance: state.balance,
      challenges: Object.freeze(WEEKLY_CHALLENGES.map(c => Object.freeze({ ...c, progress: Math.min(c.target, state.progress[c.metric]),
        completed: state.completed[c.id], claimed: Boolean(state.claimed[c.id]) }))) });
  }
  function claim(id, expectedWeek) {
    refreshWeek(); merge(read()); markCompleted();
    const c = WEEKLY_CHALLENGES.find(c => c.id === id);
    if (expectedWeek !== week.id || !c || !state.completed[id] || state.claimed[id]) return false;
    /* One storage write commits both the balance and the claim marker. */
    const next = { ...state, balance: state.balance + c.reward, claimed: { ...state.claimed, [id]: true } };
    try {
      const storage = getStorage();
      if (!storage) return false;
      storage.setItem(WEEKLY_KEY, JSON.stringify(next));
      state = next; dirty = false; unsavedTime = 0; return true;
    } catch { return false; }
  }
  function trackRun(readRun) {
    let previous = { normalFragments: 0, cycles: 0, activeTime: 0 }, devoreurCounted = false;
    return () => {
      const run = readRun();
      const delta = {};
      for (const key of Object.keys(previous)) { delta[key] = Math.max(0, run[key] - previous[key]); previous[key] = run[key]; }
      if (run.maxForm === "devoreur" && !devoreurCounted) { delta.devoreurRuns = 1; devoreurCounted = true; }
      add(delta);
    };
  }
  if (dirty) flush();
  return Object.freeze({ snapshot, claim, flush, trackRun });
}
