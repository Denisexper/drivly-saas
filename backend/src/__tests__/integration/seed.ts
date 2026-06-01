import bcrypt from "bcrypt";
import prisma from "../../dataBase/prisma";
import { syncPermissions } from "../../permissions/sync";

export async function cleanDb() {
  await prisma.auditLog.deleteMany();
  await prisma.rentalPhoto.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.customRolePermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenant.deleteMany();
}

export async function seedRentalFlowData() {
  const tenant = await prisma.tenant.create({
    data: { name: "Test Tenant", slug: "test-tenant", plan: "Basic", active: true },
  });

  await syncPermissions();

  const hashedPassword = await bcrypt.hash("test1234", 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Admin Test",
      email: "admin@test.com",
      password: hashedPassword,
      role: "Admin",
      active: true,
      emailVerified: true,
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      plate: "TST-001",
      brand: "Toyota",
      model: "Corolla",
      year: 2023,
      category: "Sedan",
      color: "White",
      dailyRate: 50,
      mileage: 10000,
      status: "Available",
    },
  });

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
      idNumber: "12345678",
      blacklisted: false,
    },
  });

  return { tenant, user, vehicle, client };
}
