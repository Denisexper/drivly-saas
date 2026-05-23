import { FRONTEND_URL } from "../../services/enviroments.service";

export function buildVerifyEmail(data: {
  userName: string;
  userEmail: string;
  verifyToken: string;
  tenantName: string;
  tenantSlug: string;
}): { subject: string; html: string } {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${data.verifyToken}`;

  return {
    subject: "Activa tu cuenta — Drivly",
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
            <h2 style="color:#111827;margin:0 0 12px;font-size:20px;">¡Activa tu cuenta!</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px;">
              Hola <strong style="color:#111827;">${data.userName}</strong>, gracias por registrar <strong style="color:#111827;">${data.tenantName}</strong> en Drivly.
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Para empezar a usar tu cuenta, confirma tu email haciendo click en el botón de abajo.
              El enlace es válido por <strong>24 horas</strong>.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
              <tr><td align="center">
                <a href="${verifyUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;">
                  Activar mi cuenta →
                </a>
              </td></tr>
            </table>

            <div style="background:#f8fafc;border-radius:6px;padding:16px;margin-bottom:20px;">
              <p style="color:#374151;font-size:13px;margin:0 0 4px;font-weight:600;">Tu empresa registrada</p>
              <p style="color:#6b7280;font-size:13px;margin:0;">
                Empresa: <strong>${data.tenantName}</strong><br>
                URL de acceso: <span style="font-family:monospace;color:#1d4ed8;">/login/${data.tenantSlug}</span>
              </p>
            </div>

            <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
              Si no creaste esta cuenta, ignora este correo.
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
