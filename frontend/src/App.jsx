import { useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import Lobby from "./components/Lobby";
import RoomLobby from "./components/RoomLobby";
import { GameAudio } from "./game/GameAudio.js";

const getTestSession = () => {
  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  const timeline = params.get("test");
  if (timeline === "icons") return { testMode: true, testPlayerRole: "C", testArea: "icons" };
  if (!["past", "present"].includes(timeline)) return null;
  const area = params.get("area");
  return { testMode: true, timeline, testArea: ["hallway", "children", "bathroom", "kitchen"].includes(area) ? area : "bedroom" };
};

const readSetting = (key, fallback, { min = 0, max = 1 } = {}) => {
  const storedValue = localStorage.getItem(`escape-room-${key}`);
  if (storedValue === null) return fallback;
  const stored = Number(storedValue);
  return Number.isFinite(stored) && stored >= min && stored <= max ? stored : fallback;
};

const App = () => {
  const [session, setSession] = useState(getTestSession);
  const [audioController] = useState(() => new GameAudio());
  const [audioSettings, setAudioSettings] = useState(() => ({
    music: readSetting("music-volume", 1),
    effects: readSetting("effects-volume", 1),
    footsteps: readSetting("footsteps-volume", 1),
  }));
  const [mouseSensitivity, setMouseSensitivity] = useState(() =>
    readSetting("mouse-sensitivity", 1, { min: 0.2, max: 2 }),
  );

  useEffect(() => {
    const audio = audioController;
    const unlockAudio = () => audio.unlock();
    void audio.load();
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [audioController]);

  useEffect(() => {
    audioController.setMusicVolume(audioSettings.music);
    audioController.setEffectsVolume(audioSettings.effects);
    audioController.setFootstepsVolume(audioSettings.footsteps);
  }, [audioController, audioSettings]);

  const changeAudioSetting = (setting, value) => {
    const volume = Math.max(0, Math.min(1, value));
    localStorage.setItem(`escape-room-${setting}-volume`, String(volume));
    setAudioSettings((current) => ({ ...current, [setting]: volume }));
  };

  const changeMouseSensitivity = (value) => {
    const sensitivity = Math.max(0.2, Math.min(2, value));
    localStorage.setItem("escape-room-mouse-sensitivity", String(sensitivity));
    setMouseSensitivity(sensitivity);
  };

  if (!session) {
    return (
      <Lobby
        onEnterLobby={setSession}
        audioSettings={audioSettings}
        onAudioSettingChange={changeAudioSetting}
        mouseSensitivity={mouseSensitivity}
        onMouseSensitivityChange={changeMouseSensitivity}
      />
    );
  }
  if (!session.timeline && !session.testPlayerRole) return <RoomLobby session={session} onStart={setSession} onBack={() => setSession(null)} />;

  return (
    <GameCanvas
      playerRole={session.testPlayerRole ?? (session.timeline === "past" ? "A" : "B")}
      session={session}
      audioController={audioController}
      audioSettings={audioSettings}
      onAudioSettingChange={changeAudioSetting}
      mouseSensitivity={mouseSensitivity}
      onMouseSensitivityChange={changeMouseSensitivity}
      onExit={() => setSession(null)}
    />
  );
};

export default App;
