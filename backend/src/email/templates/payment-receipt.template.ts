import { Client, Vehicle, Rental, Tenant, Payment } from "@prisma/client";

export type PaymentReceiptData = Payment & {
  rental: Rental & {
    client: Client;
    vehicle: Vehicle;
    tenant: Tenant;
  };
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  Deposito: "Depósito",
  PagoAlquiler: "Pago de alquiler",
  CobroDano: "Cobro por daño",
  CobroCombustible: "Cobro por combustible",
  CobrodiaExtra: "Cobro por día extra",
  Devolucion: "Devolución",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  Cash: "Efectivo",
  Card: "Tarjeta",
  Transfer: "Transferencia",
  Check: "Cheque",
};

export function buildPaymentReceiptEmail(data: PaymentReceiptData): { subject: string; html: string } {
  const fmt = (d: Date) => new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "long", year: "numeric" });
  const typeLabel = PAYMENT_TYPE_LABEL[data.type] ?? data.type;
  const methodLabel = PAYMENT_METHOD_LABEL[data.method] ?? data.method;
  const isDevolucion = data.type === "Devolucion";

  return {
    subject: `Recibo de pago — ${typeLabel} $${Number(data.amount).toFixed(2)}`,
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
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">${data.rental.tenant.name}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">Recibo de pago</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Hola <strong style="color:#111827;">${data.rental.client.firstName} ${data.rental.client.lastName}</strong>,
              hemos registrado el siguiente pago en tu cuenta.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
              <tr>
                <td style="background:${isDevolucion ? "#f0fdf4" : "#eff6ff"};border-left:4px solid ${isDevolucion ? "#16a34a" : "#1d4ed8"};padding:20px 24px;border-radius:0 6px 6px 0;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${typeLabel}</p>
                  <p style="margin:0;font-size:32px;font-weight:700;color:${isDevolucion ? "#16a34a" : "#1d4ed8"};">
                    $${Number(data.amount).toFixed(2)}
                  </p>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Detalle</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;width:50%;">Método de pago</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;">${methodLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Fecha</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;">${fmt(data.createdAt)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Vehículo</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;">${data.rental.vehicle.brand} ${data.rental.vehicle.model} · ${data.rental.vehicle.plate}</td>
                  </tr>
                  ${data.reference ? `
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Referencia</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;">${data.reference}</td>
                  </tr>` : ""}
                  ${data.notes ? `
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">Notas</td>
                    <td style="padding:4px 0;font-size:14px;color:#111827;">${data.notes}</td>
                  </tr>` : ""}
                </table>
              </td></tr>
            </table>

            <p style="color:#9ca3af;font-size:13px;margin:0;">${data.rental.tenant.name}</p>
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
