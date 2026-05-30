import logger from "../utils/logger";
import prisma from "../dataBase/prisma";
import { syncPermissions, seedTenantDefaultPermissions } from "./sync";

async function main() {
  await syncPermissions();
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    await seedTenantDefaultPermissions(tenant.id);
  }
  logger.info(`Done. Seeded ${tenants.length} tenants.`);
  await prisma.$disconnect();
}

main().catch((e) => { logger.error(e); process.exit(1); });
