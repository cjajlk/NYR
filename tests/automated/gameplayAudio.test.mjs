import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameplayAudio, GAMEPLAY_SOUNDS } from "../../src/systems/gameplayAudio.js";

let instance, fetched = 0;
class FakeContext {
  constructor() { instance = this; this.state = "suspended"; this.currentTime = 0; this.sources = []; }
  async resume() { this.state = "running"; }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  createBufferSource() {
    const source = { connect() {}, disconnect() {}, start() { this.started = true; },
      stop() { this.stopped = true; this.onended?.(); } };
    this.sources.push(source); return source;
  }
  async decodeAudioData(data) { return data; }
}
const audio = createGameplayAudio({ Context: FakeContext, fetchAudio: async url => {
  fetched++;
  const wav = readFileSync(url);
  return { ok: true, arrayBuffer: async () => wav };
} });
assert.equal(audio.play("fragment"), false, "locked audio drops events");
audio.setActive(true);
assert.equal(await audio.unlock(), true);
assert.equal(fetched, 9);
assert.equal(instance.sources.filter(s => s.loop).length, 1);
for (const name of ["fragment", "fragment", "fragment", "pure", "portal", "collision", "corruption", "death"]) {
  assert.equal(audio.play(name), true);
}
const fragments = instance.sources.slice(1, 4).map(s => s.buffer);
assert.equal(new Set(fragments).size, 3, "three rotating absorption variants");
const loop = instance.sources[0];
audio.setActive(false);
assert.equal(loop.stopped, true);
assert.equal(audio.play("collision"), false, "pause blocks new events");
assert.equal(instance.sources[5].stopped, undefined, "portal tail can finish during story transition");
audio.setActive(false, true);
assert.ok(instance.sources.every(s => s.stopped), "user pause/session replacement stops all voices");
audio.setActive(true);
audio.setHidden(true);
assert.equal(audio.play("fragment"), false);
audio.setHidden(false);
audio.setEnabled(false);
assert.equal(audio.play("portal"), false);
assert.ok(instance.sources.every(s => s.stopped));
audio.setEnabled(true);
for (let i = 0; i < 12; i++) assert.equal(audio.play("fragment"), true);
assert.equal(audio.play("fragment"), false, "polyphony bounded");
await audio.unlock();
assert.equal(fetched, 9, "assets loaded once across gestures");
audio.silence();
const unavailable = createGameplayAudio({ Context: null });
assert.equal(await unavailable.unlock(), false);
assert.equal(unavailable.play("fragment"), false);
const broken = createGameplayAudio({ Context: FakeContext, fetchAudio: async () => { throw Error("offline"); } });
broken.setActive(true); await broken.unlock();
assert.equal(broken.play("portal"), false, "load errors do not interrupt gameplay");
for (const name of Object.values(GAMEPLAY_SOUNDS)) {
  const wav = readFileSync(new URL(`../../assets/audio/sfx/${name}.wav`, import.meta.url));
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 44100);
  assert.equal(wav.readUInt32LE(40), wav.length - 44);
  let peak = 0;
  for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
  assert.ok(peak > 100 && peak < 32000, `${name}: audible, without clipping`);
  if (name.endsWith("loop")) assert.ok(Math.abs(wav.readInt16LE(44) - wav.readInt16LE(wav.length - 2)) < 100,
    "seamless loop boundary");
}
console.log("Gameplay audio: WAV integrity, unlock, variants, pause, mute, hidden page, bounded voices and failures OK");
