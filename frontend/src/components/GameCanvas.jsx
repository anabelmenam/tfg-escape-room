import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Game } from "../game/Game";
import { GAME_API_URL } from "../services/gameApi";
import AudioSettings from "./AudioSettings";
import MouseSettings from "./MouseSettings";
import LanguageSettings from "./LanguageSettings";
import { t } from "../translations/index.js";

const GameCanvas = ({ playerRole, session, audioController, audioSettings, onAudioSettingChange, mouseSensitivity, onMouseSensitivityChange, onExit, onLanguageChange }) => {
  const ref = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const endingPreviewTimerRef = useRef(null);
  const endingCinematicStartedRef = useRef(false);
  const endingTourStartedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseView, setPauseView] = useState("menu");
  const [showStory, setShowStory] = useState(!session.endingPreview);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [ending, setEnding] = useState(null);
  const [showEndingLight, setShowEndingLight] = useState(false);
  const [endingTourBeat, setEndingTourBeat] = useState(null);
  const [endingTourFade, setEndingTourFade] = useState(false);
  const endingSequenceActive = ["opening", "tour"].includes(ending?.phase) || showEndingLight || endingTourBeat !== null || endingTourFade;

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return undefined;
    }
    let active = true;

    const socket = session.testMode ? null : io(GAME_API_URL, {
      auth: { roomId: session.roomId, playerToken: session.playerToken },
    });
    socketRef.current = socket;
    const playEndingTour = (onComplete) => {
      if (endingTourStartedRef.current) return;
      endingTourStartedRef.current = true;
      window.clearTimeout(endingPreviewTimerRef.current);
      endingPreviewTimerRef.current = window.setTimeout(() => {
        setShowEndingLight(false);
        game.startEndingHouseTour({
          onBeat: (beat) => setEndingTourBeat(beat),
          onFade: (visible) => setEndingTourFade(visible),
          onComplete: () => {
            setEndingTourBeat(null);
            setEndingTourFade(false);
            onComplete?.();
          },
        });
      }, 350);
    };
    const game = new Game(container, playerRole, {
      testArea: session.testMode ? session.testArea : null,
      testMode: session.testMode,
      endingPreview: Boolean(session.endingPreview),
      audioController,
      onReady: () => {
        if (!active) return;
        setIsLoading(false);
      },
      onPauseRequest: () => {
        if (!active) return;
        if (game.paused) {
          game.resume();
          setIsPaused(false);
          return;
        }
        game.pause();
        setPauseView("menu");
        setIsPaused(true);
      },
      onHallwayAction: (type, targetId, payload = {}) => {
        if (session.endingPreview && targetId === "hallway-final-threshold") {
          window.clearTimeout(endingPreviewTimerRef.current);
          endingPreviewTimerRef.current = null;
          if (payload.operation !== "hold-start") return;

          endingPreviewTimerRef.current = window.setTimeout(() => {
            if (!game.input.isPressed("KeyE")) return;
            const openingState = structuredClone(game.sharedState);
            openingState.ending = {
              phase: "opening",
              holding: { past: true, present: true },
              choice: null,
              sacrificeTimeline: null,
            };
            for (const timeline of ["past", "present"]) {
              openingState.timelines[timeline].objects["hallway-street-door"] = { locked: false, open: true };
            }
            game.applySharedState(openingState);
            game.startEndingExit(() => {
              game.pause();
              playEndingTour(() => {
                const choiceState = structuredClone(game.sharedState);
                choiceState.ending = { ...choiceState.ending, phase: "choice" };
                game.applySharedState(choiceState);
              });
            }, () => setShowEndingLight(true));
          }, 850);
          return;
        }
        socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId, payload });
      },
      onBedroomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onChildrenRoomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onKitchenAction: (type, targetId, payload = {}) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId, payload }),
      onLivingRoomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onBathroomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onPlayerMovement: (movement) => socket?.emit("player:movement", movement),
      onDiaryEntry: (entryId) => setDiaryEntries((entries) => entries.includes(entryId) ? entries : [...entries, entryId]),
      onEndingChange: (nextEnding) => {
        if (!session.endingPreview && nextEnding?.phase === "choice" && !endingTourStartedRef.current) {
          setEnding({ ...nextEnding, phase: "tour" });
          playEndingTour(() => setEnding(nextEnding));
          return;
        }
        setEnding(nextEnding);
        if (session.endingPreview || nextEnding?.phase !== "opening" || endingCinematicStartedRef.current) return;
        endingCinematicStartedRef.current = true;
        game.startEndingExit(() => {
          game.pause();
          socket?.emit("game:action", {
            actionId: crypto.randomUUID(),
            type: "object.interact",
            targetId: "hallway-final-crossed",
          });
        }, () => setShowEndingLight(true));
      },
      onDoorUnlocked: () => {
        socket?.emit("game:action", {
          actionId: crypto.randomUUID(),
          type: "object.interact",
          targetId: "bedroom-exit-door",
        });
      },
    });
    gameRef.current = game;
    const applyState = ({ state }) => game.applySharedState(state);

    socket?.on("game:state", applyState);
    socket?.on("game:state-updated", applyState);
    socket?.on("player:moved", (movement) => game.updateRemotePlayer(movement));
    socket?.on("room:presence", (presence) => game.setRemotePlayerConnected(presence));
    socket?.on("lobby:state", (lobby) => {
      const remotePlayer = lobby.players?.find((player) => player.id !== session.playerId);
      if (remotePlayer) game.setRemotePlayerIdentity(remotePlayer);
    });

    return () => {
      active = false;
      window.clearTimeout(endingPreviewTimerRef.current);
      endingCinematicStartedRef.current = false;
      endingTourStartedRef.current = false;
      gameRef.current = null;
      socketRef.current = null;
      socket?.disconnect();
      game.dispose();
    };
  }, [audioController, playerRole, session]);

  useEffect(() => {
    gameRef.current?.player.setMouseSensitivity(mouseSensitivity);
  }, [mouseSensitivity]);

  useEffect(() => {
    if (!["choice", "complete"].includes(ending?.phase)) return;
    gameRef.current?.pause();
    setIsPaused(false);
  }, [ending?.phase]);

  const chooseEnding = (choice) => {
    if (session.endingPreview) {
      setEnding({
        phase: "complete",
        choice,
        sacrificeTimeline: choice === "sacrifice" ? session.timeline : null,
      });
      return;
    }
    socketRef.current?.emit("game:action", {
      actionId: crypto.randomUUID(),
      type: "object.interact",
      targetId: "hallway-final-choice",
      payload: { choice },
    });
  };

  const resumeGame = () => {
    gameRef.current?.resume();
    setPauseView("menu");
    setIsPaused(false);
  };

  return (
    <div
      ref={ref}
      className={`relative ${endingSequenceActive ? "ending-cinematic" : ""}`}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      {showStory && !isLoading && playerRole !== "C" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6 text-amber-50">
          <div className="max-w-2xl border border-amber-100/25 bg-[#211712] p-8 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-amber-300">{t("ui.story")}</p>
            <h1 className="mt-3 font-serif text-4xl">{t(`story.${session.timeline === "past" ? "pastTitle" : "presentTitle"}`)}</h1>
            <p className="mt-5 font-serif text-lg italic leading-relaxed text-amber-50/85">{t(`story.${session.timeline === "past" ? "past" : "present"}`)}</p>
            <button type="button" onClick={() => setShowStory(false)} className="mt-7 w-full bg-amber-200 px-5 py-3 font-semibold text-stone-900">{t("ui.continue")}</button>
          </div>
        </div>
      )}
      {showEndingLight && (
        <div className="pointer-events-none absolute inset-0 z-[65] flex items-center justify-center overflow-hidden">
          <div className="ending-light-bloom h-[10vmin] w-[10vmin] rounded-full bg-white shadow-[0_0_45px_30px_rgba(255,246,218,.98)]" />
        </div>
      )}
      {endingTourBeat !== null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[60] flex justify-center px-6">
          <p key={endingTourBeat} className="max-w-3xl animate-pulse bg-black/65 px-7 py-4 text-center font-serif text-xl italic leading-relaxed text-amber-50 shadow-2xl">
            {t(`finalTour.line${endingTourBeat + 1}`)}
          </p>
        </div>
      )}
      <div className={`pointer-events-none absolute inset-0 z-[63] bg-[#f4efe5] transition-opacity duration-500 ${endingTourFade ? "opacity-100" : "opacity-0"}`} />
      {["choice", "complete"].includes(ending?.phase) && (
        <div className="ending-screen-in absolute inset-0 z-[70] flex items-center justify-center overflow-hidden bg-white p-6 text-stone-900">
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(238,224,195,.92)_48%,rgba(40,29,24,.96)_100%)]" />
          <div className="ending-panel-in relative w-full max-w-3xl rounded-sm border border-stone-900/20 bg-[#efe4cd]/95 p-7 text-center shadow-2xl">
            {ending.phase === "complete" && <div className="relative mx-auto aspect-[4/3] max-h-[46vh] overflow-hidden border-[10px] border-[#5a3d29] bg-stone-300 shadow-xl">
              <img src="/images/puzzles/family-photo-1998.png" alt={t("ending.familyPhotoAlt")} className={`h-full w-full object-cover ${ending.phase === "complete" && ending.choice === "sacrifice" ? "opacity-70 grayscale-[.25]" : ""}`} />
              {ending.phase === "complete" && ending.choice === "sacrifice" && (
                <div
                  className="absolute inset-y-0 bg-gradient-to-r from-white/85 via-white/60 to-transparent blur-[2px]"
                  style={{ left: ending.sacrificeTimeline === "past" ? "26%" : "0%", width: ending.sacrificeTimeline === "past" ? "31%" : "29%" }}
                />
              )}
            </div>}
            {ending.phase === "choice" ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[.38em] text-stone-600">Escape room</p>
                <h1 className="mt-5 font-serif text-7xl font-semibold tracking-[.18em]">{t("finalScreen.title")}</h1>
                <p className="mx-auto mt-6 max-w-xl font-serif text-xl italic leading-relaxed">{t("finalScreen.text")}</p>
                <button type="button" onClick={onExit} className="mt-9 bg-stone-800 px-10 py-4 font-semibold text-amber-50 hover:bg-stone-700">{t("finalScreen.back")}</button>
              </>
            ) : (
              <>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.28em] text-stone-600">{t("ending.title")}</p>
                <h1 className="mt-4 font-serif text-3xl">{t(ending.choice === "together" ? "ending.togetherTitle" : "ending.sacrificeTitle")}</h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic leading-relaxed">
                  {ending.choice === "together"
                    ? t("ending.togetherText")
                    : t(ending.sacrificeTimeline === session.timeline ? "ending.youStayedText" : "ending.companionStayedText")}
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {session.endingPreview && (
                    <button type="button" onClick={() => window.location.reload()} className="border border-stone-700 px-8 py-3 font-semibold hover:bg-stone-900/10">Probar desde la puerta</button>
                  )}
                  <button type="button" onClick={onExit} className="bg-stone-800 px-8 py-3 font-semibold text-amber-50 hover:bg-stone-700">{t("ending.returnToLobby")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#100d0c] text-amber-50">
          <div className="flex w-72 flex-col items-center text-center">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-amber-100/15 border-t-amber-300" />
            <h1 className="font-serif text-2xl font-semibold tracking-wide">Preparando la casa</h1>
            <p className="mt-2 text-sm text-amber-100/65">Cargando habitaciones, objetos y recuerdos…</p>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-amber-50/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300/70" />
            </div>
          </div>
        </div>
      )}
      {isPaused && !isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-6 text-amber-50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-amber-100/25 bg-[#211712]/95 p-7 shadow-2xl">
            {pauseView === "menu" ? (
              <>
                <h1 className="text-center font-serif text-3xl font-semibold">{t("ui.pause")}</h1>
                <div className="mt-7 flex flex-col gap-3">
                  <button type="button" onPointerDown={resumeGame} className="rounded-lg bg-amber-200 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-100">{t("ui.resume")}</button>
                  <button type="button" onClick={() => setPauseView("diary")} className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">{t("ui.diary")}</button>
                  <button type="button" onClick={() => setPauseView("settings")} className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Ajustes de sonido</button>
                  <button type="button" onClick={() => setPauseView("controls")} className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Controles</button>
                  <button type="button" onClick={onExit} className="rounded-lg border border-red-300/35 px-5 py-3 font-semibold text-red-100 hover:bg-red-400/10">Salir de la partida</button>
                </div>
              </>
            ) : pauseView === "diary" ? (
              <>
                <h1 className="font-serif text-3xl font-semibold">{t("ui.diary")}</h1>
                <div className="mt-5 max-h-[55vh] space-y-4 overflow-y-auto">
                  {diaryEntries.length === 0 && <p className="italic text-amber-100/65">{t("ui.emptyDiary")}</p>}
                  {diaryEntries.map((entryId) => <article key={entryId} className="border-l-2 border-amber-300/40 pl-4 font-serif italic leading-relaxed"><h2 className="not-italic font-semibold">{t(`papers.${entryId}`)}</h2></article>)}
                </div>
                <button type="button" onClick={() => setPauseView("menu")} className="mt-7 w-full rounded-lg border border-amber-100/35 px-5 py-3 font-semibold">{t("ui.close")}</button>
              </>
            ) : pauseView === "controls" ? (
              <>
                <h1 className="font-serif text-3xl font-semibold">Controles</h1>
                <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
                  <span className="font-semibold text-amber-200">W A S D</span><span>Moverse</span>
                  <span className="font-semibold text-amber-200">Ratón</span><span>Mirar y seleccionar</span>
                  <span className="font-semibold text-amber-200">E</span><span>Interactuar, recoger o colocar</span>
                  <span className="font-semibold text-amber-200">Ctrl</span><span>Correr</span>
                  <span className="font-semibold text-amber-200">Mayús</span><span>Agacharse o levantarse</span>
                  <span className="font-semibold text-amber-200">Espacio</span><span>Saltar</span>
                  <span className="font-semibold text-amber-200">Q</span><span>Encender o apagar la linterna</span>
                  <span className="font-semibold text-amber-200">1–5 / rueda</span><span>Cambiar objeto del inventario</span>
                  <span className="font-semibold text-amber-200">I / R</span><span>Examinar ciertos objetos</span>
                  <span className="font-semibold text-amber-200">F</span><span>Cambiar la vista</span>
                  <span className="font-semibold text-amber-200">Esc</span><span>Pausar o cerrar una inspección</span>
                </div>
                <button type="button" onClick={() => setPauseView("menu")} className="mt-7 w-full rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Volver</button>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl font-semibold">Ajustes de sonido</h1>
                <p className="mt-2 text-sm text-amber-100/65">Los cambios se aplican al instante y también se guardan para la próxima partida.</p>
                <div className="mt-2">
                  <AudioSettings idPrefix="pause" settings={audioSettings} onChange={onAudioSettingChange} />
                  <MouseSettings idPrefix="pause" sensitivity={mouseSensitivity} onChange={onMouseSensitivityChange} />
                  <LanguageSettings onChange={onLanguageChange} />
                </div>
                <button type="button" onClick={() => setPauseView("menu")} className="mt-5 w-full rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Volver</button>
              </>
            )}
          </div>
        </div>
      )}
      {session.testMode && (
        <div className="absolute left-4 top-4 z-20 rounded border border-amber-200/40 bg-black/80 p-3 text-sm text-amber-50">
          <p className="font-bold">Pruebas · {session.endingPreview ? "Final" : session.testArea === "icons" ? "Estudio de iconos" : `${session.timeline === "past" ? "Mundo A" : "Mundo B"} · ${{ hallway: "Pasillo", children: "Habitación infantil", bathroom: "Baño", kitchen: "Cocina", bedroom: "Dormitorio" }[session.testArea]}`}</p>
          <p className="mt-1 text-xs">Esc libera el cursor · Recargar reinicia la prueba</p>
          <div className="mt-2 flex gap-4 underline">
            {session.testArea !== "icons" && <>
              <a href={`?test=${session.timeline === "past" ? "present" : "past"}&area=${session.testArea}`}>Cambiar mundo</a>
              <a href={`?test=${session.timeline}&area=${{ bedroom: "hallway", hallway: "children", children: "bathroom", bathroom: "kitchen", kitchen: "bedroom" }[session.testArea]}`}>Cambiar zona</a>
            </>}
            <a href={window.location.pathname}>Salir de pruebas</a>
          </div>
        </div>
      )}
      {playerRole !== "C" && (
        <div
          id="crosshair"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
        />
      )}

      <div
        id="ambient-inspection"
        className="pointer-events-none absolute bottom-40 left-1/2 z-20 hidden max-w-xl -translate-x-1/2 rounded border border-amber-100/20 bg-black/80 px-5 py-3 text-center font-serif italic text-amber-50"
      />
      <div
        id="interaction-text"
        className="pointer-events-none absolute bottom-32 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-black/70 px-4 py-2 text-lg font-semibold text-white"
      />

      <p id="inventory-selected-name" className="pointer-events-none absolute bottom-24 left-1/2 z-20 hidden -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm font-semibold text-amber-50" />
      <div id="inventory" className="pointer-events-none absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            id={`inventory-slot-${index}`}
            className="relative flex h-16 w-16 items-center justify-center rounded border-2 border-white/50 bg-[#9B8065]"
          >
            <span className="absolute left-1 top-0.5 text-xs text-white/70">{index + 1}</span>

            <div id={`inventory-item-${index}`} className="flex h-full w-full items-center justify-center" />
          </div>
        ))}
      </div>

      <div
        id="inventory-inspection"
        className="pointer-events-auto absolute inset-0 z-30 hidden items-center justify-center bg-black/80 p-8"
      >
        <div className="relative max-h-full max-w-4xl rounded-lg border border-amber-100/30 bg-[#251913] p-4 shadow-2xl">
          <button
            id="inventory-inspection-close"
            type="button"
            aria-label="Cerrar inspección"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-xl font-semibold leading-none text-white hover:bg-black"
          >
            ×
          </button>
          <img id="inventory-inspection-image" className="max-h-[76vh] max-w-full object-contain" alt="" />
          <p id="inventory-inspection-title" className="mt-3 text-center text-lg font-semibold text-amber-50" />
          <p id="inventory-inspection-translation" className="mt-3 max-w-3xl text-center font-serif italic leading-relaxed text-amber-100/85" />
          <p id="inventory-inspection-hint" className="mt-1 text-center text-sm text-amber-100/70" />
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
