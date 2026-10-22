import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Game } from "../game/Game";
import { GAME_API_URL } from "../services/gameApi";
import AudioSettings from "./AudioSettings";
import MouseSettings from "./MouseSettings";

const GameCanvas = ({ playerRole, session, audioController, audioSettings, onAudioSettingChange, mouseSensitivity, onMouseSensitivityChange, onExit }) => {
  const ref = useRef(null);
  const gameRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseView, setPauseView] = useState("menu");

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return undefined;
    }
    let active = true;

    const socket = session.testMode ? null : io(GAME_API_URL, {
      auth: { roomId: session.roomId, playerToken: session.playerToken },
    });
    const game = new Game(container, playerRole, {
      testArea: session.testMode ? session.testArea : null,
      testMode: session.testMode,
      audioController,
      onReady: () => { if (active) setIsLoading(false); },
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
      onHallwayAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onBedroomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onChildrenRoomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onKitchenAction: (type, targetId, payload = {}) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId, payload }),
      onLivingRoomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onBathroomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
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

    return () => {
      active = false;
      gameRef.current = null;
      socket?.disconnect();
      game.dispose();
    };
  }, [audioController, playerRole, session]);

  useEffect(() => {
    gameRef.current?.player.setMouseSensitivity(mouseSensitivity);
  }, [mouseSensitivity]);

  const resumeGame = () => {
    gameRef.current?.resume();
    setPauseView("menu");
    setIsPaused(false);
  };

  return (
    <div
      ref={ref}
      className="relative"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
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
                <h1 className="text-center font-serif text-3xl font-semibold">Partida en pausa</h1>
                <div className="mt-7 flex flex-col gap-3">
                  <button type="button" onPointerDown={resumeGame} className="rounded-lg bg-amber-200 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-100">Reanudar</button>
                  <button type="button" onClick={() => setPauseView("settings")} className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Ajustes de sonido</button>
                  <button type="button" onClick={() => setPauseView("controls")} className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Controles</button>
                  <button type="button" onClick={onExit} className="rounded-lg border border-red-300/35 px-5 py-3 font-semibold text-red-100 hover:bg-red-400/10">Salir de la partida</button>
                </div>
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
                </div>
                <button type="button" onClick={() => setPauseView("menu")} className="mt-5 w-full rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10">Volver</button>
              </>
            )}
          </div>
        </div>
      )}
      {session.testMode && (
        <div className="absolute left-4 top-4 z-20 rounded border border-amber-200/40 bg-black/80 p-3 text-sm text-amber-50">
          <p className="font-bold">Pruebas · {session.testArea === "icons" ? "Estudio de iconos" : `${session.timeline === "past" ? "Mundo A" : "Mundo B"} · ${{ hallway: "Pasillo", children: "Habitación infantil", bathroom: "Baño", kitchen: "Cocina", bedroom: "Dormitorio" }[session.testArea]}`}</p>
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
          <p id="inventory-inspection-hint" className="mt-1 text-center text-sm text-amber-100/70" />
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
