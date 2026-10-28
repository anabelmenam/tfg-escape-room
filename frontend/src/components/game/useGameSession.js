import { useEffect } from "react";
import { io } from "socket.io-client";
import { Game } from "../../game/Game.js";
import { GAME_SOCKET_URL } from "../../services/gameApi.js";

const emitAction = (socket, type, targetId, payload) => socket?.emit("game:action", {
  actionId: crypto.randomUUID(), type, targetId, ...(payload ? { payload } : {}),
});

const useGameSession = ({ containerRef, gameRef, socketRef, playerRole, session, isAdmin, audioController, endingSequence, setIsLoading, setIsPaused, setPauseView, setDiaryEntries, setHintHistory, setCompanionConnected, setPlayTimer }) => {
  const { handleHallwayAction, handleEndingChange, startEndingReplay, reset } = endingSequence;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let active = true;
    const localSession = session.testMode || session.endingReplay;
    const socket = localSession ? null : io(GAME_SOCKET_URL, { auth: { roomId: session.roomId, playerToken: session.playerToken } });
    socketRef.current = socket;
    let companionIsConnected = localSession;
    let pausedForCompanion = false;
    const updateCompanionConnection = (connected) => {
      companionIsConnected = connected;
      setCompanionConnected(connected);
      if (!connected) {
        if (game.ready && !game.paused) {
          game.pause();
          pausedForCompanion = true;
        }
        return;
      }
      if (pausedForCompanion) {
        pausedForCompanion = false;
        game.resume();
      }
    };
    const game = new Game(container, playerRole, {
      testArea: localSession ? session.testArea : null,
      testMode: localSession,
      isAdmin,
      endingPreview: Boolean(session.endingPreview),
      initialCheckpoint: session.checkpoint ?? null,
      audioController,
      onReady: () => {
        if (!active) return;
        setIsLoading(false);
        if (!localSession && !companionIsConnected) {
          game.pause();
          pausedForCompanion = true;
        }
        if (session.endingReplay) window.setTimeout(() => { if (active) startEndingReplay(game); }, 250);
      },
      onPauseRequest: () => {
        if (!active) return;
        if (!localSession && !companionIsConnected) return;
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
        setHintHistory((checkpoint.hintHistory ?? []).slice(-1));
      }
    };
    socket?.on("game:state", applyState);
    socket?.on("game:state-updated", applyState);
    socket?.on("game:timer", (timer) => setPlayTimer({ elapsedSeconds: timer.elapsedSeconds, running: timer.running }));
    socket?.on("player:moved", (movement) => game.updateRemotePlayer(movement));
    socket?.on("room:presence", (presence) => {
      game.setRemotePlayerConnected(presence);
      if (presence.playerId !== session.playerId) updateCompanionConnection(Boolean(presence.connected));
    });
    socket?.on("lobby:state", (lobby) => {
      const remotePlayer = lobby.players?.find((player) => player.id !== session.playerId);
      if (remotePlayer?.character && remotePlayer.character !== session.character) {
        game.setRemotePlayerIdentity(remotePlayer);
        updateCompanionConnection(Boolean(remotePlayer.connected));
      } else {
        updateCompanionConnection(false);
      }
    });
    return () => {
      active = false;
      reset();
      gameRef.current = null;
      socketRef.current = null;
      socket?.disconnect();
      game.dispose();
    };
  }, [audioController, containerRef, gameRef, handleEndingChange, handleHallwayAction, isAdmin, playerRole, reset, session, setCompanionConnected, setDiaryEntries, setHintHistory, setIsLoading, setIsPaused, setPauseView, setPlayTimer, socketRef, startEndingReplay]);
};

export default useGameSession;
