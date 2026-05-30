/// <reference types="jest" />
import { Request, Response } from "express";
import { RentalControllerService } from "../../controllers/rental/rental.controller.service";

jest.mock("../../email/email.service", () => ({
  sendRentalConfirmEmail: (jest.fn() as any).mockResolvedValue(undefined),
  sendRentalReturnEmail: (jest.fn() as any).mockResolvedValue(undefined),
}));
jest.mock("../../utils/audit", () => ({ logAction: jest.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    params: {},
    query: {},
    user: { id: "user-1", tenantId: "tenant-1", role: "Admin", email: "admin@test.com", isImpersonating: false },
    ip: "127.0.0.1",
    headers: { "user-agent": "jest" },
    ...overrides,
  } as unknown as Request);

const makeRes = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// ─── Mock del repositorio (cada función como `any` para evitar restricciones de tipo) ───

const buildRepo = () => ({
  getById: jest.fn() as any,
  getByIdWithDetails: jest.fn() as any,
  getAll: jest.fn() as any,
  create: jest.fn() as any,
  update: jest.fn() as any,
  delete: jest.fn() as any,
  forceDelete: jest.fn() as any,
  findVehicle: jest.fn() as any,
  findClient: jest.fn() as any,
  hasDateConflict: jest.fn() as any,
  returnVehicle: jest.fn() as any,
  cancelRental: jest.fn() as any,
});

// ─── Datos reutilizables ──────────────────────────────────────────────────────

const availableVehicle = { id: "vehicle-1", status: "Available", dailyRate: 50, mileage: 10000 };
const activeClient = { id: "client-1", blacklisted: false, licenseExp: new Date("2030-01-01") };
const baseBody = { vehicleId: "vehicle-1", clientId: "client-1", startDate: "2026-06-01", endDate: "2026-06-05" };

// ═════════════════════════════════════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════════════════════════════════════

describe("RentalController.create", () => {
  let repo: ReturnType<typeof buildRepo>;
  let controller: RentalControllerService;

  beforeEach(() => {
    repo = buildRepo();
    controller = new RentalControllerService(repo as any);
  });

  it("retorna 404 si el vehículo no existe", async () => {
    repo.findVehicle.mockResolvedValue(null);
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Vehicle not found" }));
  });

  it("retorna 409 si el vehículo no está disponible", async () => {
    repo.findVehicle.mockResolvedValue({ ...availableVehicle, status: "Rented" });
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("not available") }));
  });

  it("retorna 404 si el cliente no existe", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue(null);
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Client not found" }));
  });

  it("retorna 403 si el cliente está en lista negra", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue({ ...activeClient, blacklisted: true });
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("blacklisted") }));
  });

  it("retorna 403 si la licencia del cliente está vencida", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue({ ...activeClient, licenseExp: new Date("2020-01-01") });
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("license is expired") }));
  });

  it("retorna 409 si hay conflicto de fechas", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue(activeClient);
    repo.hasDateConflict.mockResolvedValue(true);
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("date range") }));
  });

  it("crea el alquiler y calcula días, subtotal y total correctamente", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue(activeClient);
    repo.hasDateConflict.mockResolvedValue(false);
    repo.create.mockResolvedValue({ id: "rental-1" });
    const res = makeRes();
    await controller.create(makeReq({ body: { ...baseBody, discount: 20 } }), res);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ totalDays: 4, subtotal: 200, discount: 20, totalAmount: 180 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("crea el alquiler con totalAmount = subtotal cuando no hay descuento", async () => {
    repo.findVehicle.mockResolvedValue(availableVehicle);
    repo.findClient.mockResolvedValue(activeClient);
    repo.hasDateConflict.mockResolvedValue(false);
    repo.create.mockResolvedValue({ id: "rental-1" });
    const res = makeRes();
    await controller.create(makeReq({ body: baseBody }), res);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ totalDays: 4, subtotal: 200, discount: 0, totalAmount: 200 }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═════════════════════════════════════════════════════════════════════════════

describe("RentalController.update", () => {
  let repo: ReturnType<typeof buildRepo>;
  let controller: RentalControllerService;

  beforeEach(() => {
    repo = buildRepo();
    controller = new RentalControllerService(repo as any);
  });

  it("retorna 400 si se intenta actualizar un alquiler completado", async () => {
    repo.getById.mockResolvedValue({ id: "rental-1", status: "Completed" });
    const res = makeRes();
    await controller.update(makeReq({ params: { id: "rental-1" } as any, body: {} }) as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Completed") }));
  });

  it("retorna 400 si se intenta actualizar un alquiler cancelado", async () => {
    repo.getById.mockResolvedValue({ id: "rental-1", status: "Cancelled" });
    const res = makeRes();
    await controller.update(makeReq({ params: { id: "rental-1" } as any, body: {} }) as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("retorna 404 si el alquiler no existe", async () => {
    repo.getById.mockResolvedValue(null);
    const res = makeRes();
    await controller.update(makeReq({ params: { id: "no-existe" } as any, body: {} }) as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE
// ═════════════════════════════════════════════════════════════════════════════

describe("RentalController.delete", () => {
  let repo: ReturnType<typeof buildRepo>;
  let controller: RentalControllerService;

  beforeEach(() => {
    repo = buildRepo();
    controller = new RentalControllerService(repo as any);
  });

  it("retorna 400 si se intenta eliminar un alquiler activo", async () => {
    repo.getById.mockResolvedValue({ id: "rental-1", status: "Active" });
    const res = makeRes();
    await controller.delete(makeReq({ params: { id: "rental-1" } as any }) as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("active") }));
  });

  it("elimina exitosamente un alquiler completado", async () => {
    repo.getById.mockResolvedValue({ id: "rental-1", status: "Completed" });
    repo.delete.mockResolvedValue({ id: "rental-1" });
    const res = makeRes();
    await controller.delete(makeReq({ params: { id: "rental-1" } as any }) as any, res);
    expect(repo.delete).toHaveBeenCalledWith("rental-1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
