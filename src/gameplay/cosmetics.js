import { SKINS } from "./skinCatalog.js";
export { SKINS } from "./skinCatalog.js";
export const COSMETICS_KEY = "nyrCosmeticsV1";

// Equipment is separate; paid ownership is saved atomically with the wallet debit.
export function createCosmeticsStore(wallet, getStorage = () => globalThis.localStorage) {
  let state = { version: 2, equipped: { skin: "classic" } };
  const owned = () => ["classic", ...wallet.snapshot().ownedSkins];
  try {
    const saved = JSON.parse(getStorage()?.getItem(COSMETICS_KEY) ?? "null");
    if (saved?.version === 2 && owned().includes(saved.equipped?.skin)) state.equipped.skin = saved.equipped.skin;
    // Free PACK 49 ownership is not a purchase; migrate equipment only.
    if (saved?.version === 1) getStorage()?.setItem(COSMETICS_KEY, JSON.stringify(state));
  } catch { /* Default appearance remains available when storage is unavailable. */ }
  function snapshot() {
    const possessions = owned();
    const skin = possessions.includes(state.equipped.skin) ? state.equipped.skin : "classic";
    return Object.freeze({ owned: Object.freeze(possessions), equipped: Object.freeze({ skin }) });
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
  function equip(id) {
    if (!SKINS.some(skin => skin.id === id) || !owned().includes(id)) return false;
    return save({ ...state, equipped: { ...state.equipped, skin: id } });
  }
  return Object.freeze({ snapshot, purchase: wallet.purchaseSkin, equip });
}
