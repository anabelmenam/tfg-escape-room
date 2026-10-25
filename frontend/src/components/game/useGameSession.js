import { useEffect } from "react";
import { io } from "socket.io-client";
import { Game } from "../../game/Game.js";
import { GAME_API_URL } from "../../services/gameApi.js";

const emitAction = (socket, type, targetId, payload) => socket?.emit("game:action", {
  actionId: crypto.randomUUID(), type, targetId, ...(payload ? { payload } : {}),
});

const useGameSession = ({ containerRef, gameRef, socketRef, playerRole, session, isAdmin, audioController, endingSequence, setIsLoading, setIsPaused, setPauseView, setDiaryEntries, setHintHistory, setCompanionConnected }) => {
  const { handleHallwayAction, handleEndingChange, reset } = endingSequence;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let active = true;
    const socket = session.testMode ? null : io(GAME_API_URL, { auth: { roomId: session.roomId, playerToken: session.playerToken } });
    socketRef.current = socket;
    let companionConnected = Boolean(session.testMode);
    let pausedByCompanion = false;
    const updateCompanionConnection = (connected) => {
      companionConnected = connected;
      setCompanionConnected(connected);
      if (!game.ready) return;
      if (connected && pausedByCompanion) {
        game.resume({ lockPointer: false });
        pausedByCompanion = false;
      } else if (!connected) {
        pausedByCompanion = !game.paused;
        game.pause();
      }
    };
    const game = new Game(container, playerRole, {
      testArea: session.testMode ? session.testArea : null,
      testMode: session.testMode,
      isAdmin,
      endingPreview: Boolean(session.endingPreview),
      initialCheckpoint: session.checkpoint ?? null,
      audioController,
      onReady: () => {
        if (!active) return;
        if (!companionConnected) { pausedByCompanion = true; game.pause(); }
        setIsLoading(false);
      },
      onPauseRequest: () => {
        if (!active) return;
        if (game.paused) { game.resume(); setIsPaused(false); return; }
        game.pause(); setPauseView("menu"); setIsPaused(true);
      },
      onHallwayAction: (type, targetId, payload = {}) => handleHallwayAction(game, socket, type, targetId, payload),
      onBedroomAction: (type, targetId, payload = {}) => emitAction(socket, type, targetId, payload),
      onChildrenRoomAction: (type, targetId, payload = {}) => emitAction(socket, type, targetId, payload),
      onKitchenAction: (type, targetId, payload = {}) => emitAction(socket, type, targetId, payload),
      onLivingRoomAction: (type, targetId, payload = {}) => emitAction(socket, type, targetId, payload),
      onBathroomAction: (type, targetId, payload = {}) => emitAction(socket, type, targetId, payload),
      onPlayerMovement: (movement) => socket?.emit("player:movement", movement),
      onDiaryEntriesChanged: setDiaryEntries,
      onEndingChange: (nextEnding) => handleEndingChange(game, socket, nextEnding),
      onDoorUnlocked: () => emitAction(socket, "object.interact", "bedroom-exit-door"),
    });
    gameRef.current = game;
    const applyState = ({ state, checkpoint }) => {
      game.applySharedState(state);
      if (checkpoint) {
        game.applyCheckpoint(checkpoint);
        setHintHistory(checkpoint.hintHistory ?? []);
      }
    };
    socket?.on("game:state", applyState);
    socket?.on("game:state-updated", applyState);
    socket?.on("player:moved", (movement) => game.updateRemotePlayer(movement));
    socket?.on("room:presence", (presence) => {
      game.setRemotePlayerConnected(presence);
      if (presence.timeline !== session.timeline) updateCompanionConnection(Boolean(presence.connected));
    });
    socket?.on("lobby:state", (lobby) => {
      const remotePlayer = lobby.players?.find((player) => player.id !== session.playerId);
      if (remotePlayer) {
        game.setRemotePlayerIdentity(remotePlayer);
        updateCompanionConnection(Boolean(remotePlayer.connected));
      } else updateCompanionConnection(false);
    });
    return () => {
      active = false;
      reset();
      gameRef.current = null;
      socketRef.current = null;
      socket?.disconnect();
      game.dispose();
    };
  }, [audioController, containerRef, gameRef, handleEndingChange, handleHallwayAction, isAdmin, playerRole, reset, session, setCompanionConnected, setDiaryEntries, setHintHistory, setIsLoading, setIsPaused, setPauseView, socketRef]);
};

export default useGameSession;
