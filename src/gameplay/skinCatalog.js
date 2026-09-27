export const SKIN_PARTS = Object.freeze(["tete", "ecaille_01", "ecaille_02", "ecaille_03", "queue"]);
export const SKIN_FORMS = Object.freeze(["eclat", "spectre", "nocturne", "devoreur"]);
export const skinAssetPath = (form, part) => `./assets/images/nyr/nyr_${form}_${part}.png`;
const forms = Object.freeze(Object.fromEntries(SKIN_FORMS.map(form => [form,
  Object.freeze(Object.fromEntries(SKIN_PARTS.map(part => [part, skinAssetPath(form, part)])))])));
// Keep the PACK 49 technical ID; displayed names never identify ownership.
export const SKINS = Object.freeze([
  Object.freeze({ id: "classic", name: "CLASSIQUE", price: 0, forms: Object.freeze({}) }),
  Object.freeze({ id: "test", name: "PREMIER SKIN", price: 750, forms })
]);
