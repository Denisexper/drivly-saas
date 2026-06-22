import logger from "../../utils/logger";
import { Request, Response, NextFunction } from "express";
import { AuditRepositoryInterface } from "../../interfaces/audit/audit.repository.interface";
import { GetAuditLogsFilter } from "../../types/audit/audit.types";

export class AuditControllerService {
  constructor(private readonly repository: AuditRepositoryInterface) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = isSuperAdmin
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filter: GetAuditLogsFilter = {
      tenantId,
      entity:   req.query.entity   as string | undefined,
      action:   req.query.action   as string | undefined,
      userId:   req.query.userId   as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo:   req.query.dateTo   ? new Date(req.query.dateTo   as string) : undefined,
      page,
      limit,
    };

    try {
      const { data, total } = await this.repository.getAll(filter);

      return res.status(200).json({
        message: "Audit logs retrieved successfully",
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error({ err: error }, "[AuditController] Error en getAll():");
      return next(error);
    }
  }
}
