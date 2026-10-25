import { useCallback, useEffect, useRef, useState } from "react";
import { ENDING_UI } from "../../game/ending/endingConfig.js";

const useEndingSequence = ({ session, gameRef, setIsPaused }) => {
  const previewTimerRef = useRef(null);
  const cinematicStartedRef = useRef(false);
  const tourStartedRef = useRef(false);
  const [ending, setEnding] = useState(null);
  const [showLight, setShowLight] = useState(false);
  const [tourBeat, setTourBeat] = useState(null);
  const [tourFade, setTourFade] = useState(false);

  const playTour = useCallback((game, onComplete) => {
    if (tourStartedRef.current) return;
    tourStartedRef.current = true;
    window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => {
      setShowLight(false);
      game.startEndingHouseTour({
        onBeat: setTourBeat,
        onFade: setTourFade,
        onComplete: () => {
          setTourBeat(null);
          setTourFade(false);
          onComplete?.();
        },
      });
    }, ENDING_UI.tourStartDelay);
  }, []);

  const startEndingReplay = useCallback((game) => {
    if (cinematicStartedRef.current) return;
    cinematicStartedRef.current = true;
    const openingState = structuredClone(game.sharedState);
    openingState.ending = { phase: "opening", holding: { mum: true, dad: true }, choice: null, sacrificeCharacter: null };
    for (const character of ["mum", "dad"]) openingState.characters[character].objects["hallway-street-door"] = { locked: false, open: true };
    game.applySharedState(openingState);
    game.startEndingExit(() => {
      game.pause();
      playTour(game, () => {
        const completeState = structuredClone(game.sharedState);
        completeState.ending = { ...completeState.ending, phase: "complete", choice: "together", sacrificeCharacter: null };
        game.applySharedState(completeState);
      });
    }, () => setShowLight(true));
  }, [playTour]);

  const handleHallwayAction = useCallback((game, socket, type, targetId, payload = {}) => {
    if (!(session.endingPreview && targetId === "hallway-final-threshold")) {
      socket?.emit("game:action", { actionId: crypto.randomUUID(), type, targetId, payload });
      return;
    }

    window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
    if (payload.operation !== "hold-start") return;
    previewTimerRef.current = window.setTimeout(() => {
      if (!game.input.isPressed("KeyE")) return;
      const openingState = structuredClone(game.sharedState);
      openingState.ending = {
        phase: "opening",
        holding: { mum: true, dad: true },
        choice: null,
        sacrificeCharacter: null,
      };
      for (const character of ["mum", "dad"]) {
        openingState.characters[character].objects["hallway-street-door"] = { locked: false, open: true };
      }
      game.applySharedState(openingState);
      game.startEndingExit(() => {
        game.pause();
        playTour(game, () => {
          const choiceState = structuredClone(game.sharedState);
          choiceState.ending = { ...choiceState.ending, phase: "choice" };
          game.applySharedState(choiceState);
        });
      }, () => setShowLight(true));
    }, ENDING_UI.previewHoldDuration);
  }, [playTour, session.endingPreview]);

  const handleEndingChange = useCallback((game, socket, nextEnding) => {
    if (!session.endingPreview && nextEnding?.phase === "choice" && !tourStartedRef.current) {
      setEnding({ ...nextEnding, phase: "tour" });
      playTour(game, () => {
        socket?.emit("game:action", {
          actionId: crypto.randomUUID(),
          type: "object.interact",
          targetId: "hallway-final-choice",
          payload: { choice: "together" },
        });
      });
      return;
    }
    setEnding(nextEnding);
    if (session.endingPreview || nextEnding?.phase !== "opening" || cinematicStartedRef.current) return;
    cinematicStartedRef.current = true;
    game.startEndingExit(() => {
      game.pause();
      socket?.emit("game:action", {
        actionId: crypto.randomUUID(),
        type: "object.interact",
        targetId: "hallway-final-crossed",
      });
    }, () => setShowLight(true));
  }, [playTour, session.endingPreview]);

  const reset = useCallback(() => {
    window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
    cinematicStartedRef.current = false;
    tourStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!["choice", "complete"].includes(ending?.phase)) return;
    gameRef.current?.pause();
    setIsPaused(false);
  }, [ending?.phase, gameRef, setIsPaused]);

  const active = ["opening", "tour"].includes(ending?.phase) || showLight || tourBeat !== null || tourFade;
  return { ending, showLight, tourBeat, tourFade, active, handleHallwayAction, handleEndingChange, startEndingReplay, reset };
};

export default useEndingSequence;
