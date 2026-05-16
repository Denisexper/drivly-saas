import { Request } from "express";
import prisma from "../dataBase/prisma";
import { AuditAction, AuditEntity } from "../types/audit/audit.types";

interface LogActionParams {
  req: Request;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

export function logAction({ req, action, entity, entityId, before = null, after = null }: LogActionParams): void {
  prisma.auditLog
    .create({
      data: {
        tenantId:  req.user!.tenantId ?? null,
        userId:    req.user!.id,
        userEmail: req.user!.email,
        action,
        entity,
        entityId,
        resource:  req.originalUrl,
        method:    req.method,
        before:    before  ?? undefined,
        after:     after   ?? undefined,
        ip:        req.ip  ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      },
    })
    .catch((err) => console.error("[AuditLog] Failed to write log:", err));
}
