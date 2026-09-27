export const COSMETICS_KEY = "nyrCosmeticsV1";
export const SKINS = Object.freeze([
  Object.freeze({ id: "classic", name: "CLASSIQUE", price: 0 }),
  Object.freeze({ id: "test", name: "PREMIER SKIN TEST", price: 0 })
]);

// Ownership and equipment are separate from currency, statistics and run state.
export function createCosmeticsStore(getStorage = () => globalThis.localStorage) {
  let state = { version: 1, owned: ["classic"], equipped: { skin: "classic" } };
  try {
    const saved = JSON.parse(getStorage()?.getItem(COSMETICS_KEY) ?? "null");
    if (saved?.version === 1) {
      if (Array.isArray(saved.owned) && saved.owned.includes("test")) state.owned.push("test");
      if (state.owned.includes(saved.equipped?.skin)) state.equipped.skin = saved.equipped.skin;
    }
  } catch { /* Default appearance remains available when storage is unavailable. */ }
  function snapshot() {
    return Object.freeze({ owned: Object.freeze([...state.owned]), equipped: Object.freeze({ ...state.equipped }) });
  }
  function save(next) {
    try {
      const storage = getStorage();
      if (!storage) return false;
      storage.setItem(COSMETICS_KEY, JSON.stringify(next));
      state = next;
      return true;
    } catch { return false; }
  }
  function unlock(id) {
    if (id !== "test" || state.owned.includes(id)) return false;
    return save({ ...state, owned: [...state.owned, id] });
  }
  function equip(id) {
    if (!state.owned.includes(id)) return false;
    return save({ ...state, equipped: { ...state.equipped, skin: id } });
  }
  return Object.freeze({ snapshot, unlock, equip });
}
