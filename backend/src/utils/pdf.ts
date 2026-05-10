import PDFDocument from "pdfkit";
import { Response } from "express";
import { PaymentWithDetails } from "../types/payment/payment.types";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    Deposito: "Depósito",
    PagoAlquiler: "Pago de Alquiler",
    CobroDano: "Cobro por Daño",
    CobroCombustible: "Cobro por Combustible",
    CobrodiaExtra: "Cobro por Día Extra",
    Devolucion: "Devolución",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    Cash: "Efectivo",
    Card: "Tarjeta",
    Transfer: "Transferencia",
    Check: "Cheque",
};

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("es-SV", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatCurrency(value: string | number): string {
    return `$${Number(value).toFixed(2)}`;
}

export function generatePaymentReceiptPDF(payment: PaymentWithDetails, res: Response): void {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="recibo-${payment.id.slice(-8)}.pdf"`
    );

    doc.pipe(res);

    const { rental } = payment;
    const clientName = `${rental.client.firstName} ${rental.client.lastName}`;

    // ── Header ──────────────────────────────────────────────────────────────
    doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(rental.tenant.name, 50, 50);

    doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Powered by Drivly", 50, 78);

    doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("RECIBO DE PAGO", 0, 50, { align: "right" });

    doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`N° ${payment.id.slice(-8).toUpperCase()}`, 0, 78, { align: "right" })
        .text(`Fecha: ${formatDate(payment.createdAt)}`, 0, 92, { align: "right" });

    // ── Divider ──────────────────────────────────────────────────────────────
    doc
        .moveTo(50, 115)
        .lineTo(545, 115)
        .strokeColor("#DDDDDD")
        .lineWidth(1)
        .stroke();

    // ── Client section ───────────────────────────────────────────────────────
    doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("EMITIDO A", 50, 130);

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(clientName, 50, 145);

    doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#444444")
        .text(`DUI / ID: ${rental.client.idNumber}`, 50, 162)
        .text(`Tel: ${rental.client.phone}`, 50, 177);

    if (rental.client.email) {
        doc.text(`Email: ${rental.client.email}`, 50, 192);
    }

    // ── Rental section ────────────────────────────────────────────────────────
    doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("VEHÍCULO / ALQUILER", 320, 130);

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`${rental.vehicle.brand} ${rental.vehicle.model}`, 320, 145);

    doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#444444")
        .text(`Placa: ${rental.vehicle.plate}`, 320, 162)
        .text(`Inicio: ${formatDate(rental.startDate)}`, 320, 177)
        .text(`Fin acordado: ${formatDate(rental.endDate)}`, 320, 192);

    // ── Divider ──────────────────────────────────────────────────────────────
    const tableTop = rental.client.email ? 225 : 215;

    doc
        .moveTo(50, tableTop)
        .lineTo(545, tableTop)
        .strokeColor("#DDDDDD")
        .lineWidth(1)
        .stroke();

    // ── Payment detail table header ───────────────────────────────────────────
    const rowY = tableTop + 15;

    doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("CONCEPTO", 50, rowY)
        .text("MÉTODO", 270, rowY)
        .text("MONTO", 450, rowY, { width: 95, align: "right" });

    doc
        .moveTo(50, rowY + 18)
        .lineTo(545, rowY + 18)
        .strokeColor("#DDDDDD")
        .stroke();

    // ── Payment row ───────────────────────────────────────────────────────────
    const detailY = rowY + 28;
    const typeLabel = PAYMENT_TYPE_LABELS[payment.type] ?? payment.type;
    const methodLabel = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(typeLabel, 50, detailY);

    doc
        .fontSize(11)
        .font("Helvetica")
        .text(methodLabel, 270, detailY);

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(formatCurrency(payment.amount), 450, detailY, { width: 95, align: "right" });

    if (payment.notes) {
        doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#666666")
            .text(`Nota: ${payment.notes}`, 50, detailY + 18);
    }

    // ── Total box ─────────────────────────────────────────────────────────────
    const totalBoxY = detailY + (payment.notes ? 55 : 40);

    doc
        .rect(380, totalBoxY, 165, 36)
        .fillColor("#F5F5F5")
        .fill();

    doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#444444")
        .text("Total del alquiler:", 390, totalBoxY + 8);

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(formatCurrency(rental.totalAmount), 390, totalBoxY + 8, { width: 145, align: "right" });

    doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Ref. alquiler: ${rental.id.slice(-8).toUpperCase()}`, 390, totalBoxY + 24);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
        .moveTo(50, 760)
        .lineTo(545, 760)
        .strokeColor("#DDDDDD")
        .stroke();

    doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#AAAAAA")
        .text(
            "Este documento es un comprobante de pago generado por Drivly. Guárdelo para sus registros.",
            50,
            768,
            { align: "center" }
        );

    doc.end();
}
