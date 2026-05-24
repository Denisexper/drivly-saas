import { Request, Response } from "express";
import { RentalRepositoryInterface } from "../../interfaces/rental/rental.repository.interface";
import { CreateRentalBody, ReturnRentalInput, UpdateRentalInput } from "../../types/rental/rental.types";
import { sendRentalConfirmEmail, sendRentalReturnEmail } from "../../email/email.service";
import { logAction } from "../../utils/audit";
import { generateRentalContractPDF } from "../../utils/pdf";
import { Rental } from "@prisma/client";

// Solo los campos escalares del alquiler, sin relaciones ni datos sensibles
function sanitizeRental(r: Rental) {
  return {
    id: r.id, tenantId: r.tenantId, vehicleId: r.vehicleId, clientId: r.clientId,
    userId: r.userId, status: r.status, startDate: r.startDate, endDate: r.endDate,
    actualReturn: r.actualReturn, dailyRate: Number(r.dailyRate), totalDays: r.totalDays,
    subtotal: Number(r.subtotal), discount: Number(r.discount),
    extraCharges: Number(r.extraCharges), totalAmount: Number(r.totalAmount),
    deposit: Number(r.deposit),
    mileageStart: r.mileageStart, mileageEnd: r.mileageEnd,
    fuelOut: r.fuelOut, fuelIn: r.fuelIn, notes: r.notes,
  };
}

export class RentalControllerService {
  constructor(private readonly repository: RentalRepositoryInterface) {}

