const soundByAction = {
  roomDoor: {
    open: "doorOpen",
    close: "doorClose",
    locked: "doorLocked",
  },
  cabinetDoor: {
    open: "cabinetOpen",
    close: "cabinetClose",
    locked: "doorLocked",
  },
  drawer: {
    open: "drawerOpen",
    close: "drawerClose",
    locked: "doorLocked",
  },
};

class MechanicalAudio {
  constructor({ kind = "cabinetDoor" } = {}) {
    this.kind = kind;
    this.audioController = null;
  }

  setAudioListener(audioController) {
    this.audioController = audioController;
  }

  play(action) {
    const soundId = soundByAction[this.kind]?.[action];
    if (soundId) this.audioController?.play(soundId);
  }

  dispose() {
    this.audioController = null;
  }
}

export { MechanicalAudio };
