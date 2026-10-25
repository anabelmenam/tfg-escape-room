import { randomUUID } from "node:crypto";
import { sequelize } from "./db.js";
import { User } from "./models/index.js";
import { hashPassword } from "./auth.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const previousEmail = process.env.ADMIN_PREVIOUS_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_NAME?.trim() || "Administración";

if (!email || !password || password.length < 12) {
  console.error("Define ADMIN_EMAIL y una ADMIN_PASSWORD de al menos 12 caracteres.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await hashPassword(password);
    const existing = previousEmail ? await User.findOne({ where: { email: previousEmail } }) : null;
    const [user, created] = existing
      ? [existing, false]
      : await User.findOrCreate({ where: { email }, defaults: { id: randomUUID(), displayName, email, passwordHash, role: "admin" } });
    if (!created) await user.update({ displayName, email, passwordHash, role: "admin" });
    console.log(`Cuenta administradora ${created ? "creada" : "actualizada"}: ${email}`);
  } finally {
    await sequelize.close();
  }
}
