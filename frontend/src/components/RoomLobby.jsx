import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { GAME_API_URL } from "../services/gameApi";

const timelineInfo = {
  past: { title: "Mundo A", subtitle: "Una realidad de la casa", symbol: "◇" },
  present: { title: "Mundo B", subtitle: "La realidad paralela de la casa", symbol: "◆" },
};

const RoomLobby = ({ session, onStart, onBack }) => {
  const socketRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [connectionState, setConnectionState] = useState("Conectando con la sala…");
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(GAME_API_URL, {
      auth: { roomId: session.roomId, playerToken: session.playerToken },
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnectionState("Conectado"));
    socket.on("connect_error", () => setConnectionState("No se ha podido conectar con la sala"));
    socket.on("lobby:state", (lobby) => setPlayers(lobby.players ?? []));
    socket.on("game:started", (lobby) => {
      const ownPlayer = lobby.players?.find((player) => player.id === session.playerId);
      if (ownPlayer?.timeline) onStart({ ...session, timeline: ownPlayer.timeline });
    });

    return () => socket.disconnect();
  }, [onStart, session]);

  const chooseTimeline = (timeline) => {
    setError("");
    socketRef.current?.emit("lobby:select-timeline", { timeline }, (result) => {
      if (!result?.ok) setError(result?.error ?? "No se ha podido elegir ese mundo.");
    });
  };

  const startGame = () => {
    setError("");
    socketRef.current?.emit("lobby:start", (result) => {
      if (!result?.ok) setError(result?.error ?? "No se puede iniciar la partida.");
    });
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(session.joinCode);
  };

  const playerInTimeline = (timeline) => players.find((player) => player.timeline === timeline);
  const ownPlayer = players.find((player) => player.id === session.playerId);
  const bothPlayersReady = players.length === 2 && Boolean(playerInTimeline("past")) && Boolean(playerInTimeline("present"));

  return (
    <main className="min-h-screen bg-[#110f10] px-5 py-7 text-[#f2e7d1]" style={{ backgroundImage: "radial-gradient(circle at 20% 45%, rgb(111 60 31 / 30%), transparent 27%), radial-gradient(circle at 80% 45%, rgb(48 87 99 / 28%), transparent 27%)" }}>
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4 border-b border-[#d7b77b]/25 pb-4">
        <button type="button" className="text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce]" onClick={onBack}>← Salir de la sala</button>
        <div><p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Sala {session.joinCode ?? ""}</p><p className="text-right text-xs text-[#958772]">{connectionState}</p></div>
      </header>

      <section className="mx-auto max-w-5xl py-12 text-center">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Antes de comenzar</p>
        <h1 className="mb-3 font-serif text-5xl text-[#f5e8ce] sm:text-6xl">Elige tu mundo</h1>
        <p className="mx-auto mb-10 max-w-xl leading-relaxed text-[#c9ba9e]">Cada jugador explora una realidad paralela. Lo que hagáis puede cambiar la partida del otro.</p>
        {session.isCreator && (
          <button type="button" className="mb-8 rounded-sm border border-[#d7b77b]/50 bg-[#1a120e] px-5 py-3 text-sm text-[#c9ba9e] transition hover:bg-[#392416]" onClick={copyCode} title="Copiar código de sala">
            Comparte el código <strong className="ml-2 font-mono text-lg tracking-[0.16em] text-[#f3cc7c]">{session.joinCode}</strong>
          </button>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(timelineInfo).map(([timeline, info]) => {
            const occupant = playerInTimeline(timeline);
            const occupiedByOther = occupant && occupant.id !== session.playerId;
            const selectedBySelf = ownPlayer?.timeline === timeline;
            return (
              <button
                key={timeline}
                type="button"
                className={`relative min-h-64 overflow-hidden rounded-sm border border-[#9a8061]/55 bg-[#1d1917] p-8 text-left transition before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_25%,#817160,transparent_46%)] before:opacity-25 before:transition hover:before:opacity-50 disabled:cursor-not-allowed disabled:opacity-60 ${selectedBySelf ? "ring-2 ring-[#f1ca74] ring-offset-2 ring-offset-[#110f10] before:opacity-50" : ""}`}
                disabled={Boolean(occupiedByOther)}
                onClick={() => chooseTimeline(selectedBySelf ? null : timeline)}
              >
                <span className="relative z-10 mb-6 block font-serif text-6xl">{info.symbol}</span>
                <span className="relative z-10 mb-2 block font-serif text-4xl">{info.title}</span>
                <span className="relative z-10 block text-sm text-[#d3c0a1]">{info.subtitle}</span>
                <span className="absolute bottom-7 left-8 z-10 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-bold">{occupant ? `${occupant.displayName}${occupant.id === session.playerId ? " · Tú" : ""}` : "Disponible"}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-7 text-sm text-[#bcae95]">{bothPlayersReady ? "Los dos mundos están elegidos." : "Pulsa tu elección de nuevo si quieres dejarla libre."}</p>
        {error && <p className="mt-5 rounded-sm border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
        {session.isCreator ? (
          <button type="button" className="mt-4 w-full max-w-sm rounded-sm bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] transition hover:bg-[#d69851] disabled:cursor-not-allowed disabled:bg-[#69513a] disabled:text-[#b6a38d]" disabled={!bothPlayersReady} onClick={startGame}>
            Comenzar partida
          </button>
        ) : (
          <p className="mt-6 text-sm text-[#bcae95]">Esperando a que quien creó la sala inicie la partida.</p>
        )}
      </section>
    </main>
  );
};

export default RoomLobby;
