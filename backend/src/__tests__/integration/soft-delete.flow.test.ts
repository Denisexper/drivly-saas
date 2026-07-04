/// <reference types="jest" />
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";
import prisma from "../../dataBase/prisma";
import { cleanDb, seedRentalFlowData } from "./seed";

let token: string;
let vehicleId: string;
let clientId: string;
let userId: string;
let tenantId: string;

beforeAll(async () => {
  await cleanDb();
  const { user, vehicle, client, tenant } = await seedRentalFlowData();

  vehicleId = vehicle.id;
  clientId = client.id;
  userId = user.id;
  tenantId = tenant.id;

  token = jwt.sign(
    { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email, isImpersonating: false },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Soft delete de alquiler ───────────────────────────────────────────────────

describe("DELETE /api/v1/rentals/:id (soft delete)", () => {
  let rentalId: string;

  beforeAll(async () => {
    const rental = await prisma.rental.create({
      data: {
        tenantId,
        vehicleId,
        clientId,
        userId,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-05"),
        dailyRate: 50,
        totalDays: 4,
        subtotal: 200,
        totalAmount: 200,
        status: "Completed",
      },
    });
    rentalId = rental.id;
  });

  it("elimina el alquiler (soft) y responde 200", async () => {
    const res = await request(app)
      .delete(`/api/v1/rentals/${rentalId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const raw = await prisma.rental.findUnique({ where: { id: rentalId } });
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });

  it("el alquiler eliminado no aparece en el listado", async () => {
    const res = await request(app)
      .get("/api/v1/rentals")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: any) => r.id);
    expect(ids).not.toContain(rentalId);
  });

  it("el alquiler eliminado no se encuentra por id (404)", async () => {
    const res = await request(app)
      .get(`/api/v1/rentals/${rentalId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("intentar eliminar el mismo alquiler de nuevo responde 404", async () => {
    const res = await request(app)
      .delete(`/api/v1/rentals/${rentalId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ── Soft delete de cliente ─────────────────────────────────────────────────────

describe("DELETE /api/v1/clients/:id (soft delete)", () => {
  it("elimina el cliente (soft) y responde 200", async () => {
    const res = await request(app)
      .delete(`/api/v1/clients/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const raw = await prisma.client.findUnique({ where: { id: clientId } });
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });

  it("el cliente eliminado no aparece en el listado", async () => {
    const res = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).not.toContain(clientId);
  });

  it("el cliente eliminado no se encuentra por id (404)", async () => {
    const res = await request(app)
      .get(`/api/v1/clients/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("intentar eliminar el mismo cliente de nuevo responde 404", async () => {
    const res = await request(app)
      .delete(`/api/v1/clients/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ── Rental bloqueado por soft delete ──────────────────────────────────────────

describe("POST /api/v1/rentals - rechazo por entidades eliminadas", () => {
  it("retorna 404 al intentar crear alquiler con cliente soft-deleted", async () => {
    const res = await request(app)
      .post("/api/v1/rentals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        vehicleId,
        clientId,
        startDate: "2027-01-01",
        endDate: "2027-01-05",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/client not found/i);
  });
});

// ── Soft delete de vehículo ────────────────────────────────────────────────────

describe("DELETE /api/v1/vehicles/:id (soft delete)", () => {
  it("elimina el vehículo (soft) y responde 200", async () => {
    const res = await request(app)
      .delete(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const raw = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });

  it("el vehículo eliminado no aparece en el listado", async () => {
    const res = await request(app)
      .get("/api/v1/vehicles")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((v: any) => v.id);
    expect(ids).not.toContain(vehicleId);
  });

  it("el vehículo eliminado no se encuentra por id (404)", async () => {
    const res = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("intentar eliminar el mismo vehículo de nuevo responde 404", async () => {
    const res = await request(app)
      .delete(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
