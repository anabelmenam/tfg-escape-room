import { useEffect, useRef } from "react";
import { Game } from "../game/Game";

export default function GameCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const game = new Game(container);
    return () => game.dispose();
  }, []);

  return <div ref={ref} style={{ width: "100vw", height: "100vh" }} />;
}
