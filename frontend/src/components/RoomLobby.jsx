import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";
import { GAME_API_URL } from "../services/gameApi";
import { t } from "../translations/index.js";

const characterInfo = {
  mum: { translationKey: "mama", symbol: "M", stateKey: "past" },
  dad: { translationKey: "papa", symbol: "D", stateKey: "present" },
};

const RoomLobby = ({ session, onStart, onBack }) => {
  const socketRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(GAME_API_URL, {
      auth: { roomId: session.roomId, playerToken: session.playerToken },
    });
    socketRef.current = socket;
    socket.once("connect", () => {
      socket.emit("lobby:select-timeline", { timeline: null });
    });
    socket.on("connect", () => setConnectionState("connected"));
    socket.on("connect_error", () => setConnectionState("connectionFailed"));
    socket.on("lobby:state", (lobby) => setPlayers(lobby.players ?? []));
    socket.on("game:started", (lobby) => {
      const ownPlayer = lobby.players?.find((player) => player.id === session.playerId);
      if (ownPlayer?.timeline) {
        const character = ownPlayer.timeline === "past" ? "mum" : "dad";
        onStart({ ...session, status: "playing", character, timeline: ownPlayer.timeline });
      }
    });

    return () => socket.disconnect();
  }, [onStart, session]);

  const chooseCharacter = (character) => {
    setError("");
    const timeline = character ? characterInfo[character].stateKey : null;
    socketRef.current?.emit("lobby:select-timeline", { timeline }, (result) => {
      if (!result?.ok) setError(t("roomLobby.chooseError"));
    });
  };

  const startGame = () => {
    setError("");
    socketRef.current?.emit("lobby:start", (result) => {
      if (!result?.ok) setError(t("roomLobby.startError"));
    });
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(session.joinCode);
  };

  const playerForCharacter = (character) => players.find((player) => player.timeline === characterInfo[character].stateKey);
  const ownPlayer = players.find((player) => player.id === session.playerId);
  const bothPlayersReady =
    players.length === 2 && Boolean(playerForCharacter("mum")) && Boolean(playerForCharacter("dad"));

  return (
    <main
      className="min-h-screen bg-[#110f10] px-5 py-7 text-[#f2e7d1]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 45%, rgb(111 60 31 / 30%), transparent 27%), radial-gradient(circle at 80% 45%, rgb(48 87 99 / 28%), transparent 27%)",
      }}
    >
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4 border-b border-[#d7b77b]/25 pb-4">
        <button type="button" className="flex items-center gap-2 text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce]" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" /> {t("roomLobby.leave")}
        </button>
        <div>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">
            {t("roomLobby.room")} {session.joinCode ?? ""}
          </p>
          <p className="text-right text-xs text-[#958772]">{t(`roomLobby.${connectionState}`)}</p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl py-12 text-center">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">
          {t("roomLobby.beforeStart")}
        </p>
        <h1 className="mb-3 font-serif text-5xl text-[#f5e8ce] sm:text-6xl">{t("characterSelection.title")}</h1>
        <p className="mx-auto mb-10 max-w-xl leading-relaxed text-[#c9ba9e]">{t("characterSelection.description")}</p>
        {session.isCreator && (
          <button
            type="button"
            className="mb-8 rounded-sm border border-[#d7b77b]/50 bg-[#1a120e] px-5 py-3 text-sm text-[#c9ba9e] transition hover:bg-[#392416]"
            onClick={copyCode}
            title={t("roomLobby.copyCode")}
          >
            {t("roomLobby.shareCode")}{" "}
            <strong className="ml-2 font-mono text-lg tracking-[0.16em] text-[#f3cc7c]">{session.joinCode}</strong>
          </button>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(characterInfo).map(([character, info]) => {
            const occupant = playerForCharacter(character);
            const occupiedByOther = occupant && occupant.id !== session.playerId;
            const selectedBySelf = ownPlayer?.timeline === info.stateKey;
            return (
              <button
                key={character}
                type="button"
                className={`relative min-h-64 overflow-hidden rounded-sm border border-[#9a8061]/55 bg-[#1d1917] p-8 text-left transition before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_25%,#817160,transparent_46%)] before:opacity-25 before:transition hover:before:opacity-50 disabled:cursor-not-allowed disabled:opacity-60 ${selectedBySelf ? "ring-2 ring-[#f1ca74] ring-offset-2 ring-offset-[#110f10] before:opacity-50" : ""}`}
                disabled={Boolean(occupiedByOther)}
                onClick={() => chooseCharacter(selectedBySelf ? null : character)}
              >
                <span className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d7b77b]/35 bg-black/20 font-serif text-5xl text-[#e7c584]">
                  {info.symbol}
                </span>
                <span className="relative z-10 mb-2 block font-serif text-4xl">
                  {t(`characterSelection.${info.translationKey}`)}
                </span>
                <span className="absolute bottom-7 left-8 z-10 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-bold">
                  {occupant
                    ? occupant.id === session.playerId
                      ? t("roomLobby.you")
                      : occupant.displayName
                    : t("roomLobby.available")}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-7 text-sm text-[#bcae95]">
          {t(`characterSelection.${bothPlayersReady ? "bothReady" : "selectionHint"}`)}
        </p>
        {error && (
          <p
            className="mt-5 rounded-sm border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {session.isCreator ? (
          <button
            type="button"
            className="mt-4 w-full max-w-sm rounded-sm bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] transition hover:bg-[#d69851] disabled:cursor-not-allowed disabled:bg-[#69513a] disabled:text-[#b6a38d]"
            disabled={!bothPlayersReady}
            onClick={startGame}
          >
            {t("roomLobby.start")}
          </button>
        ) : (
          <p className="mt-6 text-sm text-[#bcae95]">{t("roomLobby.waiting")}</p>
        )}
      </section>
    </main>
  );
};

export default RoomLobby;
