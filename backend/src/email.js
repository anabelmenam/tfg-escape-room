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
  const senderName = process.env.EMAIL_FROM_NAME ?? "La casa entre dos mundos";
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

const emailFrame = (
  content,
  { heading = "Un mensaje desde la casa", eyebrow = "LA CASA ENTRE DOS MUNDOS" } = {},
) => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#100d0c;color:#eee3cf;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#100d0c">
    <tr>
      <td align="center" style="padding:32px 14px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#211916;border:1px solid #725333;border-radius:8px;box-shadow:0 12px 34px rgba(0,0,0,.42)">
          <tr>
            <td align="center" style="padding:34px 34px 25px;background:#171210;border-bottom:1px solid #725333">
              <div style="font-size:11px;line-height:1.5;letter-spacing:3px;color:#d6a45e;font-weight:bold">${escapeHtml(eyebrow)}</div>
              <h1 style="margin:10px 0 0;color:#f4e5c8;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:normal">${escapeHtml(heading)}</h1>
              <div style="width:72px;height:1px;margin:20px auto 0;background:#bd7939"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 38px;color:#e9dcc5;font-size:16px;line-height:1.7">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 30px;border-top:1px solid #4b3827;background:#191310;color:#9f8c74;font-size:12px;line-height:1.6">
              Este mensaje ha sido enviado desde<br>
              <span style="color:#d6a45e;font-family:Georgia,'Times New Roman',serif">La casa entre dos mundos</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const sendPasswordResetEmail = async ({ email, displayName, resetUrl }) => {
  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(resetUrl);
  return sendEmail({
    email,
    displayName,
    subject: "Restablece tu contraseña de La casa entre dos mundos",
    textContent: `Hola, ${displayName}. Usa este enlace para crear una nueva contraseña: ${resetUrl}\n\nEl enlace caduca en 20 minutos. Si no solicitaste el cambio, ignora este mensaje.`,
    htmlContent: emailFrame(
      `<p style="margin:0 0 16px">Hola, <strong style="color:#f5e6c9">${safeName}</strong>.</p><p style="margin:0 0 22px">Hemos recibido una solicitud para restablecer tu contraseña.</p><p style="margin:30px 0;text-align:center"><a href="${safeUrl}" style="display:inline-block;background:#bd7939;color:#1d120b;border:1px solid #e0ae69;border-radius:4px;padding:13px 22px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p><p style="margin:0 0 12px">Este enlace caduca en 20 minutos y solo puede utilizarse una vez.</p><p style="margin:0;color:#ad9c86;font-size:13px">Si no solicitaste el cambio, puedes ignorar este mensaje.</p>`,
      { heading: "Una puerta espera" },
    ),
  });
};

export const sendWelcomeEmail = ({ email, displayName }) =>
  sendEmail({
    email,
    displayName,
    subject: "Bienvenido a La casa entre dos mundos",
    textContent: `Hola, ${displayName}. Tu cuenta se ha creado correctamente. Ya puedes crear una partida o unirte a la de otro jugador.`,
    htmlContent: emailFrame(
      `<p style="margin:0 0 16px">Hola, <strong style="color:#f5e6c9">${escapeHtml(displayName)}</strong>.</p><p style="margin:0 0 16px">Tu cuenta se ha creado correctamente.</p><p style="margin:0">Ya puedes crear una partida o unirte a la de otro jugador para descubrir juntos los secretos de la casa.</p>`,
      { heading: "La casa te da la bienvenida" },
    ),
  });

export const sendGameDeletedEmail = ({ email, displayName, gameName, deletedBy }) =>
  sendEmail({
    email,
    displayName,
    subject: "Se ha eliminado una partida compartida",
    textContent: `Hola, ${displayName}. ${deletedBy} ha eliminado la partida compartida «${gameName}». Por ese motivo, también ha desaparecido de tus partidas guardadas.`,
    htmlContent: emailFrame(
      `<p style="margin:0 0 16px">Hola, <strong style="color:#f5e6c9">${escapeHtml(displayName)}</strong>.</p><p style="margin:0 0 16px"><strong style="color:#e0ae69">${escapeHtml(deletedBy)}</strong> ha eliminado la partida compartida <strong style="color:#f5e6c9">«${escapeHtml(gameName)}»</strong>.</p><p style="margin:0">Por ese motivo, también ha desaparecido de tus partidas guardadas.</p>`,
      { heading: "Un recuerdo compartido ha desaparecido" },
    ),
  });

export const sendAccountDeletedEmail = ({ email, displayName }) =>
  sendEmail({
    email,
    displayName,
    subject: "Tu cuenta de La casa entre dos mundos ha sido eliminada",
    textContent: `Hola, ${displayName}. Te confirmamos que tu cuenta de La casa entre dos mundos ha sido eliminada, junto con sus datos asociados.`,
    htmlContent: emailFrame(
      `<p style="margin:0 0 16px">Hola, <strong style="color:#f5e6c9">${escapeHtml(displayName)}</strong>.</p><p style="margin:0 0 16px">Te confirmamos que tu cuenta ha sido eliminada.</p><p style="margin:0 0 14px">Ya no podrás iniciar sesión y se han eliminado sus datos asociados.</p><p style="margin:0;color:#ad9c86;font-size:13px">Si no esperabas esta acción, ponte en contacto con la persona responsable de la aplicación.</p>`,
      { heading: "La puerta se ha cerrado" },
    ),
  });
