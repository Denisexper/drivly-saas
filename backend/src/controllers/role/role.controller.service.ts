import { Request, Response } from "express";
import { CustomRoleRepositoryInterface } from "../../interfaces/role/role.repository.interface";
import { CreateCustomRoleInput, UpdateCustomRoleInput } from "../../types/role/role.types";

export class CustomRoleControllerService {
  private repository: CustomRoleRepositoryInterface;

  constructor(repository: CustomRoleRepositoryInterface) {
    this.repository = repository;
  }

  async getAll(req: Request, res: Response) {
    const tenantId = req.user!.tenantId!;
    try {
      const roles = await this.repository.getAll(tenantId);
      return res.status(200).json({
        message: roles.length > 0 ? "Roles retrieved successfully" : "No custom roles found",
        data: roles,
        total: roles.length,
      });
    } catch (error: any) {
      console.error("[CustomRoleController] Error en getAll()", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const role = await this.repository.getById(id);
      if (!role) return res.status(404).json({ message: "Role not found" });
      return res.status(200).json({ message: "Role retrieved successfully", data: role });
    } catch (error: any) {
      console.error(`[CustomRoleController] Error en getById(${id})`, error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    const { name, description } = req.body;
    const tenantId = req.user!.tenantId!;
    try {
      const data: CreateCustomRoleInput = { tenantId, name, description };
      const role = await this.repository.create(data);
      return res.status(201).json({ message: "Role created successfully", data: role });
    } catch (error: any) {
      console.error("[CustomRoleController] Error en create()", error);
      if (error.message.includes("P2002")) {
        return res.status(400).json({ message: "A role with that name already exists" });
      }
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const data: UpdateCustomRoleInput = req.body;
    try {
      const exists = await this.repository.getById(id);
      if (!exists) return res.status(404).json({ message: "Role not found" });

      const role = await this.repository.update(id, data);
      return res.status(200).json({ message: "Role updated successfully", data: role });
    } catch (error: any) {
      console.error(`[CustomRoleController] Error en update(${id})`, error);
      if (error.message.includes("P2002")) {
        return res.status(400).json({ message: "A role with that name already exists" });
      }
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    try {
      const exists = await this.repository.getById(id);
      if (!exists) return res.status(404).json({ message: "Role not found" });

      const role = await this.repository.delete(id);
      return res.status(200).json({ message: "Role deleted successfully", data: role });
    } catch (error: any) {
      console.error(`[CustomRoleController] Error en delete(${id})`, error);
      if (error.message.includes("P2025")) {
        return res.status(404).json({ message: "Role not found" });
      }
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}
