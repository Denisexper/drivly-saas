import { FRONTEND_URL } from "../../services/enviroments.service";

export interface WelcomeEmailData {
  adminName: string;
  adminEmail: string;
  tenantName: string;
  tenantSlug: string;
}

export function buildWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const loginUrl = `${FRONTEND_URL}/login/${data.tenantSlug}`;

  return {
    subject: `Bienvenido a Drivly — ${data.tenantName}`,
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
            <h2 style="color:#111827;margin:0 0 12px;font-size:20px;">¡Tu empresa está lista, ${data.adminName}!</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hemos creado la cuenta de <strong style="color:#111827;">${data.tenantName}</strong> en Drivly.
              Ya puedes iniciar sesión y comenzar a gestionar tu flota.
            </p>

            <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Datos de acceso</p>
                <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Empresa:</strong> ${data.tenantName}</p>
                <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>URL:</strong> /login/${data.tenantSlug}</p>
                <p style="margin:0;font-size:14px;color:#374151;"><strong>Email:</strong> ${data.adminEmail}</p>
              </td></tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="width:100%;">
              <tr><td align="center">
                <a href="${loginUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;">
                  Iniciar sesión →
                </a>
              </td></tr>
            </table>
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
