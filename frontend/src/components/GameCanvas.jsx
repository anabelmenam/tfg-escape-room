import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Game } from "../game/Game";
import { GAME_API_URL } from "../services/gameApi";

const GameCanvas = ({ playerRole, session }) => {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return undefined;
    }

    const socket = session.testMode ? null : io(GAME_API_URL, {
      auth: { roomId: session.roomId, playerToken: session.playerToken },
    });
    const game = new Game(container, playerRole, {
      testArea: session.testMode ? session.testArea : null,
      testMode: session.testMode,
      onHallwayAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
      onBedroomAction: (type, targetId) => socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId }),
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
    const applyState = ({ state }) => game.applySharedState(state);

    socket?.on("game:state", applyState);
    socket?.on("game:state-updated", applyState);

    return () => {
      socket?.disconnect();
      game.dispose();
    };
  }, [playerRole, session]);

  return (
    <div
      ref={ref}
      className="relative"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
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
