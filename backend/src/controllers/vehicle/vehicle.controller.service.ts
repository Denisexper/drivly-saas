import logger from "../../utils/logger";
import { Request, Response, NextFunction } from "express";
import { VehicleRepositoryInterface } from "../../interfaces/vehicle/vehicle.repository.interface";
import {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../../types/vehicle/vehicle.types";
import { logAction } from "../../utils/audit";

export class VehicleControllerService {
  private repository: VehicleRepositoryInterface;

  constructor(repository: VehicleRepositoryInterface) {
    this.repository = repository;
  }

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const response = await this.repository.getById(id);

      if (!response) {
        return res.status(404).json({
          message: "Vehicle not found",
        });
      }

      return res.status(200).json({
        message: "Vehicle retrived successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          plate: response.plate,
          brand: response.brand,
          model: response.model,
          year: response.year,
          category: response.category,
          color: response.color,
          dailyRate: Number(response.dailyRate),
          status: response.status,
          fuelType: response.fuelType,
          transmission: response.transmission,
          seats: response.seats,
          mileage: response.mileage,
          notes: response.notes ?? "",
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[VehicleController] Error in getById(${id})`);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = (isSuperAdmin && !req.user!.isImpersonating)
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;

    try {
      const response = await this.repository.getAll(tenantId);

      const cleanData = response.map((vehicle) => ({
        id: vehicle.id,
        tenantId: vehicle.tenantId,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        color: vehicle.color,
        dailyRate: Number(vehicle.dailyRate),
        status: vehicle.status,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        seats: vehicle.seats,
        mileage: vehicle.mileage,
        notes: vehicle.notes ?? "",
      }));

      return res.status(200).json({
        message:
          cleanData.length > 0
            ? "Vehicle list retrived successfully"
            : "Vehicle list empty",
        data: cleanData,
        total: cleanData.length,
      });
    } catch (error) {
      logger.error({ err: error }, `[VehicleController] Error en getAll()`);
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const data: CreateVehicleInput = req.body;

    try {
      const response = await this.repository.create(data);

      logAction({ req, action: "CREATE", entity: "Vehicle", entityId: response.id, after: { ...response, dailyRate: Number(response.dailyRate) } });

      return res.status(201).json({
        message: "Vehicle created successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          plate: response.plate,
          brand: response.brand,
          model: response.model,
          year: response.year,
          category: response.category,
          dailyRate: response.dailyRate,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[VehicleController] Error en create()`);
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Plate already exist" });
      }
      return next(error);
    }
  }

  async update(
    req: Request<{ id: string }, {}, {}, { tenantId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    const { id } = req.params;

    const { tenantId } = req.query;

    const data: UpdateVehicleInput = req.body;

    try {
      const before = await this.repository.getById(id);
      const response = await this.repository.update(id, data);

      if (!response) {
        return res.status(404).json({
          message: "vehicle not found",
        });
      }

      logAction({
        req,
        action: "UPDATE",
        entity: "Vehicle",
        entityId: id,
        before: before ? { ...before, dailyRate: Number(before.dailyRate) } : null,
        after:  { ...response, dailyRate: Number(response.dailyRate) },
      });

      return res.status(200).json({
        message: "vehicle updated successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          plate: response.plate,
          brand: response.brand,
          model: response.model,
          year: response.year,
          category: response.category,
          dailyRate: response.dailyRate,
        }
      });
    } catch (error: any) {
      logger.error({ err: error }, `[VehicleController] Error en update(${id}):`);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return next(error);
    }
  }

  async delete(req: Request<{id: string}, {}, {}, {tenantId: string}>, res: Response, next: NextFunction){

    const { id } = req.params;

    const { tenantId } = req.query;

    try {
      
      const response = await this.repository.delete(id)

      if(!response){
        return res.status(404).json({
          message: "Vehicle not found"
        })
      }

      logAction({ req, action: "DELETE", entity: "Vehicle", entityId: id, before: { ...response, dailyRate: Number(response.dailyRate) } });

      return res.status(200).json({
        message: "Vehicle deleted successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          plate: response.plate,
          brand: response.brand,
          model: response.model,
          year: response.year,
          category: response.category,
          dailyRate: response.dailyRate,
        }
      })
    } catch (error: any) {
      logger.error({ err: error }, `[VehicleController] Error in delete(${id})`);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return next(error);
    }
  }
}
