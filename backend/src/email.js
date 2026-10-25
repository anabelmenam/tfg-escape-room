const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendPasswordResetEmail = async ({ email, displayName, resetUrl }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM_ADDRESS;
  const senderName = process.env.EMAIL_FROM_NAME ?? "La casa entre recuerdos";
  if (!apiKey || !senderEmail) throw new Error("BREVO_NOT_CONFIGURED");

  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(resetUrl);
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: displayName }],
      subject: "Restablece tu contraseña de La casa entre recuerdos",
      textContent: `Hola, ${displayName}. Usa este enlace para crear una nueva contraseña: ${resetUrl}\n\nEl enlace caduca en 20 minutos. Si no solicitaste el cambio, ignora este mensaje.`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2b211c"><h1 style="font-family:Georgia,serif">La casa entre recuerdos</h1><p>Hola, ${safeName}.</p><p>Hemos recibido una solicitud para restablecer tu contraseña.</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#bd7939;color:#1d120b;padding:12px 20px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p><p>Este enlace caduca en 20 minutos y solo puede utilizarse una vez.</p><p style="color:#6f6259;font-size:13px">Si no solicitaste el cambio, puedes ignorar este mensaje.</p></div>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`BREVO_SEND_FAILED:${response.status}:${detail.slice(0, 300)}`);
  }
};
