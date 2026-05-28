import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── 1. Tenant demo ──────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-rentcar" },
    update: {},
    create: {
      name: "Demo RentCar",
      slug: "demo-rentcar",
      plan: "Pro",
      active: true,
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ── 2. SuperAdmin (dueño del SaaS, no pertenece a ningún tenant real) ──
  const superAdminPassword = await bcrypt.hash("superadmin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@drivly.com" },
    update: { tenantId: tenant.id, role: "SuperAdmin", active: true, emailVerified: true },
    create: {
      tenantId: tenant.id,
      name: "Super Admin",
      email: "superadmin@drivly.com",
      password: superAdminPassword,
      role: "SuperAdmin",
      active: true,
      emailVerified: true,
    },
  });
  console.log(`✅ SuperAdmin: ${superAdmin.email}`);

  // ── 3. Admin de la empresa demo ──────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@drivly.com" },
    update: { email: "admin@drivly.com", tenantId: tenant.id, role: "Admin", active: true, emailVerified: true },
    create: {
      tenantId: tenant.id,
      name: "Admin Demo",
      email: "admin@drivly.com",
      password: adminPassword,
      role: "Admin",
      active: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── 4. Operador de la empresa demo ───────────────────────────────
  const operatorPassword = await bcrypt.hash("operator123", 10);
  const operator = await prisma.user.upsert({
    where: { email: "operador@drivly.com" },
    update: { email: "operador@drivly.com", tenantId: tenant.id, role: "Operator", active: true, emailVerified: true },
    create: {
      tenantId: tenant.id,
      name: "Operador Demo",
      email: "operador@drivly.com",
      password: operatorPassword,
      role: "Operator",
      active: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Operador: ${operator.email}`);

  // ── 5. Vehículos de prueba ────────────────────────────────────────
  const vehicles = [
    {
      plate: "P123456",
      brand: "Toyota",
      model: "Corolla",
      year: 2022,
      category: "Sedan" as const,
      color: "Blanco",
      dailyRate: 45.0,
      mileage: 12000,
      fuelType: "Gasoline" as const,
      transmission: "Automatic" as const,
      seats: 5,
      status: "Available" as const,
    },
    {
      plate: "P789012",
      brand: "Toyota",
      model: "RAV4",
      year: 2023,
      category: "SUV" as const,
      color: "Negro",
      dailyRate: 75.0,
      mileage: 5000,
      fuelType: "Gasoline" as const,
      transmission: "Automatic" as const,
      seats: 5,
      status: "Available" as const,
    },
    {
      plate: "P345678",
      brand: "Hyundai",
      model: "Tucson",
      year: 2021,
      category: "SUV" as const,
      color: "Gris",
      dailyRate: 65.0,
      mileage: 28000,
      fuelType: "Gasoline" as const,
      transmission: "Automatic" as const,
      seats: 5,
      status: "Rented" as const,
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { tenantId_plate: { tenantId: tenant.id, plate: v.plate } },
      update: {},
      create: { tenantId: tenant.id, ...v },
    });
  }
  console.log(`✅ Vehículos: ${vehicles.length} creados`);

  // ── 6. Clientes de prueba ─────────────────────────────────────────
  const clients = [
    {
      firstName: "Carlos",
      lastName: "Martínez",
      phone: "7890-1234",
      idType: "DUI" as const,
      idNumber: "01234567-8",
      email: "carlos@example.com",
      blacklisted: false,
    },
    {
      firstName: "María",
      lastName: "González",
      phone: "6543-2100",
      idType: "DUI" as const,
      idNumber: "09876543-2",
      email: "maria@example.com",
      blacklisted: false,
    },
  ];

  for (const c of clients) {
    await prisma.client.upsert({
      where: { tenantId_idNumber: { tenantId: tenant.id, idNumber: c.idNumber } },
      update: {},
      create: { tenantId: tenant.id, ...c },
    });
  }
  console.log(`✅ Clientes: ${clients.length} creados`);

  console.log("\n🎉 Seed completado. Credenciales de prueba:");
  console.log("──────────────────────────────────────────");
  console.log("  SuperAdmin → superadmin@drivly.com  / superadmin123");
  console.log("  Admin      → admin@drivly.com       / admin123");
  console.log("  Operador   → operador@drivly.com    / operator123");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
