import * as THREE from "three";

const bufferCache = new WeakMap();

const seededNoise = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return (value / 4294967296) * 2 - 1;
  };
};

const createBuffer = (context, kind, action) => {
  const duration = 1;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  const seedByKind = { drawer: 9187, cabinetDoor: 4513, roomDoor: 2719 };
  const random = seededNoise(seedByKind[kind] ?? 4513);
  let smoothNoise = 0;
  let slowNoise = 0;

  for (let index = 0; index < length; index += 1) {
    const time = index / context.sampleRate;
    const progress = time / duration;
    const movementEnvelope = Math.pow(Math.sin(Math.PI * progress), 0.7);
    smoothNoise = smoothNoise * 0.9 + random() * 0.1;
    slowNoise = slowNoise * 0.986 + random() * 0.014;

    let sample = 0;
    if (kind === "drawer") {
      const railPulse = 0.55 + Math.sin(progress * Math.PI * 28) * 0.2;
      const scrape = (smoothNoise * 0.4 + random() * 0.035) * railPulse;
      const woodTone = Math.sin(2 * Math.PI * (64 + progress * 22) * time) * 0.04;
      sample = (scrape + woodTone) * movementEnvelope * 0.72;
    } else if (kind === "roomDoor") {
      const woodFlex = 0.64 + Math.sin(progress * Math.PI * 4.2) * 0.19;
      const lowFriction = slowNoise * 0.42;
      const hingeFriction = smoothNoise * 0.12 + random() * 0.012;
      sample = (lowFriction + hingeFriction) * movementEnvelope * woodFlex;
    } else {
      const hingePulse = 0.58 + Math.sin(progress * Math.PI * 3.4) * 0.16;
      const dryHinge = smoothNoise * 0.13 + slowNoise * 0.1 + random() * 0.009;
      sample = dryHinge * movementEnvelope * hingePulse;
    }

    if (action === "locked") {
      const firstRattle = Math.exp(-Math.pow((progress - 0.22) / 0.035, 2));
      const secondRattle = Math.exp(-Math.pow((progress - 0.56) / 0.04, 2));
      const rattleTone = Math.sin(2 * Math.PI * 96 * time) * 0.45 + random() * 0.55;
      sample = (firstRattle + secondRattle * 0.72) * rattleTone * 0.65;
    } else {
      const isClosing = action === "close";
      const impactCenter = isClosing ? 0.95 : 0.91;
      const kindStrength = kind === "roomDoor" ? 0.56 : kind === "drawer" ? 0.5 : 0.3;
      if (kind === "drawer") {
        const impactWidth = isClosing ? 0.014 : 0.025;
        const impact = Math.exp(-Math.pow((progress - impactCenter) / impactWidth, 2));
        const impactTone = Math.sin(2 * Math.PI * 112 * time);
        const impactStrength = isClosing ? kindStrength : kindStrength * 0.36;
        sample += impact * (impactTone * 0.58 + random() * 0.42) * impactStrength;
      } else if (progress >= impactCenter) {
        const impactTime = (progress - impactCenter) * duration;
        const decay = Math.exp(-impactTime * (kind === "roomDoor" ? 48 : 72));
        const frequency = kind === "roomDoor" ? 58 : 84;
        const woodenThud = Math.sin(2 * Math.PI * frequency * impactTime) * 0.68 + slowNoise * 0.32;
        const impactStrength = isClosing ? kindStrength : kindStrength * 0.22;
        sample += woodenThud * decay * impactStrength;
      }

      if (action === "open") {
        const release = Math.exp(-Math.pow((progress - 0.055) / 0.018, 2));
        if (kind === "drawer") {
          sample += release * Math.sin(2 * Math.PI * 175 * time) * 0.22;
        } else {
          const latchFrequency = kind === "roomDoor" ? 105 : 138;
          const latch = Math.sin(2 * Math.PI * latchFrequency * time) * 0.45 + random() * 0.55;
          sample += release * latch * (kind === "roomDoor" ? 0.3 : 0.2);
        }
      }
    }

    const fade = Math.min(1, progress * 80, (1 - progress) * 80);
    data[index] = THREE.MathUtils.clamp(sample * fade, -1, 1);
  }

  return buffer;
};

const getBuffer = (context, kind, action) => {
  let contextBuffers = bufferCache.get(context);
  if (!contextBuffers) {
    contextBuffers = new Map();
    bufferCache.set(context, contextBuffers);
  }
  const key = `${kind}-${action}`;
  if (!contextBuffers.has(key)) {
    contextBuffers.set(key, createBuffer(context, kind, action));
  }
  return contextBuffers.get(key);
};

class MechanicalAudio {
  constructor({ kind = "door", volume = 0.42 } = {}) {
    this.kind = kind;
    this.volume = volume;
    this.sound = null;
  }

  setAudioListener(listener, anchor) {
    if (this.sound || !listener || !anchor) return;
    this.sound = new THREE.PositionalAudio(listener);
    this.sound.setVolume(this.volume);
    this.sound.setDistanceModel("linear");
    this.sound.setRefDistance(2.5);
    this.sound.setMaxDistance(18);
    this.sound.setRolloffFactor(1);
    anchor.add(this.sound);
  }

  play(action, duration) {
    const sound = this.sound;
    if (!sound || sound.context.state !== "running") return;
    const buffer = getBuffer(sound.context, this.kind, action);
    if (sound.isPlaying) sound.stop();
    sound.setBuffer(buffer);
    sound.setPlaybackRate(buffer.duration / Math.max(0.2, duration));
    sound.play();
  }

  dispose() {
    if (!this.sound) return;
    if (this.sound.isPlaying) this.sound.stop();
    this.sound.disconnect();
    this.sound.removeFromParent();
    this.sound = null;
  }
}

export { MechanicalAudio };
