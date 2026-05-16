import { FRONTEND_URL } from "../../services/enviroments.service";

export function buildPasswordResetEmail(data: {
  userName: string;
  userEmail: string;
  resetToken: string;
}): { subject: string; html: string } {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${data.resetToken}`;

  return {
    subject: "Recupera tu contraseña — Drivly",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#1d4ed8;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Drivly</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Less admin. More road.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#111827;margin:0 0 12px;font-size:20px;">Recupera tu contraseña</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hola <strong style="color:#111827;">${data.userName}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Este enlace es válido por <strong>1 hora</strong>.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
              <tr><td align="center">
                <a href="${resetUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;">
                  Restablecer contraseña →
                </a>
              </td></tr>
            </table>

            <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
              Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Drivly · Todos los derechos reservados</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
