import { PrismaClient } from "@prisma/client";
import { AuditRepositoryInterface } from "../../interfaces/audit/audit.repository.interface";
import { AuditLogEntry, GetAuditLogsFilter } from "../../types/audit/audit.types";

export class AuditRepository implements AuditRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(filter: GetAuditLogsFilter): Promise<{ data: AuditLogEntry[]; total: number }> {
    const { tenantId, entity, action, userId, dateFrom, dateTo, page = 1, limit = 50 } = filter;

    const where: Record<string, any> = {};

    if (tenantId) where.tenantId = tenantId;
    if (entity)   where.entity   = entity;
    if (action)   where.action   = action;
    if (userId)   where.userId   = userId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo)   where.createdAt.lte = dateTo;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data as AuditLogEntry[], total };
  }
}
