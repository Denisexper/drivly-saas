import logger from "../../utils/logger";
import { Request, Response } from "express";
import { TenantRepositoryInterface } from "../../interfaces/tenant/tenant.repository.interface";
import { seedTenantDefaultPermissions } from "../../permissions/sync";
import {
  UpdateTenantInput,
  CreateTenantWithAdminInput,
} from "../../types/tenant/tenant.types";
import { slugify } from "../../utils/slugify";
import { EncryptService } from "../../services/encrypt.service";
import { sendWelcomeEmail } from "../../email/email.service";

export class TenantControllerService {
  private repository: TenantRepositoryInterface;

  constructor(repository: TenantRepositoryInterface) {
    this.repository = repository;
  }

  async getPublicBySlug(req: Request<{ slug: string }>, res: Response) {
    const { slug } = req.params;
    try {
      const tenant = await this.repository.getBySlug(slug);
      if (!tenant) return res.status(404).json({ message: "Empresa no encontrada" });
      return res.status(200).json({
        data: { name: tenant.name, slug: tenant.slug, active: tenant.active },
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
      const response = await this.repository.getById(id);

      if (!response) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      return res.status(200).json({
        message: "Tenant retrived successfully",
        data: {
          id: response.id,
          name: response.name,
          slug: response.slug,
          plan: response.plan,
          active: response.active,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[TenantController] Error en getById(${id}):`);

      //general erros
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const response = await this.repository.getAll();

      const cleanData = response.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        active: tenant.active,
        createdAt: tenant.createdAt,
      }));

      return res.status(200).json({
        message:
          cleanData.length > 0
            ? "Tenant retrived successfully"
            : "Tenant list empty",
        data: cleanData,
      });
    } catch (error: any) {
      logger.error({ err: error }, `[TenantController] Error en getAll():`);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.repository.getStats();
      return res.status(200).json({ message: "Stats retrieved successfully", data: stats });
    } catch (error: any) {
      logger.error({ err: error }, "[TenantController] Error en getStats():");
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    const { name, plan, adminName, adminEmail, adminPassword }: CreateTenantWithAdminInput = req.body;

    if (!name || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: {
          name: !name ? "Required" : "OK",
          adminName: !adminName ? "Required" : "OK",
          adminEmail: !adminEmail ? "Required" : "OK",
          adminPassword: !adminPassword ? "Required" : "OK",
        },
      });
    }

    try {
      const slug = slugify(name);

      if (!slug) {
        return res.status(400).json({ message: "El nombre no genera un slug válido" });
      }

      const slugExists = await this.repository.getBySlug(slug);
      if (slugExists) {
        return res.status(409).json({ message: `El slug '${slug}' ya está en uso. Elige un nombre diferente.` });
      }

      const hashedPassword = await EncryptService.hashPassword(adminPassword);

      const { tenant, admin } = await this.repository.createWithAdmin(
        { name, slug, plan: plan ?? 'Basic', active: true },
        { name: adminName, email: adminEmail, password: hashedPassword }
      );

      await seedTenantDefaultPermissions(tenant.id);

      sendWelcomeEmail({ adminName, adminEmail, tenantName: tenant.name, tenantSlug: tenant.slug }).catch(
        (err) => logger.error({ err: err }, "[Email] sendWelcomeEmail failed:")
      );

      return res.status(201).json({
        message: "Empresa creada exitosamente",
        data: {
          tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, active: tenant.active },
          admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[TenantController] Error en create():`);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const data: UpdateTenantInput = req.body;

    const tenantExist = await this.repository.getById(id);

    if (!tenantExist) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data provided" });
    }

    //validar los espacios en blanco
    const values = Object.values(data);
    const hasContent = values.some(
      (val) =>
        val !== null && val !== undefined && val.toString().trim() !== "",
    );

    if (!hasContent) {
      return res.status(400).json({ message: "Provided fields cannot be empty" });
    }

    try {
      const response = await this.repository.update(id, data);

      return res.status(200).json({
        message: "Tenant updated successfully",
        data: {
          id: response.id,
          name: response.name,
          slug: response.slug,
          plan: response.plan,
          active: response.active,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[TenantController] Error en update(${id}):`);
      if (error.code === "P2025") {
        // Código de Prisma para "Record not found"
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
      const response = await this.repository.delete(id);

      if (!response) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      return res.status(200).json({
        message: "Tenant deleted successfully",
        data: {
          id: response.id,
          name: response.name,
          slug: response.slug,
          plan: response.plan,
          active: response.active,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[TenantController] Error en delete(${id}):`);

      if (error.code === "P2025") {
        return res.status(404).json({
          message: "Tenant not found2",
        });
      }

      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
}
