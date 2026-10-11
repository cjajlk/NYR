import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Original deterministic synthesis: no sampled or external recordings.
const rate = 44100;
const target = new URL("../assets/audio/sfx/", import.meta.url);
mkdirSync(target, { recursive: true });
const tau = Math.PI * 2;
const specs = {
  nyr_fragment_absorb_1: [0.24, "fragment", 660],
  nyr_fragment_absorb_2: [0.25, "fragment", 704],
  nyr_fragment_absorb_3: [0.26, "fragment", 748],
  nyr_fragment_pur: [0.62, "pure", 528],
  nyr_collision: [0.34, "collision", 150],
  nyr_corruption_hit: [0.42, "corruption", 105],
  nyr_portal_enter: [0.85, "portal", 220],
  nyr_death: [0.75, "death", 330],
  nyr_movement_loop: [4, "movement", 110]
};
let seed = 53;
for (const [name, [duration, kind, frequency]] of Object.entries(specs)) {
  const count = Math.round(duration * rate);
  const wav = Buffer.alloc(44 + count * 2);
  wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36);
  wav.writeUInt32LE(count * 2, 40);
  let filteredNoise = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate, u = i / count;
    seed = (1664525 * seed + 1013904223) >>> 0;
    filteredNoise += 0.08 * ((seed / 4294967296 * 2 - 1) - filteredNoise);
    const envelope = Math.min(1, t / 0.014) * (1 - u) ** 2;
    let value;
    if (kind === "movement") {
      // Integer cycles make a seamless four-second loop; gain stays very low in game.
      value = 0.12 * (Math.sin(tau * 110 * t) + 0.35 * Math.sin(tau * 165 * t)) *
        (0.8 + 0.2 * Math.cos(tau * 0.25 * t));
    } else if (kind === "fragment" || kind === "pure") {
      value = envelope * (0.28 * Math.sin(tau * frequency * t) +
        0.10 * Math.sin(tau * frequency * 1.5 * t) * Math.exp(-t * 9) +
        0.04 * Math.sin(tau * frequency * 2 * t) * Math.exp(-t * 18));
    } else if (kind === "portal") {
      const swell = Math.sin(Math.PI * u) ** 2;
      value = swell * (0.22 * Math.sin(tau * (frequency * t + 120 * t * t)) +
        0.09 * Math.sin(tau * 330 * t) + 0.15 * filteredNoise);
    } else if (kind === "death") {
      value = envelope * (0.23 * Math.sin(tau * (frequency * t - 100 * t * t)) +
        0.10 * filteredNoise);
    } else {
      const phase = tau * (frequency * t - 55 * t * t);
      value = envelope * (0.35 * Math.sin(phase) + 0.18 * filteredNoise +
        (kind === "corruption" ? 0.07 * Math.sin(phase * 2.01) : 0));
    }
    wav.writeInt16LE(Math.round(Math.max(-0.95, Math.min(0.95, value)) * 32767), 44 + i * 2);
  }
  writeFileSync(new URL(`${name}.wav`, target), wav);
}
console.log(`Created ${Object.keys(specs).length} original WAV files in ${fileURLToPath(target)}`);
