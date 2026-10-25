import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { User, UserSession } from "./models/index.js";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "escape_room_session";
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
};

const verifyPassword = async (password, storedHash) => {
  if (!storedHash?.includes(":")) return false;
  const [salt, expectedHex] = storedHash.split(":");
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const readCookies = (header = "") => Object.fromEntries(header.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value));
const cookieOptions = () => {
  const production = process.env.NODE_ENV === "production";
  return `HttpOnly; Path=/; SameSite=${production ? "None" : "Lax"}; Max-Age=${SESSION_DURATION / 1000}${production ? "; Secure" : ""}`;
};

const createSession = async (userId, response) => {
  const token = randomBytes(32).toString("base64url");
  await UserSession.create({ id: randomUUID(), userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_DURATION) });
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; ${cookieOptions()}`);
};

const clearSession = async (request, response) => {
  const token = readCookies(request.headers.cookie)[SESSION_COOKIE];
  if (token) await UserSession.destroy({ where: { tokenHash: hashToken(token) } });
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; ${cookieOptions().replace(`Max-Age=${SESSION_DURATION / 1000}`, "Max-Age=0")}`);
};

const getAuthenticatedUser = async (request) => {
  const token = readCookies(request.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  const session = await UserSession.findOne({ where: { tokenHash: hashToken(token) }, include: [{ model: User, as: "user", required: true }] });
  if (!session || session.expiresAt <= new Date()) { if (session) await session.destroy(); return null; }
  return session.user;
};

const requireUser = async (request, response, next) => {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return response.status(401).json({ error: "AUTH_REQUIRED" });
    request.user = user;
    return next();
  } catch (error) { return next(error); }
};

const publicUser = (user) => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });

export { clearSession, createSession, getAuthenticatedUser, hashPassword, publicUser, requireUser, verifyPassword };
