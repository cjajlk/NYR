import { writeFileSync } from "node:fs";

// Deterministic, soft FM/noise sweeps; only the two Lot 4 assets are written.
const rate = 44100;
for (const [name, duration, amplitude, bright] of [
  ["nyr_impulse", 0.28, 0.19, false], ["nyr_impulse_neutralized", 0.14, 0.1, true]
]) {
  const samples = Math.round(rate * duration), wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(samples * 2, 40);
  let phase = 0, seed = 53, noise = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / rate, p = i / (samples - 1);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise += ((seed / 0xffffffff * 2 - 1) - noise) * 0.11;
    const frequency = (bright ? 1200 : 680) * Math.exp(-p * 2.8) + 100;
    phase += 2 * Math.PI * frequency / rate;
    const envelope = Math.min(1, t / 0.012) * Math.pow(1 - p, 2);
    const tone = Math.sin(phase + 1.7 * Math.sin(phase * 1.413)) * 0.52;
    const low = bright ? 0 : Math.sin(2 * Math.PI * 85 * t) * 0.25;
    const value = amplitude * envelope * (tone + low + noise * 0.65);
    wav.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(new URL(`../assets/audio/sfx/${name}.wav`, import.meta.url), wav);
}
