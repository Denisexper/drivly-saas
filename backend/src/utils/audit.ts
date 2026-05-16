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
  // Permite sobrescribir datos del usuario cuando req.user aún no está disponible (ej. login)
  userOverride?: { id: string; email: string; tenantId?: string | null };
}

export function logAction({ req, action, entity, entityId, before = null, after = null, userOverride }: LogActionParams): void {
  const userId    = userOverride?.id    ?? req.user!.id;
  const userEmail = userOverride?.email ?? req.user!.email;
  const tenantId  = userOverride?.tenantId !== undefined ? userOverride.tenantId : (req.user?.tenantId ?? null);

  prisma.auditLog
    .create({
      data: {
        tenantId,
        userId,
        userEmail,
        action,
        entity,
        entityId,
        resource:  req.originalUrl,
        method:    req.method,
        before:    before ?? undefined,
        after:     after  ?? undefined,
        ip:        req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      },
    })
    .catch((err) => console.error("[AuditLog] Failed to write log:", err));
}
