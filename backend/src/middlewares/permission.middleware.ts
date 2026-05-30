import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import prisma from "../dataBase/prisma";
import { PermissionKey } from "../permissions/manifest";

async function userHasPermission(userId: string, tenantId: string | null, role: Role | string, permissionKey: PermissionKey): Promise<boolean> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser || !dbUser.active) return false;

  const perm = await prisma.permission.findUnique({ where: { key: permissionKey } });
  if (!perm) return false;

  if (dbUser.customRoleId) {
    const has = await prisma.customRolePermission.findUnique({
      where: { customRoleId_permissionId: { customRoleId: dbUser.customRoleId, permissionId: perm.id } },
    });
    return !!has;
  } else {
    if (!tenantId) return false;
    const has = await prisma.rolePermission.findUnique({
      where: { tenantId_role_permissionId: { tenantId, role: dbUser.role as Role, permissionId: perm.id } },
    });
    return !!has;
  }
}

export const checkPermissionAny = (...permissionKeys: PermissionKey[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    if (user.role === "SuperAdmin") return next();

    try {
      const results = await Promise.all(
        permissionKeys.map((key) => userHasPermission(user.id, user.tenantId ?? null, user.role, key))
      );
      if (results.some(Boolean)) return next();
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    } catch (error) {
      console.error("[PermissionMiddleware] Error:", error);
      return res.status(500).json({ message: "Server error during permission check" });
    }
  };
};

export const checkPermission = (permissionKey: PermissionKey) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;

    // SuperAdmin siempre pasa, en modo normal o impersonación
    if (user.role === "SuperAdmin") return next();

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser || !dbUser.active) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (dbUser.customRoleId) {
        // Usuario con rol personalizado
        const perm = await prisma.permission.findUnique({ where: { key: permissionKey } });
        if (!perm) return res.status(403).json({ message: "Permission not found" });

        const hasPermission = await prisma.customRolePermission.findUnique({
          where: { customRoleId_permissionId: { customRoleId: dbUser.customRoleId, permissionId: perm.id } },
        });

        if (!hasPermission) {
          return res.status(403).json({ message: "Forbidden: insufficient permissions" });
        }
      } else {
        // Usuario con rol base (Admin, Operator, Auditor)
        const tenantId = user.tenantId;
        if (!tenantId) return res.status(403).json({ message: "Forbidden: no tenant assigned" });

        const perm = await prisma.permission.findUnique({ where: { key: permissionKey } });
        if (!perm) return res.status(403).json({ message: "Permission not found" });

        const hasPermission = await prisma.rolePermission.findUnique({
          where: { tenantId_role_permissionId: { tenantId, role: dbUser.role as Role, permissionId: perm.id } },
        });

        if (!hasPermission) {
          return res.status(403).json({ message: "Forbidden: insufficient permissions" });
        }
      }

      next();
    } catch (error) {
      console.error("[PermissionMiddleware] Error:", error);
      return res.status(500).json({ message: "Server error during permission check" });
    }
  };
};
