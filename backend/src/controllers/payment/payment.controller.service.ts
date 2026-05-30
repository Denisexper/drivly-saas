import logger from "../../utils/logger";
import { PaymentRepositoryInterface } from "../../interfaces/payment/payment.repository.interface";
import { Request, Response } from "express";
import { CreatePaymentInput } from "../../types/payment/payment.types";
import { generatePaymentReceiptPDF } from "../../utils/pdf";
import { sendPaymentReceiptEmail } from "../../email/email.service";
import { logAction } from "../../utils/audit";

export class PaymentControllerService {
  constructor(private readonly repository: PaymentRepositoryInterface) {}

  async getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.repository.getById(id);
      if (!response) return res.status(404).json({ message: "Payment not found" });
      return res.status(200).json({
        message: "Payment retrived successfully",
        data: { ...response, amount: response.amount.toString() },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[Payment controller] Error en getById(${id}):`);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = (isSuperAdmin && !req.user!.isImpersonating)
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;
    try {
      const response = await this.repository.getAll(tenantId);
      return res.status(200).json({
        message: response.length > 0 ? "Payments retrived successfully" : "Payments list empty",
        data: response,
      });
    } catch (error: any) {
      logger.error({ err: error }, "[PaymentController] Error en getAll():");
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    const data: CreatePaymentInput = req.body;
    try {
      const response = await this.repository.create(data);

      sendPaymentReceiptEmail(response.id).catch((err) => logger.error({ err: err }, "[Email] sendPaymentReceiptEmail failed:"));
      logAction({ req, action: "CREATE", entity: "Payment", entityId: response.id, after: { ...response, amount: response.amount.toString() } });

      return res.status(201).json({
        message: "Payment created successfully",
        data: {
          id: response.id,
          rentalId: response.rentalId,
          amount: response.amount.toString(),
          method: response.method,
          type: response.type,
          notes: response.notes,
        },
      });
    } catch (error: any) {
      // Validation error from repository (exceeds rental total)
      if (error.message?.includes("El monto excede") || error.message?.includes("Rental not found")) {
        return res.status(422).json({ message: error.message });
      }
      logger.error({ err: error }, "[PaymentController] Error en create():");
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const isExist = await this.repository.getById(id);
      if (!isExist) return res.status(404).json({ message: "Payment not found" });
      const response = await this.repository.delete(id);
      logAction({ req, action: "DELETE", entity: "Payment", entityId: id, before: { ...isExist, amount: isExist.amount.toString() } });
      return res.status(200).json({
        message: "Payment deleted successfully",
        data: {
          id: response.id,
          rentalId: response.rentalId,
          amount: response.amount.toString(),
          method: response.method,
          notes: response.notes,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") return res.status(404).json({ message: "Payment not found" });
      logger.error({ err: error }, `[PaymentController] Error en delete(${id}):`);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getPdfReceipt(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const payment = await this.repository.getByIdWithDetails(id);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      generatePaymentReceiptPDF(payment, res);
    } catch (error: any) {
      logger.error({ err: error }, `[PaymentController] Error en getPdfReceipt(${id}):`);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getPaymentSummary(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const summary = await this.repository.getPaymentSummary(id);
      return res.status(200).json({ message: "Payment summary retrieved", data: summary });
    } catch (error: any) {
      if (error.message === "Rental not found") return res.status(404).json({ message: "Rental not found" });
      logger.error({ err: error }, `[PaymentController] Error en getPaymentSummary(${id}):`);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}
