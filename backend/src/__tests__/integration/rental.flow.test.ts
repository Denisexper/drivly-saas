/// <reference types="jest" />
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";
import prisma from "../../dataBase/prisma";
import { cleanDb, seedRentalFlowData } from "./seed";

jest.mock("../../email/email.service", () => ({
  sendRentalConfirmEmail: jest.fn().mockResolvedValue(undefined),
  sendRentalReturnEmail: jest.fn().mockResolvedValue(undefined),
  sendPaymentReceiptEmail: jest.fn().mockResolvedValue(undefined),
}));

let token: string;
let vehicleId: string;
let clientId: string;
let rentalId: string;

beforeAll(async () => {
  await cleanDb();
  const { user, vehicle, client } = await seedRentalFlowData();

  vehicleId = vehicle.id;
  clientId = client.id;

  token = jwt.sign(
    { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email, isImpersonating: false },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Crear alquiler ─────────────────────────────────────────────────────────────

describe("POST /api/v1/rentals", () => {
  it("crea el alquiler y el vehículo cambia a Rented", async () => {
    const res = await request(app)
      .post("/api/v1/rentals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        vehicleId,
        clientId,
        startDate: "2026-07-01",
        endDate: "2026-07-05",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Active");
    expect(res.body.data.totalDays).toBe(4);
    expect(Number(res.body.data.totalAmount)).toBe(200);
    rentalId = res.body.data.id;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe("Rented");
  });

  it("rechaza un segundo alquiler para el mismo vehículo (409)", async () => {
    const res = await request(app)
      .post("/api/v1/rentals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        vehicleId,
        clientId,
        startDate: "2026-07-03",
        endDate: "2026-07-08",
      });

    expect(res.status).toBe(409);
  });
});

// ── Registrar pago ─────────────────────────────────────────────────────────────

describe("POST /api/v1/payments", () => {
  it("registra un pago para el alquiler", async () => {
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ rentalId, amount: 200, method: "Cash", type: "PagoAlquiler" });

    expect(res.status).toBe(201);
    expect(res.body.data.rentalId).toBe(rentalId);
    expect(Number(res.body.data.amount)).toBe(200);
  });

  it("rechaza un pago que excede el saldo pendiente (422)", async () => {
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ rentalId, amount: 1, method: "Cash", type: "PagoAlquiler" });

    expect(res.status).toBe(422);
  });
});

// ── Devolver vehículo ──────────────────────────────────────────────────────────

describe("PUT /api/v1/rentals/:id — devolución", () => {
  it("completa el alquiler y el vehículo vuelve a Available", async () => {
    const res = await request(app)
      .put(`/api/v1/rentals/${rentalId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "Completed",
        actualReturn: new Date().toISOString(),
        mileageEnd: 10400,
        fuelIn: "Full",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Completed");

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(vehicle?.status).toBe("Available");
  });

  it("rechaza actualizar un alquiler ya completado (400)", async () => {
    const res = await request(app)
      .put(`/api/v1/rentals/${rentalId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notes: "intento inválido" });

    expect(res.status).toBe(400);
  });
});
