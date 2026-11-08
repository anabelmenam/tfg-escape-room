import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { Op } from "sequelize";
import { z } from "zod";
import { GameRoom, RoomPlayer } from "./models/index.js";
import { createAdminRouter } from "./routes/adminRoutes.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createRoomRouter } from "./routes/roomRoutes.js";
import { syncRoomPlayTimer } from "./services/gameSessionService.js";
import { registerGameSocket } from "./sockets/gameSocket.js";

const port = Number(process.env.PORT ?? 3010);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const app = express();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Vary", "Cookie, Origin");
  next();
});
app.get("/health", (request, response) => response.json({ ok: true }));
app.use("/api/auth", createAuthRouter({ frontendOrigin }));
app.use("/api/admin", createAdminRouter());
app.use("/api", createRoomRouter());
app.use((request, response) => response.status(404).json({ error: "Ruta no encontrada." }));
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof z.ZodError)
    return response.status(400).json({ error: "Datos de petición no válidos.", details: error.issues });
  const status = error.status ?? error.statusCode;
  const statusCode = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  console.error(error);
  return response.status(statusCode).json({ error: error.message ?? "Error interno del servidor." });
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: frontendOrigin, methods: ["GET", "POST"] } });
registerGameSocket(io);

const startServer = async ({ listenPort = port, resetPresence = true } = {}) => {
  if (resetPresence) {
    await RoomPlayer.update({ connected: false }, { where: { connected: true } });
    const activeTimers = await GameRoom.findAll({ where: { playStartedAt: { [Op.ne]: null } }, attributes: ["id"] });
    for (const room of activeTimers) await syncRoomPlayTimer(room.id);
  }
  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(listenPort, "0.0.0.0", resolve);
  });
  console.info(`Servidor Express escuchando en el puerto ${httpServer.address().port}`);
  return httpServer;
};

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) await startServer();

export { app, httpServer, startServer };
export { reduceAction, setObjectState } from "./gameLogic.js";
export { normaliseCode, passwordResetTokenHash, socketRoom } from "./serverUtils.js";
export {
  applyAction,
  playTimerSnapshot,
  saveCheckpoint,
  syncRoomPlayTimer,
  updateCheckpoint,
} from "./services/gameSessionService.js";
export {
  createRoom,
  ensureFreeSlot,
  getLobbyState,
  getPlayerFromToken,
  getSnapshot,
  joinRoom,
  selectCharacter,
  startGame,
} from "./services/roomService.js";
