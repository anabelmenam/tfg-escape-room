import { useState } from "react";
import GameCanvas from "./components/GameCanvas";
import Lobby from "./components/Lobby";
import RoomLobby from "./components/RoomLobby";

const getTestSession = () => {
  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  const timeline = params.get("test");
  if (!["past", "present"].includes(timeline)) return null;
  return { testMode: true, timeline, testArea: params.get("area") === "hallway" ? "hallway" : "bedroom" };
};

const App = () => {
  const [session, setSession] = useState(getTestSession);

  if (!session) return <Lobby onEnterLobby={setSession} />;
  if (!session.timeline) return <RoomLobby session={session} onStart={setSession} onBack={() => setSession(null)} />;

  return <GameCanvas playerRole={session.timeline === "past" ? "A" : "B"} session={session} />;
};

export default App;