  async getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const rental = await this.repository.getById(id);
      if (!rental) return res.status(404).json({ msj: "Rental not found" });
      return res.status(200).json({ msj: "Rental retrieved successfully", data: rental });
    } catch (error: any) {
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = (isSuperAdmin && !req.user!.isImpersonating)
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;
    const status = req.query.status as string | undefined;
    const VALID_STATUSES = ["Active", "Reserved", "Completed", "Cancelled"];
    const statusFilter = status && VALID_STATUSES.includes(status) ? status : undefined;
    try {
      const rentals = await this.repository.getAll(tenantId, statusFilter);
      return res.status(200).json({
        msj: rentals.length > 0 ? "Rentals retrieved successfully" : "No rentals found",
        data: rentals,
      });
    } catch (error: any) {
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    const body: CreateRentalBody = req.body;
    const { vehicleId, clientId, startDate, endDate } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      // 1. Verificar que el vehiculo existe y esta disponible
      const vehicle = await this.repository.findVehicle(vehicleId);
      if (!vehicle) return res.status(404).json({ msj: "Vehicle not found" });
      if (vehicle.status !== "Available") {
        return res.status(409).json({ msj: `Vehicle is not available. Current status: ${vehicle.status}` });
      }

      // 2. Verificar que el cliente existe y no esta en blacklist
      const client = await this.repository.findClient(clientId);
      if (!client) return res.status(404).json({ msj: "Client not found" });
      if (client.blacklisted) {
        return res.status(403).json({ msj: "Client is blacklisted and cannot rent vehicles" });
      }

      // 3. Verificar licencia vigente
      if (client.licenseExp && new Date(client.licenseExp) < new Date()) {
        return res.status(403).json({ msj: "Client driver license is expired" });
      }

      // 4. Verificar conflicto de fechas con otros alquileres del mismo vehiculo
      const conflict = await this.repository.hasDateConflict(vehicleId, start, end);
      if (conflict) {
        return res.status(409).json({ msj: "Vehicle already has a rental in the selected date range" });
      }

      // 5. Calcular totales
      const dailyRate = Number(vehicle.dailyRate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const subtotal = dailyRate * totalDays;
      const discount = body.discount ?? 0;
      const extraCharges = 0;
      const totalAmount = subtotal - discount + extraCharges;

      // 6. Crear el alquiler (la transaccion cambia el vehiculo a Rented)
      const rental = await this.repository.create({
        tenantId: req.user!.tenantId,
        vehicleId,
        clientId,
        userId: req.user!.id,
        startDate: start,
        endDate: end,
        dailyRate,
        totalDays,
        subtotal,
        discount,
        extraCharges,
        totalAmount,
        deposit: body.deposit ?? 0,
        depositMethod: body.depositMethod ?? "Cash",
        mileageStart: body.mileageStart ?? vehicle.mileage,
        fuelOut: body.fuelOut ?? "Full",
        status: "Active",
        notes: body.notes ?? null,
        actualReturn: null,
        mileageEnd: null,
        fuelIn: null,
      });

      sendRentalConfirmEmail(rental.id).catch((err) => console.error("[Email] sendRentalConfirmEmail failed:", err));
      logAction({ req, action: "CREATE", entity: "Rental", entityId: rental.id, after: sanitizeRental(rental) });

      return res.status(201).json({ msj: "Rental created successfully", data: rental });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ msj: error.message });
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const data: UpdateRentalInput = req.body;

    try {
      const rentalExist = await this.repository.getById(id);
      if (!rentalExist) return res.status(404).json({ msj: "Rental not found" });

      if (rentalExist.status === "Completed" || rentalExist.status === "Cancelled") {
        return res.status(400).json({ msj: `Cannot update a rental with status: ${rentalExist.status}` });
      }

      // Flujo de devolucion
      if (data.status === "Completed") {
        const returnData: ReturnRentalInput = {
          actualReturn: data.actualReturn ? new Date(data.actualReturn as any) : undefined,
          mileageEnd: data.mileageEnd ?? undefined,
          fuelIn: data.fuelIn ?? undefined,
          extraCharges: data.extraCharges ? Number(data.extraCharges) : undefined,
          notes: data.notes ?? undefined,
        };
        const completed = await this.repository.returnVehicle(id, returnData);

        sendRentalReturnEmail(id).catch((err) => console.error("[Email] sendRentalReturnEmail failed:", err));
        logAction({ req, action: "RETURN", entity: "Rental", entityId: id, before: sanitizeRental(rentalExist), after: sanitizeRental(completed) });

        return res.status(200).json({ msj: "Rental completed and vehicle returned successfully", data: completed });
      }

      // Flujo de cancelacion
      if (data.status === "Cancelled") {
        const cancelled = await this.repository.cancelRental(id, data.notes ?? undefined);
        logAction({ req, action: "CANCEL", entity: "Rental", entityId: id, before: sanitizeRental(rentalExist), after: sanitizeRental(cancelled) });
        return res.status(200).json({ msj: "Rental cancelled and vehicle released successfully", data: cancelled });
      }

      const updated = await this.repository.update(id, data);
      logAction({ req, action: "UPDATE", entity: "Rental", entityId: id, before: sanitizeRental(rentalExist), after: sanitizeRental(updated) });
      return res.status(200).json({ msj: "Rental updated successfully", data: updated });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ msj: error.message });
      if (error.code === "P2025") return res.status(404).json({ msj: "Rental not found" });
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async forceDelete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const deleted = await this.repository.forceDelete(id);
      return res.status(200).json({ msj: "Rental force deleted successfully", data: deleted });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ msj: error.message });
      if (error.code === "P2025") return res.status(404).json({ msj: "Rental not found" });
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async getPdfContract(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const rental = await this.repository.getByIdWithDetails(id);
      if (!rental) return res.status(404).json({ msj: "Rental not found" });
      generateRentalContractPDF(rental, res);
    } catch (error: any) {
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const rentalExist = await this.repository.getById(id);
      if (!rentalExist) return res.status(404).json({ msj: "Rental not found" });

      if (rentalExist.status === "Active") {
        return res.status(400).json({ msj: "Cannot delete an active rental. Complete or cancel it first." });
      }

      await this.repository.delete(id);
      logAction({ req, action: "DELETE", entity: "Rental", entityId: id, before: sanitizeRental(rentalExist) });
      return res.status(200).json({ msj: "Rental deleted successfully" });
    } catch (error: any) {
      if (error.code === "P2025") return res.status(404).json({ msj: "Rental not found" });
      return res.status(500).json({ msj: "Server error", error: error.message });
    }
  }
}
