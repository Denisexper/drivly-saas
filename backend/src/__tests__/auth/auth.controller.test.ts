/// <reference types="jest" />
import { Request, Response, NextFunction } from "express";
import { AuthControllerService } from "../../controllers/auth/auth.controller.service";
import { EncryptService } from "../../services/encrypt.service";

jest.mock("../../email/email.service", () => ({
  sendEmailVerificationEmail: (jest.fn() as any).mockResolvedValue(undefined),
  sendPasswordResetEmail: (jest.fn() as any).mockResolvedValue(undefined),
}));
jest.mock("../../utils/audit", () => ({ logAction: jest.fn() }));
jest.mock("../../utils/generateToken", () => ({
  generateToken: jest.fn().mockReturnValue("mock-jwt-token"),
}));
jest.mock("../../permissions/sync", () => ({
  seedTenantDefaultPermissions: (jest.fn() as any).mockResolvedValue(undefined),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeReq = (body: object, params: object = {}): Request =>
  ({ body, params, ip: "127.0.0.1", headers: { "user-agent": "jest" } } as unknown as Request);

const makeRes = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeNext = (): NextFunction => jest.fn() as any;

// ─── Mocks de repositorios ────────────────────────────────────────────────────

const buildAuthRepo = () => ({
  findByEmail: jest.fn() as any,
  findBySlug: jest.fn() as any,
  register: jest.fn() as any,
  registerCompany: jest.fn() as any,
  setEmailVerifyToken: jest.fn() as any,
  findByEmailVerifyToken: jest.fn() as any,
  markEmailVerified: jest.fn() as any,
  setPasswordResetToken: jest.fn() as any,
  findByPasswordResetToken: jest.fn() as any,
  resetPassword: jest.fn() as any,
});

const buildTenantRepo = () => ({
  getById: jest.fn() as any,
  getBySlug: jest.fn() as any,
  create: jest.fn() as any,
  update: jest.fn() as any,
  delete: jest.fn() as any,
  getAll: jest.fn() as any,
});

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const verifiedUser = {
  id: "user-1", name: "Test User", email: "test@empresa.com",
  password: "hashed-password", emailVerified: true, role: "Admin", tenantId: "tenant-1",
};

const activeTenant = { id: "tenant-1", name: "Empresa Test", slug: "empresa-test", active: true };

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthController.login", () => {
  let authRepo: ReturnType<typeof buildAuthRepo>;
  let tenantRepo: ReturnType<typeof buildTenantRepo>;
  let controller: AuthControllerService;

  beforeEach(() => {
    authRepo = buildAuthRepo();
    tenantRepo = buildTenantRepo();
    controller = new AuthControllerService(authRepo as any, tenantRepo as any);
  });

  it("llama next con 401 si el email no existe", async () => {
    authRepo.findByEmail.mockResolvedValue(null);
    const next = makeNext();
    await controller.login(makeReq({ email: "noexiste@test.com", password: "123456" }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: "Credenciales incorrectas" }));
  });

  it("llama next con 401 si la contraseña es incorrecta", async () => {
    authRepo.findByEmail.mockResolvedValue(verifiedUser);
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(false);
    const next = makeNext();
    await controller.login(makeReq({ email: verifiedUser.email, password: "wrong" }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: "Credenciales incorrectas" }));
  });

  it("llama next con 403 si el email no está verificado", async () => {
    authRepo.findByEmail.mockResolvedValue({ ...verifiedUser, emailVerified: false });
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(true);
    const next = makeNext();
    await controller.login(makeReq({ email: verifiedUser.email, password: "correcta" }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, message: "EMAIL_NOT_VERIFIED" }));
  });

  it("llama next con 404 si el slug de empresa no existe", async () => {
    authRepo.findByEmail.mockResolvedValue(verifiedUser);
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(true);
    tenantRepo.getBySlug.mockResolvedValue(null);
    const next = makeNext();
    await controller.login(makeReq({ email: verifiedUser.email, password: "correcta", slug: "no-existe" }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404, message: "Empresa no encontrada" }));
  });

  it("llama next con 403 si la empresa está inactiva", async () => {
    authRepo.findByEmail.mockResolvedValue(verifiedUser);
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(true);
    tenantRepo.getBySlug.mockResolvedValue({ ...activeTenant, active: false });
    const next = makeNext();
    await controller.login(makeReq({ email: verifiedUser.email, password: "correcta", slug: activeTenant.slug }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("llama next con 403 si el usuario no pertenece al tenant del slug", async () => {
    authRepo.findByEmail.mockResolvedValue({ ...verifiedUser, tenantId: "otro-tenant" });
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(true);
    tenantRepo.getBySlug.mockResolvedValue(activeTenant);
    const next = makeNext();
    await controller.login(makeReq({ email: verifiedUser.email, password: "correcta", slug: activeTenant.slug }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, message: "Credenciales incorrectas" }));
  });

  it("retorna 200 con token en un login exitoso", async () => {
    authRepo.findByEmail.mockResolvedValue(verifiedUser);
    jest.spyOn(EncryptService, "comparePassword").mockResolvedValue(true);
    tenantRepo.getBySlug.mockResolvedValue(activeTenant);
    const res = makeRes();
    await controller.login(makeReq({ email: verifiedUser.email, password: "correcta", slug: activeTenant.slug }), res, makeNext());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: "mock-jwt-token",
      data: expect.objectContaining({ email: verifiedUser.email }),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER COMPANY
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthController.registerCompany", () => {
  let authRepo: ReturnType<typeof buildAuthRepo>;
  let controller: AuthControllerService;

  beforeEach(() => {
    authRepo = buildAuthRepo();
    controller = new AuthControllerService(authRepo as any, {} as any);
  });

  it("llama next con 400 si el email del dueño ya existe", async () => {
    authRepo.findByEmail.mockResolvedValue(verifiedUser);
    const next = makeNext();
    await controller.registerCompany(
      makeReq({ companyName: "Nueva", ownerName: "Dueño", ownerEmail: verifiedUser.email, ownerPassword: "pass" }),
      makeRes(), next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it("retorna 201 al registrar una nueva empresa exitosamente", async () => {
    authRepo.findByEmail.mockResolvedValue(null);
    authRepo.findBySlug.mockResolvedValue(null);
    authRepo.registerCompany.mockResolvedValue({
      tenant: { id: "t-new", name: "Nueva Empresa", slug: "nueva-empresa", trialEndsAt: new Date() },
      user: { id: "u-new", email: "dueno@nueva.com" },
    });
    authRepo.setEmailVerifyToken.mockResolvedValue(undefined);
    const res = makeRes();
    await controller.registerCompany(
      makeReq({ companyName: "Nueva Empresa", ownerName: "Dueño", ownerEmail: "dueno@nueva.com", ownerPassword: "pass123" }),
      res, makeNext()
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantName: "Nueva Empresa" }),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthController.verifyEmail", () => {
  let authRepo: ReturnType<typeof buildAuthRepo>;
  let controller: AuthControllerService;

  beforeEach(() => {
    authRepo = buildAuthRepo();
    controller = new AuthControllerService(authRepo as any, {} as any);
  });

  it("llama next con 400 si el token es inválido o expirado", async () => {
    authRepo.findByEmailVerifyToken.mockResolvedValue(null);
    const next = makeNext();
    await controller.verifyEmail(makeReq({ token: "token-invalido" }), makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: "TOKEN_INVALID_OR_EXPIRED" }));
  });

  it("retorna 200 cuando el token es válido", async () => {
    authRepo.findByEmailVerifyToken.mockResolvedValue(verifiedUser);
    authRepo.markEmailVerified.mockResolvedValue(undefined);
    const res = makeRes();
    await controller.verifyEmail(makeReq({ token: "token-valido" }), res, makeNext());
    expect(authRepo.markEmailVerified).toHaveBeenCalledWith(verifiedUser.id);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
