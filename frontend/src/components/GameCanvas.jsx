import { useEffect, useRef, useState } from "react";
import EndingOverlay from "./ending/EndingOverlay.jsx";
import useEndingSequence from "./ending/useEndingSequence.js";
import GameHud from "./game/GameHud.jsx";
import LoadingOverlay from "./game/LoadingOverlay.jsx";
import PauseOverlay from "./game/PauseOverlay.jsx";
import StoryOverlay from "./game/StoryOverlay.jsx";
import TestModePanel from "./game/TestModePanel.jsx";
import useGameSession from "./game/useGameSession.js";
import { getPlayerHint } from "../game/hints/getPlayerHint.js";
import { t } from "../translations/index.js";

const testDiaryEntries = Array.from({ length: 10 }, (_, index) => `family-note-${String(index + 1).padStart(2, "0")}`);

const GameCanvas = ({ playerRole, session, isAdmin, audioController, audioSettings, onAudioSettingChange, mouseSensitivity, onMouseSensitivityChange, onExit, onLanguageChange }) => {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseView, setPauseView] = useState("menu");
  const [showStory, setShowStory] = useState(Boolean(session.showIntroduction) && !session.endingPreview);
  const [diaryEntries, setDiaryEntries] = useState(() => session.testMode ? testDiaryEntries : []);
  const [hintHistory, setHintHistory] = useState(() => (session.checkpoint?.hintHistory ?? []).slice(-1));
  const [companionConnected, setCompanionConnected] = useState(Boolean(session.testMode));
  const hintCountsRef = useRef({});
  const endingSequence = useEndingSequence({ session, gameRef, setIsPaused });

  useGameSession({
    containerRef,
    gameRef,
    socketRef,
    playerRole,
    session,
    isAdmin,
    audioController,
    endingSequence,
    setIsLoading,
    setIsPaused,
    setPauseView,
    setDiaryEntries,
    setHintHistory,
    setCompanionConnected,
  });

  useEffect(() => {
    if (session.testMode) return;
    socketRef.current?.emit("player:checkpoint-meta", { diaryEntries, hintHistory });
  }, [diaryEntries, hintHistory, session.testMode]);

  useEffect(() => {
    gameRef.current?.player.setMouseSensitivity(mouseSensitivity);
  }, [mouseSensitivity]);

  const resumeGame = () => {
    gameRef.current?.resume();
    setPauseView("menu");
    setIsPaused(false);
  };

  const requestHint = () => {
    const game = gameRef.current;
    const hintId = getPlayerHint({
      state: game?.sharedState,
      character: session.character,
      inventoryIds: game?.player.inventory.getAll().filter(Boolean).map((item) => item.id) ?? [],
    });
    const variants = t(`hints.messages.${hintId}`);
    const requestCount = hintCountsRef.current[hintId] ?? 0;
    const messages = Array.isArray(variants) ? variants : [variants];
    const text = messages[requestCount % messages.length];
    hintCountsRef.current[hintId] = requestCount + 1;
    setHintHistory([{ id: `${hintId}-${Date.now()}`, text }]);
    setPauseView("hints");
  };

  return (
    <div ref={containerRef} className={`relative ${endingSequence.active ? "ending-cinematic" : ""}`} style={{ width: "100vw", height: "100vh" }}>
      {showStory && !isLoading && playerRole !== "C" && <StoryOverlay character={session.character} onContinue={() => setShowStory(false)} />}
      <EndingOverlay ending={endingSequence.ending} showLight={endingSequence.showLight} tourBeat={endingSequence.tourBeat} tourFade={endingSequence.tourFade} character={session.character} endingPreview={session.endingPreview} onExit={onExit} />
      {isLoading && <LoadingOverlay />}
      {!session.testMode && !isLoading && !companionConnected && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-6 text-center text-[#f2e7d1]">
          <div className="max-w-md border border-[#d7b77b]/40 bg-[#211916] p-9 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("multiplayer.paused")}</p>
            <h1 className="mt-3 font-serif text-4xl text-[#f5e8ce]">{t("multiplayer.waiting")}</h1>
            <p className="mt-4 leading-relaxed text-[#c9ba9e]">{t("multiplayer.required")}</p>
            <button type="button" onClick={onExit} className="mt-7 border border-[#806644] px-5 py-2.5 hover:border-[#d7b77b]">{t("ui.exitGame")}</button>
          </div>
        </div>
      )}
      {isPaused && !isLoading && <PauseOverlay
        view={pauseView}
        setView={setPauseView}
        diaryEntries={diaryEntries}
        hintHistory={hintHistory}
        isAdmin={isAdmin}
        onRequestHint={requestHint}
        onResume={resumeGame}
        onExit={onExit}
        audioSettings={audioSettings}
        onAudioSettingChange={onAudioSettingChange}
        mouseSensitivity={mouseSensitivity}
        onMouseSensitivityChange={onMouseSensitivityChange}
        onLanguageChange={onLanguageChange}
      />}
      {session.testMode && <TestModePanel session={session} />}
      <GameHud showCrosshair={playerRole !== "C"} />
    </div>
  );
};

export default GameCanvas;
