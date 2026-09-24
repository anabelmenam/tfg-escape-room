export const GAME_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3010";

const request = async (path, options = {}) => {
  const response = await fetch(`${GAME_API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No se ha podido conectar con el servidor.");
  return body;
};

export const createGameRoom = (displayName) =>
  request("/api/rooms", { method: "POST", body: JSON.stringify({ displayName }) });

export const joinGameRoom = (joinCode, displayName) =>
  request(`/api/rooms/${encodeURIComponent(joinCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
