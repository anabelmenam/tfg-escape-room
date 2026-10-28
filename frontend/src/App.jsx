import { useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas.jsx";
import Lobby from "./components/Lobby.jsx";
import RoomLobby from "./components/RoomLobby.jsx";
import AccountAccess from "./components/AccountAccess.jsx";
import { GameAudio } from "./game/GameAudio.js";
import { getLanguage } from "./translations/index.js";
import { getCurrentAccount, logoutAccount } from "./services/gameApi.js";

const getTestSession = () => {
  const params = new URLSearchParams(window.location.search);
  const requestedCharacter = params.get("character");
  const legacyTest = params.get("test");
  if (legacyTest === "icons") return { testMode: true, testPlayerRole: "C", testArea: "icons" };
  if (legacyTest === "ending") return { testMode: true, character: "dad", testArea: "hallway", endingPreview: true, endingReplay: true };
  const character = requestedCharacter ?? (legacyTest === "mum" ? "mum" : legacyTest === "dad" ? "dad" : null);
  if (!["mum", "dad"].includes(character)) return null;
  return { testMode: true, adminTour: true, character, testArea: "bedroom" };
};

const requestedTestSession = getTestSession();
const passwordResetRequested = new URLSearchParams(window.location.search).has("resetToken");

const readSetting = (key, fallback, { min = 0, max = 1 } = {}) => {
  const storedValue = localStorage.getItem(`escape-room-${key}`);
  if (storedValue === null) return fallback;
  const stored = Number(storedValue);
  return Number.isFinite(stored) && stored >= min && stored <= max ? stored : fallback;
};

const App = () => {
  const testSession = import.meta.env?.DEV ? requestedTestSession : null;
  const [session, setSession] = useState(testSession);
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(!testSession && !passwordResetRequested);
  const [language, setLanguageState] = useState(getLanguage);
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

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (testSession || passwordResetRequested) return;
    getCurrentAccount().then(({ user }) => {
      setAccount(user);
      if (user.role === "admin" && requestedTestSession) setSession(requestedTestSession);
    }).catch(() => setAccount(null)).finally(() => setAccountLoading(false));
  }, [testSession]);

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

  if (accountLoading) return <main className="flex min-h-screen items-center justify-center bg-[#110f10] text-[#d8aa64]">{getLanguage() === "es" ? "Cargando…" : "Loading…"}</main>;
  if (passwordResetRequested || (!testSession && !account)) return <AccountAccess onAuthenticated={setAccount} />;

  if (!session) {
    return (
      <Lobby
        account={account}
        onLogout={async () => { await logoutAccount(); setAccount(null); setSession(null); }}
        language={language}
        onLanguageChange={setLanguageState}
        onEnterLobby={setSession}
        audioSettings={audioSettings}
        onAudioSettingChange={changeAudioSetting}
        mouseSensitivity={mouseSensitivity}
        onMouseSensitivityChange={changeMouseSensitivity}
      />
    );
  }
  if ((!session.character || session.status === "waiting") && !session.testPlayerRole) {
    return <RoomLobby session={session} onStart={setSession} onBack={() => setSession(null)} />;
  }

  return (
    <GameCanvas
      playerRole={session.testPlayerRole ?? (session.character === "mum" ? "A" : "B")}
      session={session}
      isAdmin={account?.role === "admin"}
      language={language}
      onLanguageChange={setLanguageState}
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
