const cleanUrl = (value) =>
  value
    ?.trim()
    .replace(/^[-\s]+/, "")
    .replace(/\/$/, "");
const configuredApiUrl = cleanUrl(import.meta.env?.VITE_API_URL);
const configuredSocketUrl = cleanUrl(import.meta.env?.VITE_SOCKET_URL ?? import.meta.env?.VITE_API_URL);

export const GAME_API_URL = import.meta.env?.PROD
  ? window.location.origin
  : (configuredApiUrl ?? "http://localhost:3010");

export const GAME_SOCKET_URL =
  configuredSocketUrl ?? (import.meta.env?.PROD ? "https://tfg-escape-room.onrender.com" : "http://localhost:3010");

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

export const registerAccount = (details) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(details) });
export const loginAccount = (details) => request("/api/auth/login", { method: "POST", body: JSON.stringify(details) });
export const logoutAccount = () => request("/api/auth/logout", { method: "POST" });
export const getCurrentAccount = () => request("/api/auth/me");
export const requestPasswordReset = (email) =>
  request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
export const resetPassword = (token, password) =>
  request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
export const getSaveSlots = () => request("/api/save-slots");

export const createGameRoom = (slotNumber, name) =>
  request("/api/rooms", { method: "POST", body: JSON.stringify({ slotNumber, name }) });

export const joinGameRoom = (joinCode, slotNumber) =>
  request(`/api/rooms/${encodeURIComponent(joinCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ slotNumber }),
  });

export const deleteGameRoom = (roomId) => request(`/api/rooms/${roomId}`, { method: "DELETE" });
export const getAdminUsers = () => request("/api/admin/users");
export const deleteAdminUser = (userId) => request(`/api/admin/users/${userId}`, { method: "DELETE" });
