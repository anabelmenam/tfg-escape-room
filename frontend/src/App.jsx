import { useState } from "react";
import GameCanvas from "./components/GameCanvas";
import Lobby from "./components/Lobby";
import RoomLobby from "./components/RoomLobby";

const getTestSession = () => {
  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  const timeline = params.get("test");
  if (timeline === "icons") return { testMode: true, testPlayerRole: "C", testArea: "icons" };
  if (!["past", "present"].includes(timeline)) return null;
  const area = params.get("area");
  return { testMode: true, timeline, testArea: ["hallway", "children", "bathroom", "kitchen"].includes(area) ? area : "bedroom" };
};

const App = () => {
  const [session, setSession] = useState(getTestSession);

  if (!session) return <Lobby onEnterLobby={setSession} />;
  if (!session.timeline && !session.testPlayerRole) return <RoomLobby session={session} onStart={setSession} onBack={() => setSession(null)} />;

  return <GameCanvas playerRole={session.testPlayerRole ?? (session.timeline === "past" ? "A" : "B")} session={session} />;
};

export default App;
