// Anatomical landmarks measured on the original 20 PNGs (image pixels).
// Forward is the muzzle / front of a scale / tail root. Back is the neck,
// swept scale tip or tail tip. Drawing uses a uniform scale, never stretches.
function visual(size, forward, back, length, anchor = null) {
  const [width, height] = size;
  const dx = forward[0] - back[0], dy = forward[1] - back[1];
  const center = anchor ?? [(forward[0] + back[0]) / 2, (forward[1] + back[1]) / 2];
  return Object.freeze({ width: length * width / Math.hypot(dx, dy),
    anchorX: center[0] / width, anchorY: center[1] / height,
    angle: -Math.atan2(dy, dx) });
}

export const LEVIATHAN_VISUALS = Object.freeze({
  eclat: Object.freeze({
    tete: visual([80, 96], [10, 86], [48, 39], 34),
    ecaille_01: visual([118, 140], [14, 10], [102, 130], 20),
    ecaille_02: visual([119, 143], [15, 10], [104, 134], 20),
    ecaille_03: visual([97, 128], [15, 10], [81, 118], 20),
    queue: visual([168, 201], [148, 172], [12, 17], 34, [148, 172])
  }),
  spectre: Object.freeze({
    tete: visual([116, 93], [12, 82], [75, 37], 38),
    ecaille_01: visual([89, 129], [14, 10], [73, 118], 22),
    ecaille_02: visual([104, 126], [15, 10], [87, 116], 22),
    ecaille_03: visual([99, 130], [14, 10], [83, 120], 22),
    queue: visual([114, 137], [97, 21], [12, 120], 36, [97, 21])
  }),
  nocturne: Object.freeze({
    tete: visual([112, 102], [12, 92], [66, 36], 42),
    ecaille_01: visual([99, 130], [14, 10], [83, 120], 24),
    ecaille_02: visual([93, 129], [14, 10], [77, 119], 24),
    ecaille_03: visual([99, 132], [14, 10], [83, 122], 24),
    queue: visual([94, 162], [31, 20], [73, 145], 40, [31, 20])
  }),
  devoreur: Object.freeze({
    tete: visual([135, 106], [122, 93], [50, 45], 46),
    ecaille_01: visual([97, 131], [14, 10], [81, 121], 26),
    ecaille_02: visual([104, 131], [15, 10], [88, 121], 26),
    ecaille_03: visual([105, 135], [15, 10], [89, 125], 26),
    queue: visual([102, 175], [82, 20], [92, 158], 44, [82, 20])
  })
});
