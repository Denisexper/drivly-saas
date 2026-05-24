import PDFDocument from "pdfkit";
import { Response } from "express";
import { PaymentWithDetails } from "../types/payment/payment.types";
import { RentalWithDetails } from "../types/rental/rental.types";

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

const FUEL_LEVEL_LABELS: Record<string, string> = {
    Full: "Lleno",
    ThreeQuarters: "3/4",
    Half: "1/2",
    Quarter: "1/4",
    Empty: "Vacío",
};

const TRANSMISSION_LABELS: Record<string, string> = {
    Automatic: "Automática",
    Manual: "Manual",
};

const FUEL_TYPE_LABELS: Record<string, string> = {
    Gasoline: "Gasolina",
    Diesel: "Diésel",
    Electric: "Eléctrico",
    Hybrid: "Híbrido",
};

const ID_TYPE_LABELS: Record<string, string> = {
    DUI: "DUI",
    Passport: "Pasaporte",
    ForeignId: "ID Extranjero",
};

export function generateRentalContractPDF(rental: RentalWithDetails, res: Response): void {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrato-${rental.id.slice(-8)}.pdf"`
    );

    doc.pipe(res);

    const clientName = `${rental.client.firstName} ${rental.client.lastName}`;
    const vehicleName = `${rental.vehicle.brand} ${rental.vehicle.model} ${rental.vehicle.year}`;

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(22).font("Helvetica-Bold").text(rental.tenant.name, 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text("Powered by Drivly", 50, 78);

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#000000").text("CONTRATO DE ALQUILER", 0, 50, { align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#666666")
        .text(`N° ${rental.id.slice(-8).toUpperCase()}`, 0, 78, { align: "right" })
        .text(`Emisión: ${formatDate(rental.createdAt)}`, 0, 92, { align: "right" });

    // ── Divider ──────────────────────────────────────────────────────────────
    doc.moveTo(50, 115).lineTo(545, 115).strokeColor("#DDDDDD").lineWidth(1).stroke();

    // ── Sección cliente + vehículo ────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("DATOS DEL CLIENTE", 50, 130);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("DATOS DEL VEHÍCULO", 320, 130);

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000").text(clientName, 50, 145);
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000").text(vehicleName, 320, 145);

    doc.fontSize(10).font("Helvetica").fillColor("#444444")
        .text(`${ID_TYPE_LABELS[rental.client.idType] ?? rental.client.idType}: ${rental.client.idNumber}`, 50, 162)
        .text(`Tel: ${rental.client.phone}`, 50, 177);

    let clientY = 192;
    if (rental.client.email) {
        doc.text(`Email: ${rental.client.email}`, 50, clientY);
        clientY += 15;
    }
    if (rental.client.address) {
        doc.text(`Dirección: ${rental.client.address}`, 50, clientY);
        clientY += 15;
    }
    if (rental.client.licenseNum) {
        doc.text(`Licencia: ${rental.client.licenseNum}`, 50, clientY);
    }

    doc.fontSize(10).font("Helvetica").fillColor("#444444")
        .text(`Placa: ${rental.vehicle.plate}`, 320, 162)
        .text(`Color: ${rental.vehicle.color}`, 320, 177)
        .text(`Transmisión: ${TRANSMISSION_LABELS[rental.vehicle.transmission] ?? rental.vehicle.transmission}`, 320, 192)
        .text(`Combustible: ${FUEL_TYPE_LABELS[rental.vehicle.fuelType] ?? rental.vehicle.fuelType}`, 320, 207)
        .text(`Asientos: ${rental.vehicle.seats}`, 320, 222);

    // ── Divider ──────────────────────────────────────────────────────────────
    const detailTop = 250;
    doc.moveTo(50, detailTop).lineTo(545, detailTop).strokeColor("#DDDDDD").lineWidth(1).stroke();

    // ── Detalles del alquiler ─────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("DETALLES DEL ALQUILER", 50, detailTop + 12);

    const d1 = detailTop + 28;
    doc.fontSize(10).font("Helvetica").fillColor("#444444")
        .text(`Fecha de salida:`, 50, d1).font("Helvetica-Bold").fillColor("#000000").text(formatDate(rental.startDate), 175, d1)
        .font("Helvetica").fillColor("#444444").text(`Fecha de retorno:`, 320, d1).font("Helvetica-Bold").fillColor("#000000").text(formatDate(rental.endDate), 445, d1);

    const d2 = d1 + 18;
    doc.font("Helvetica").fillColor("#444444")
        .text(`Tarifa diaria:`, 50, d2).font("Helvetica-Bold").fillColor("#000000").text(formatCurrency(rental.dailyRate), 175, d2)
        .font("Helvetica").fillColor("#444444").text(`Total de días:`, 320, d2).font("Helvetica-Bold").fillColor("#000000").text(`${rental.totalDays}`, 445, d2);

    const d3 = d2 + 18;
    doc.font("Helvetica").fillColor("#444444")
        .text(`Kilometraje salida:`, 50, d3).font("Helvetica-Bold").fillColor("#000000").text(`${rental.mileageStart} km`, 175, d3)
        .font("Helvetica").fillColor("#444444").text(`Combustible salida:`, 320, d3).font("Helvetica-Bold").fillColor("#000000").text(FUEL_LEVEL_LABELS[rental.fuelOut] ?? rental.fuelOut, 445, d3);

    const d4 = d3 + 18;
    doc.font("Helvetica").fillColor("#444444")
        .text(`Registrado por:`, 50, d4).font("Helvetica-Bold").fillColor("#000000").text(rental.user.name, 175, d4);

    // ── Resumen financiero ────────────────────────────────────────────────────
    const finTop = d4 + 35;
    doc.moveTo(50, finTop).lineTo(545, finTop).strokeColor("#DDDDDD").lineWidth(1).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("RESUMEN FINANCIERO", 50, finTop + 12);

    const f1 = finTop + 28;
    doc.rect(50, f1, 495, 90).fillColor("#F9FAFB").fill();

    function finRow(label: string, value: string, y: number, bold = false) {
        doc.fontSize(10).font("Helvetica").fillColor("#444444").text(label, 70, y);
        doc.fontSize(10).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor("#000000").text(value, 70, y, { width: 455, align: "right" });
    }

    finRow("Subtotal:", formatCurrency(rental.subtotal), f1 + 8);
    finRow(`Descuento:`, `(${formatCurrency(rental.discount)})`, f1 + 26);
    if (Number(rental.extraCharges) > 0) finRow("Cargos extra:", formatCurrency(rental.extraCharges), f1 + 44);

    doc.moveTo(70, f1 + 58).lineTo(525, f1 + 58).strokeColor("#DDDDDD").lineWidth(0.5).stroke();
    finRow("Total acordado:", formatCurrency(rental.totalAmount), f1 + 64, true);

    if (Number(rental.deposit) > 0) {
        doc.fontSize(9).font("Helvetica").fillColor("#666666")
            .text(`* Depósito recibido: ${formatCurrency(rental.deposit)}`, 70, f1 + 82);
    }

    // ── Notas ─────────────────────────────────────────────────────────────────
    let currentY = f1 + 110;
    if (rental.notes) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("NOTAS", 50, currentY);
        doc.fontSize(10).font("Helvetica").fillColor("#444444").text(rental.notes, 50, currentY + 14, { width: 495 });
        currentY += 40;
    }

    // ── Cláusulas ─────────────────────────────────────────────────────────────
    doc.moveTo(50, currentY + 10).lineTo(545, currentY + 10).strokeColor("#DDDDDD").lineWidth(1).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#888888").text("CONDICIONES GENERALES", 50, currentY + 22);

    const clausulas = [
        "El arrendatario se compromete a devolver el vehículo en las mismas condiciones en que lo recibió.",
        "Cualquier daño al vehículo durante el período de alquiler será responsabilidad del arrendatario.",
        "El arrendatario es responsable de las multas de tránsito incurridas durante el período de alquiler.",
        "El vehículo deberá ser devuelto con el mismo nivel de combustible indicado en este contrato.",
        "El incumplimiento de la fecha de devolución generará cargos por días adicionales.",
    ];

    let clausulaY = currentY + 36;
    clausulas.forEach((c, i) => {
        doc.fontSize(9).font("Helvetica").fillColor("#444444").text(`${i + 1}. ${c}`, 50, clausulaY, { width: 495 });
        clausulaY += 14;
    });

    // ── Firmas ────────────────────────────────────────────────────────────────
    const firmaY = clausulaY + 30;
    doc.moveTo(70, firmaY).lineTo(240, firmaY).strokeColor("#000000").lineWidth(0.5).stroke();
    doc.moveTo(310, firmaY).lineTo(480, firmaY).strokeColor("#000000").lineWidth(0.5).stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(clientName, 70, firmaY + 6, { width: 170, align: "center" })
        .text(rental.tenant.name, 310, firmaY + 6, { width: 170, align: "center" });

    doc.fontSize(8).font("Helvetica").fillColor("#666666")
        .text("Firma del Arrendatario", 70, firmaY + 18, { width: 170, align: "center" })
        .text("Firma del Arrendador", 310, firmaY + 18, { width: 170, align: "center" });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveTo(50, 780).lineTo(545, 780).strokeColor("#DDDDDD").lineWidth(1).stroke();
    doc.fontSize(8).font("Helvetica").fillColor("#AAAAAA")
        .text("Este documento es un contrato de alquiler generado por Drivly. Ambas partes conservarán una copia.", 50, 788, { align: "center" });

    doc.end();
}
