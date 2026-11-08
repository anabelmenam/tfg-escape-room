const AUDIO_LIBRARY = {
  music: { src: "/audio/full-of-memories.ogg", volume: 0.08, loop: true },
  puzzleComplete: { src: "/audio/puzzle-complete.mp3", volume: 0.9 },
  itemPickup: { src: "/audio/item-pickup-click.wav", volume: 0.72 },
  footstep1: { src: "/audio/footstep-1.ogg", volume: 0.9 },
  footstep2: { src: "/audio/footstep-2.ogg", volume: 0.9 },
  footstep3: { src: "/audio/footstep-3.ogg", volume: 0.9 },
  footstep4: { src: "/audio/footstep-4.ogg", volume: 0.9 },
  doorOpen: { src: "/audio/door_open.wav", volume: 0.72 },
  doorClose: { src: "/audio/door_close.wav", volume: 0.72 },
  doorLocked: { src: "/audio/cant_open.wav", volume: 0.75 },
  cabinetOpen: { src: "/audio/door_creak_open.wav", volume: 0.62 },
  cabinetClose: { src: "/audio/door_creak_close.wav", volume: 0.62 },
  drawerOpen: { src: "/audio/drawer_open.wav", volume: 0.68 },
  drawerClose: { src: "/audio/drawer_close.wav", volume: 0.68 },
  xylophoneNote: { src: "/audio/child's_xylophone-1.ogg", volume: 0.58 },
  switchToggle: { src: "/audio/lock-door.mp3", volume: 0.28 },
};

class GameAudio {
  constructor() {
    this.musicVolume = 1;
    this.effectsVolume = 1;
    this.footstepsVolume = 1;
    this.loadPromise = null;
    this.stepTimer = 0;
    this.stepIndex = 0;
    this.effectsUnlocked = false;
    this.toneContext = null;
    this.tracks = new Map();
    Object.entries(AUDIO_LIBRARY).forEach(([id, config]) => {
      const audio = new Audio(config.src);
      audio.preload = "auto";
      audio.loop = Boolean(config.loop);
      audio.volume = config.volume;
      this.tracks.set(id, { audio, config });
    });
  }

  async load() {
    this.loadPromise ??= Promise.all(
      [...this.tracks.values()].map(
        ({ audio }) =>
          new Promise((resolve) => {
            if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
              resolve();
              return;
            }
            const finish = () => {
              audio.removeEventListener("canplaythrough", finish);
              audio.removeEventListener("error", finish);
              resolve();
            };
            audio.addEventListener("canplaythrough", finish, { once: true });
            audio.addEventListener("error", finish, { once: true });
            audio.load();
          }),
      ),
    );
    await this.loadPromise;
  }

  unlock() {
    const music = this.tracks.get("music")?.audio;
    if (music?.paused) void music.play().catch(() => {});
    if (this.effectsUnlocked) return;
    this.toneContext ??= new AudioContext();
    if (this.toneContext.state === "suspended") void this.toneContext.resume();
    this.effectsUnlocked = true;
    this.tracks.forEach(({ audio, config }, id) => {
      if (id === "music") return;
      const volume = audio.volume;
      audio.volume = 0;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = config.volume * (id.startsWith("footstep") ? this.footstepsVolume : this.effectsVolume);
        })
        .catch(() => {
          this.effectsUnlocked = false;
          audio.volume = volume;
        });
    });
  }

  play(id, { playbackRate = 1, overlap = false } = {}) {
    const entry = this.tracks.get(id);
    if (!entry) return;
    const { audio: sourceAudio, config } = entry;
    const audio = overlap ? sourceAudio.cloneNode() : sourceAudio;
    if (!overlap) {
      audio.pause();
      audio.currentTime = 0;
    }
    audio.playbackRate = playbackRate;
    audio.volume = config.volume * (id.startsWith("footstep") ? this.footstepsVolume : this.effectsVolume);
    void audio.play().catch(() => {});
  }

  playXylophoneTone(frequency) {
    this.toneContext ??= new AudioContext();
    if (this.toneContext.state === "suspended") void this.toneContext.resume();
    const start = this.toneContext.currentTime;
    const gain = this.toneContext.createGain();
    const fundamental = this.toneContext.createOscillator();
    const overtone = this.toneContext.createOscillator();
    fundamental.type = "sine";
    overtone.type = "sine";
    fundamental.frequency.setValueAtTime(frequency, start);
    overtone.frequency.setValueAtTime(frequency * 3, start);
    const volume = 0.16 * this.effectsVolume;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.75);
    fundamental.connect(gain);
    overtone.connect(gain);
    gain.connect(this.toneContext.destination);
    fundamental.start(start);
    overtone.start(start);
    fundamental.stop(start + 0.76);
    overtone.stop(start + 0.76);
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    const entry = this.tracks.get("music");
    if (entry) entry.audio.volume = entry.config.volume * this.musicVolume;
  }

  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  setFootstepsVolume(volume) {
    this.footstepsVolume = Math.max(0, Math.min(1, volume));
  }

  playAction(type) {
    if (type === "puzzle.solved") this.play("puzzleComplete");
  }

  playPickup() {
    this.play("itemPickup");
  }

  updateFootsteps(deltaTime, { moving, running, crouching, grounded }) {
    if (!moving || !grounded) {
      this.stepTimer = 0;
      return;
    }
    this.stepTimer -= deltaTime;
    if (this.stepTimer > 0) return;
    this.play(`footstep${(this.stepIndex % 4) + 1}`);
    this.stepIndex += 1;
    this.stepTimer = crouching ? 0.72 : running ? 0.32 : 0.5;
  }

  dispose() {
    this.tracks.forEach(({ audio }) => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    });
    this.tracks.clear();
    void this.toneContext?.close();
    this.toneContext = null;
  }
}

export { GameAudio };
