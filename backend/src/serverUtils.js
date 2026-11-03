import { createHash } from "node:crypto";

export const socketRoom = (roomId) => `game:${roomId}`;
export const normaliseCode = (code) => code.trim().toUpperCase();
export const makeJoinCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const passwordResetTokenHash = (token) => createHash("sha256").update(token).digest("hex");
export const passwordResetLifetime = 1000 * 60 * 20;

export const requireAdmin = (request, response, next) => {
  if (request.user?.role !== "admin") return response.status(403).json({ error: "ADMIN_REQUIRED" });
  return next();
};
