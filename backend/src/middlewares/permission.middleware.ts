import logger from "../utils/logger";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import prisma from "../dataBase/prisma";
import { PermissionKey } from "../permissions/manifest";

async function userHasAnyPermission(userId: string, tenantId: string | null, permissionKeys: PermissionKey[]): Promise<boolean> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser || !dbUser.active) return false;

  const perms = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  if (perms.length === 0) return false;

  const permIds = perms.map((p) => p.id);

  if (dbUser.customRoleId) {
    const count = await prisma.customRolePermission.count({
      where: { customRoleId: dbUser.customRoleId, permissionId: { in: permIds } },
    });
    return count > 0;
  } else {
    if (!tenantId) return false;
    const count = await prisma.rolePermission.count({
      where: { tenantId, role: dbUser.role as Role, permissionId: { in: permIds } },
    });
    return count > 0;
  }
}

export const checkPermissionAny = (...permissionKeys: PermissionKey[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    if (user.role === "SuperAdmin") return next();

    try {
      const has = await userHasAnyPermission(user.id, user.tenantId ?? null, permissionKeys);
      if (has) return next();
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    } catch (error) {
      logger.error({ err: error }, "[PermissionMiddleware] Error:");
      return res.status(500).json({ message: "Server error during permission check" });
    }
  };
};

export const checkPermission = (permissionKey: PermissionKey) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    if (user.role === "SuperAdmin") return next();

    try {
      const has = await userHasAnyPermission(user.id, user.tenantId ?? null, [permissionKey]);
      if (!has) return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      next();
    } catch (error) {
      logger.error({ err: error }, "[PermissionMiddleware] Error:");
      return res.status(500).json({ message: "Server error during permission check" });
    }
  };
};
