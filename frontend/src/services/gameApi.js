const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/^[-\s]+/, "").replace(/\/$/, "");

export const GAME_API_URL = configuredApiUrl
  || (import.meta.env.PROD ? "https://tfg-escape-room.onrender.com" : "http://localhost:3010");

const request = async (path, options = {}) => {
  const response = await fetch(`${GAME_API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "REQUEST_FAILED");
  return body;
};

export const registerAccount = (details) => request("/api/auth/register", { method: "POST", body: JSON.stringify(details) });
export const loginAccount = (details) => request("/api/auth/login", { method: "POST", body: JSON.stringify(details) });
export const logoutAccount = () => request("/api/auth/logout", { method: "POST" });
export const getCurrentAccount = () => request("/api/auth/me");
export const getSaveSlots = () => request("/api/save-slots");

export const createGameRoom = (slotNumber, name) =>
  request("/api/rooms", { method: "POST", body: JSON.stringify({ slotNumber, name }) });

export const joinGameRoom = (joinCode, slotNumber) =>
  request(`/api/rooms/${encodeURIComponent(joinCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ slotNumber }),
  });

export const deleteGameRoom = (roomId) => request(`/api/rooms/${roomId}`, { method: "DELETE" });
