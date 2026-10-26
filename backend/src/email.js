const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendEmail = async ({ email, displayName, subject, textContent, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM_ADDRESS;
  const senderName = process.env.EMAIL_FROM_NAME ?? "La casa entre recuerdos";
  if (!apiKey || !senderEmail) throw new Error("BREVO_NOT_CONFIGURED");
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: displayName }],
      subject,
      textContent,
      htmlContent,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`BREVO_SEND_FAILED:${response.status}:${detail.slice(0, 300)}`);
  }
};

const emailFrame = (content) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2b211c"><h1 style="font-family:Georgia,serif">La casa entre recuerdos</h1>${content}</div>`;

export const sendPasswordResetEmail = async ({ email, displayName, resetUrl }) => {
  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(resetUrl);
  return sendEmail({
    email,
    displayName,
    subject: "Restablece tu contraseña de La casa entre recuerdos",
    textContent: `Hola, ${displayName}. Usa este enlace para crear una nueva contraseña: ${resetUrl}\n\nEl enlace caduca en 20 minutos. Si no solicitaste el cambio, ignora este mensaje.`,
    htmlContent: emailFrame(`<p>Hola, ${safeName}.</p><p>Hemos recibido una solicitud para restablecer tu contraseña.</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#bd7939;color:#1d120b;padding:12px 20px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p><p>Este enlace caduca en 20 minutos y solo puede utilizarse una vez.</p><p style="color:#6f6259;font-size:13px">Si no solicitaste el cambio, puedes ignorar este mensaje.</p>`),
  });
};

export const sendWelcomeEmail = ({ email, displayName }) => sendEmail({
  email,
  displayName,
  subject: "Bienvenido a La casa entre recuerdos",
  textContent: `Hola, ${displayName}. Tu cuenta se ha creado correctamente. Ya puedes crear una partida o unirte a la de otro jugador.`,
  htmlContent: emailFrame(`<p>Hola, ${escapeHtml(displayName)}.</p><p>Tu cuenta se ha creado correctamente.</p><p>Ya puedes crear una partida o unirte a la de otro jugador para descubrir juntos los secretos de la casa.</p>`),
});

export const sendGameDeletedEmail = ({ email, displayName, gameName, deletedBy }) => sendEmail({
  email,
  displayName,
  subject: "Se ha eliminado una partida compartida",
  textContent: `Hola, ${displayName}. ${deletedBy} ha eliminado la partida compartida «${gameName}». Por ese motivo, también ha desaparecido de tus partidas guardadas.`,
  htmlContent: emailFrame(`<p>Hola, ${escapeHtml(displayName)}.</p><p><strong>${escapeHtml(deletedBy)}</strong> ha eliminado la partida compartida <strong>«${escapeHtml(gameName)}»</strong>.</p><p>Por ese motivo, también ha desaparecido de tus partidas guardadas.</p>`),
});

export const sendAccountDeletedEmail = ({ email, displayName }) => sendEmail({
  email,
  displayName,
  subject: "Tu cuenta de La casa entre recuerdos ha sido eliminada",
  textContent: `Hola, ${displayName}. Te confirmamos que tu cuenta de La casa entre recuerdos ha sido eliminada, junto con sus datos asociados.`,
  htmlContent: emailFrame(`<p>Hola, ${escapeHtml(displayName)}.</p><p>Te confirmamos que tu cuenta ha sido eliminada.</p><p>Ya no podrás iniciar sesión y se han eliminado sus datos asociados.</p><p style="color:#6f6259;font-size:13px">Si no esperabas esta acción, ponte en contacto con la persona responsable de la aplicación.</p>`),
});
