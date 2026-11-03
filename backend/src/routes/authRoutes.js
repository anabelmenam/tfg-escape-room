import { randomBytes, randomUUID } from "node:crypto";
import { Router } from "express";
import { sequelize, withTransaction } from "../db.js";
import { PasswordResetToken, User, UserSession } from "../models/index.js";
import { clearSession, createSession, hashPassword, publicUser, requireUser, verifyPassword } from "../auth.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../email.js";
import { credentialsSchema, passwordResetRequestSchema, passwordResetSchema, registerSchema } from "../schemas.js";
import { passwordResetLifetime, passwordResetTokenHash } from "../serverUtils.js";

export const createAuthRouter = ({ frontendOrigin }) => {
  const router = Router();
  router.post("/register", async (request, response) => {
    const input = registerSchema.parse(request.body);
    const existing = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), input.email) });
    if (existing) return response.status(409).json({ error: "EMAIL_IN_USE" });
    const user = await User.create({ id: randomUUID(), displayName: input.displayName, email: input.email, passwordHash: await hashPassword(input.password) });
    await createSession(user.id, response);
    void sendWelcomeEmail({ email: user.email, displayName: user.displayName }).catch((error) =>
      console.error("No se pudo enviar el correo de bienvenida:", error.message));
    return response.status(201).json({ user: publicUser(user) });
  });

  router.post("/login", async (request, response) => {
    const input = credentialsSchema.parse(request.body);
    const user = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), input.email) });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return response.status(401).json({ error: "INVALID_CREDENTIALS" });
    await createSession(user.id, response);
    return response.json({ user: publicUser(user) });
  });

  router.post("/forgot-password", async (request, response) => {
    const { email } = passwordResetRequestSchema.parse(request.body);
    const user = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), email) });
    if (user) {
      const previous = await PasswordResetToken.findOne({ where: { userId: user.id }, order: [["createdAt", "DESC"]] });
      if (!previous || Date.now() - previous.createdAt.getTime() >= 60_000) {
        const token = randomBytes(32).toString("base64url");
        const record = await PasswordResetToken.create({ id: randomUUID(), userId: user.id, tokenHash: passwordResetTokenHash(token), expiresAt: new Date(Date.now() + passwordResetLifetime) });
        const resetUrl = new URL(frontendOrigin);
        resetUrl.searchParams.set("resetToken", token);
        try {
          await sendPasswordResetEmail({ email: user.email, displayName: user.displayName, resetUrl: resetUrl.toString() });
        } catch (error) {
          await record.destroy();
          console.error("No se pudo enviar el correo de recuperación:", error.message);
        }
      }
    }
    return response.json({ accepted: true });
  });

  router.post("/reset-password", async (request, response) => {
    const input = passwordResetSchema.parse(request.body);
    const changed = await withTransaction(async (transaction) => {
      const record = await PasswordResetToken.findOne({
        where: { tokenHash: passwordResetTokenHash(input.token), usedAt: null },
        include: [{ model: User, as: "user", required: true }], transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!record || record.expiresAt <= new Date()) return false;
      await record.user.update({ passwordHash: await hashPassword(input.password) }, { transaction });
      await PasswordResetToken.update({ usedAt: new Date() }, { where: { userId: record.userId, usedAt: null }, transaction });
      await UserSession.destroy({ where: { userId: record.userId }, transaction });
      return true;
    });
    if (!changed) return response.status(400).json({ error: "INVALID_RESET_TOKEN" });
    return response.json({ changed: true });
  });

  router.post("/logout", async (request, response) => { await clearSession(request, response); return response.status(204).end(); });
  router.get("/me", requireUser, (request, response) => response.json({ user: publicUser(request.user) }));
  return router;
};
