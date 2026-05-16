import { Role } from "@prisma/client";
import prisma from "../dataBase/prisma";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "./manifest";

export async function syncPermissions(): Promise<void> {
  const allPerms = Object.values(PERMISSIONS);
  const validKeys = allPerms.map((p) => p.key);

  for (const perm of allPerms) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { module: perm.module, action: perm.action, description: perm.description },
      create: perm,
    });
  }

  // Eliminar permisos que ya no existen en el manifest
  await prisma.permission.deleteMany({
    where: { key: { notIn: validKeys } },
  });

  console.log(`[Permissions] ${allPerms.length} permissions synced`);

  // Propagar permisos nuevos del manifest a todos los tenants existentes
  await propagateNewPermissionsToExistingTenants();
}

// Asegura que todos los tenants existentes tengan los permisos del manifest
// para cada rol base. Solo hace upsert — nunca quita permisos ya asignados.
async function propagateNewPermissionsToExistingTenants(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  const baseRoles: Role[] = ["Admin", "Operator", "Auditor"];

  for (const { id: tenantId } of tenants) {
    for (const role of baseRoles) {
      const keys = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
      const permissions = await prisma.permission.findMany({
        where: { key: { in: [...keys] } },
      });

      for (const perm of permissions) {
        await prisma.rolePermission.upsert({
          where: { tenantId_role_permissionId: { tenantId, role, permissionId: perm.id } },
          update: {},
          create: { tenantId, role, permissionId: perm.id },
        });
      }
    }
  }

  console.log(`[Permissions] Role permissions propagated to ${tenants.length} tenant(s)`);
}

// Seed de permisos por defecto para los roles base de un tenant nuevo
export async function seedTenantDefaultPermissions(tenantId: string): Promise<void> {
  const baseRoles: Role[] = ["Admin", "Operator", "Auditor"];

  for (const role of baseRoles) {
    const keys = DEFAULT_ROLE_PERMISSIONS[role] ?? [];

    const permissions = await prisma.permission.findMany({
      where: { key: { in: [...keys] } },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: { tenantId_role_permissionId: { tenantId, role, permissionId: perm.id } },
        update: {},
        create: { tenantId, role, permissionId: perm.id },
      });
    }
  }

  console.log(`[Permissions] Default permissions seeded for tenant ${tenantId}`);
}
