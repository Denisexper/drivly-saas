import { ClientRepository } from "../../repositories/client/client.repository";
import { Request, Response, NextFunction } from "express";
import {
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client/client.types";

export class ClienteControllerService {
  private repository: ClientRepository;

  constructor(repository: ClientRepository) {
    this.repository = repository;
  }

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      const response = await this.repository.getById(id);

      if (!response) {
        return next({status: 404, message: "Client not found"});
      }

      return res.status(200).json({
        msj: "Client retrieved sucessfully",
        data: response,
      });
    } catch (error: any) {
      next(error)
    }
  }
  async getAll(req: Request, res: Response) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = (isSuperAdmin && !req.user!.isImpersonating)
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;
    try {
      const response = await this.repository.getAll(tenantId);

      if (response.length === 0) {
        return res.status(200).json({
          msj: "The list currently is Empty",
          data: response,
          total: response.length,
        });
      }

      return res.status(200).json({
        msj: "Clients retrived sucessfully",
        data: response,
        total: response.length,
      });
    } catch (error: any) {
      res.status(500).json({
        msj: "Server error",
        error: error.message,
      });
    }
  }

  async create(req: Request, res: Response) {
    const tenantId = req.user!.tenantId;
    const data: CreateClientInput = { ...req.body, tenantId };

    try {
      const response = await this.repository.create(data);

      return res.status(201).json({
        msj: "Client Created sucessfully",
        client: {
          id: response.id,
          firstName: response.firstName,
          lastName: response.lastName,
          address: response.address,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        msj: "Server error",
        error: error.message,
      });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const data: UpdateClientInput = req.body;

    try {
      const response = await this.repository.update(id, data);

      return res.status(200).json({
        msj: "Client updated successfully",
        data: response,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        // Código de Prisma para "Record not found"
        return res.status(404).json({ msj: "Client not found" });
      }
      res.status(500).json({
        msj: "Server error",
        error: error.message,
      });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
      const response = await this.repository.delete(id);

      return res.status(200).json({
        msj: "Client deleted successfully",
        ClientDeleted: {
          id: response.id,
          fname: `${response.firstName} ${response.lastName}`
        },
      });
    } catch (error: any) {
      //excepcion si el id no existe
      if (error.code === "P2025") {
        return res.status(404).json({
          msj: "Client not found",
        });
      }

      res.status(500).json({
        msj: "Server error",
        error: error.message,
      });
    }
  }
}
