import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { sendAccountDeletedEmail } from "../email.js";
import { GameRoom, RoomPlayer, User } from "../models/index.js";
import { requireAdmin } from "../serverUtils.js";

export const createAdminRouter = () => {
  const router = Router();
  router.use(requireUser, requireAdmin);
  router.get("/users", async (request, response) => {
    const users = await User.findAll({ attributes: ["id", "displayName", "email", "role", "createdAt"], order: [["createdAt", "DESC"]] });
    return response.json({ users });
  });
  router.delete("/users/:userId", async (request, response) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(request.params);
    if (userId === request.user.id) return response.status(400).json({ error: "CANNOT_DELETE_SELF" });
    const deletedUser = await withTransaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user) return null;
      const account = { email: user.email, displayName: user.displayName };
      const memberships = await RoomPlayer.findAll({ where: { userId }, attributes: ["roomId"], transaction });
      const roomIds = [...new Set(memberships.map(({ roomId }) => roomId))];
      await user.destroy({ transaction });
      if (roomIds.length) {
        const remaining = await RoomPlayer.findAll({ where: { roomId: { [Op.in]: roomIds } }, attributes: ["roomId"], transaction, raw: true });
        const occupied = new Set(remaining.map(({ roomId }) => roomId));
        const emptyRooms = roomIds.filter((roomId) => !occupied.has(roomId));
        if (emptyRooms.length) await GameRoom.destroy({ where: { id: { [Op.in]: emptyRooms } }, transaction });
      }
      return account;
    });
    if (!deletedUser) return response.status(404).json({ error: "USER_NOT_FOUND" });
    if (deletedUser.email) try { await sendAccountDeletedEmail(deletedUser); } catch (error) { console.error("No se pudo enviar el correo de cuenta eliminada:", error.message); }
    return response.status(204).end();
  });
  return router;
};
