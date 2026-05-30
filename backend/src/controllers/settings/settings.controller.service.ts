import { Request, Response } from "express";
import { TenantRepositoryInterface } from "../../interfaces/tenant/tenant.repository.interface";
import { UpdateSettingsInput } from "../../types/settings/settings.types";

export class SettingsControllerService {
  private repository: TenantRepositoryInterface;

  constructor(repository: TenantRepositoryInterface) {
    this.repository = repository;
  }

  async getMySettings(req: Request, res: Response) {
    const tenantId = req.user!.tenantId;

    try {
      const tenant = await this.repository.getById(tenantId);

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      return res.status(200).json({
        message: "Settings retrieved successfully",
        data: {
          emailNotifications: tenant.emailNotifications,
        },
      });
    } catch (error: any) {
      console.error("[SettingsController] Error en getMySettings():", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async updateMySettings(req: Request, res: Response) {
    const tenantId = req.user!.tenantId;
    const data: UpdateSettingsInput = req.body;

    try {
      const updated = await this.repository.update(tenantId, data);

      return res.status(200).json({
        message: "Settings updated successfully",
        data: {
          emailNotifications: updated.emailNotifications,
        },
      });
    } catch (error: any) {
      console.error("[SettingsController] Error en updateMySettings():", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}
