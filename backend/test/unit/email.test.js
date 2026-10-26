import assert from "node:assert/strict";
import test from "node:test";
import { sendPasswordResetEmail } from "../../src/email.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.BREVO_API_KEY;
const originalSender = process.env.EMAIL_FROM_ADDRESS;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = originalKey;
  if (originalSender === undefined) delete process.env.EMAIL_FROM_ADDRESS; else process.env.EMAIL_FROM_ADDRESS = originalSender;
});

test("el correo exige configuración del proveedor", async () => {
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM_ADDRESS;
  await assert.rejects(() => sendPasswordResetEmail({ email: "a@example.com", displayName: "A", resetUrl: "https://example.com" }), /BREVO_NOT_CONFIGURED/);
});

test("el correo escapa HTML y conserva el contenido de texto", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  let request;
  globalThis.fetch = async (url, options) => { request = { url, options }; return { ok: true }; };
  await sendPasswordResetEmail({ email: "user@example.com", displayName: "<Admin>", resetUrl: "https://example.com/reset?a=1&b=2" });

  const body = JSON.parse(request.options.body);
  assert.equal(request.options.headers["api-key"], "test-key");
  assert.match(body.htmlContent, /&lt;Admin&gt;/);
  assert.match(body.htmlContent, /a=1&amp;b=2/);
  assert.match(body.textContent, /<Admin>/);
});

test("el correo propaga un error útil cuando el proveedor falla", async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "sender@example.com";
  globalThis.fetch = async () => ({ ok: false, status: 429, text: async () => "rate limited" });
  await assert.rejects(() => sendPasswordResetEmail({ email: "a@example.com", displayName: "A", resetUrl: "https://example.com" }), /BREVO_SEND_FAILED:429:rate limited/);
});
