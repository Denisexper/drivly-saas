import { Client, Vehicle, Rental, Tenant, User } from "@prisma/client";

export type RentalConfirmData = Rental & {
  client: Client;
  vehicle: Vehicle;
  user: User;
  tenant: Tenant;
};

export function buildRentalConfirmEmail(data: RentalConfirmData): { subject: string; html: string } {
  const fmt = (d: Date) => new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "long", year: "numeric" });

  return {
    subject: `Confirmación de alquiler — ${data.vehicle.brand} ${data.vehicle.model}`,
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
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">${data.tenant.name}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">Alquiler confirmado</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Hola <strong style="color:#111827;">${data.client.firstName} ${data.client.lastName}</strong>,
              tu alquiler ha sido registrado exitosamente.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
              <tr>
                <td style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:16px 20px;border-radius:0 6px 6px 0;">
                  <p style="margin:0;font-size:14px;color:#1d4ed8;font-weight:600;">
                    ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year} · ${data.vehicle.plate}
                  </p>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Detalle del alquiler</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;width:50%;">Fecha de salida</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${fmt(data.startDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Fecha de devolución</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${fmt(data.endDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Días</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${data.totalDays}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Tarifa diaria</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">$${Number(data.dailyRate).toFixed(2)}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:12px 0 4px;font-size:15px;color:#111827;font-weight:700;">Total acordado</td>
                    <td style="padding:12px 0 4px;font-size:15px;color:#1d4ed8;font-weight:700;">$${Number(data.totalAmount).toFixed(2)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="color:#9ca3af;font-size:13px;margin:0;">
              Atendido por: <strong style="color:#6b7280;">${data.user.name}</strong> · ${data.tenant.name}
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
