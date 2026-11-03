import assert from "node:assert/strict";
import test from "node:test";
import {
  sendAccountDeletedEmail,
  sendGameDeletedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../../src/email.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.BREVO_API_KEY;
const originalSender = process.env.EMAIL_FROM_ADDRESS;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = originalKey;
  if (originalSender === undefined) delete process.env.EMAIL_FROM_ADDRESS;
  else process.env.EMAIL_FROM_ADDRESS = originalSender;
});

test("el correo exige configuración del proveedor", async () => {
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM_ADDRESS;
  await assert.rejects(
    () => sendPasswordResetEmail({ email: "a@example.com", displayName: "A", resetUrl: "https://example.com" }),
    /BREVO_NOT_CONFIGURED/,
  );
});

test("el correo escapa HTML y conserva el contenido de texto", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true };
  };
  await sendPasswordResetEmail({
    email: "user@example.com",
    displayName: "<Admin>",
    resetUrl: "https://example.com/reset?a=1&b=2",
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.options.headers["api-key"], "test-key");
  assert.match(body.htmlContent, /&lt;Admin&gt;/);
  assert.match(body.htmlContent, /a=1&amp;b=2/);
  assert.match(body.htmlContent, /Una puerta espera/);
  assert.match(body.htmlContent, /background:#100d0c/);
  assert.match(body.textContent, /<Admin>/);
});

test("el correo propaga un error útil cuando el proveedor falla", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  globalThis.fetch = async () => ({ ok: false, status: 429, text: async () => "rate limited" });
  await assert.rejects(
    () => sendPasswordResetEmail({ email: "a@example.com", displayName: "A", resetUrl: "https://example.com" }),
    /BREVO_SEND_FAILED:429:rate limited/,
  );
});

test("los correos de bienvenida y partida eliminada usan el destinatario y escapan los datos", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  const messages = [];
  global.fetch = async (url, options) => {
    messages.push(JSON.parse(options.body));
    return { ok: true };
  };
  await sendWelcomeEmail({ email: "new@example.com", displayName: "<Nueva>" });
  await sendGameDeletedEmail({
    email: "other@example.com",
    displayName: "Compañera",
    gameName: "<Partida>",
    deletedBy: "A & B",
  });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].to[0].email, "new@example.com");
  assert.match(messages[0].htmlContent, /&lt;Nueva&gt;/);
  assert.equal(messages[1].to[0].email, "other@example.com");
  assert.match(messages[1].htmlContent, /&lt;Partida&gt;/);
  assert.match(messages[1].htmlContent, /A &amp; B/);
});

test("el correo de cuenta eliminada confirma la baja sin exponer información sensible", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  let message;
  globalThis.fetch = async (url, options) => {
    message = JSON.parse(options.body);
    return { ok: true };
  };
  await sendAccountDeletedEmail({ email: "former@example.com", displayName: "<Usuario>" });
  assert.equal(message.to[0].email, "former@example.com");
  assert.match(message.subject, /eliminada/i);
  assert.match(message.htmlContent, /&lt;Usuario&gt;/);
  assert.doesNotMatch(message.textContent, /contraseña/i);
});
