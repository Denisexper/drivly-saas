/// <reference types="jest" />
import request from "supertest";
import app from "../../app";
import prisma from "../../dataBase/prisma";
import { cleanDb } from "./seed";

jest.mock("../../email/email.service", () => ({
  sendEmailVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const COMPANY = {
  companyName: "Drivly Test Corp",
  ownerName: "Owner Test",
  ownerEmail: "owner@drivly.test",
  ownerPassword: "SecurePass123!",
};

let tenantSlug: string;
let verifyToken: string;
let resetToken: string;

beforeAll(async () => {
  await cleanDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Registro de empresa ────────────────────────────────────────────────────────

describe("POST /api/v1/auth/register-company", () => {
  it("crea la empresa y el admin con email no verificado", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register-company")
      .send(COMPANY);

    expect(res.status).toBe(201);
    expect(res.body.data.adminEmail).toBe(COMPANY.ownerEmail);
    expect(res.body.data.slug).toBeDefined();
    tenantSlug = res.body.data.slug;

    const user = await prisma.user.findFirst({ where: { email: COMPANY.ownerEmail } });
    expect(user?.emailVerified).toBe(false);
    expect(user?.emailVerifyToken).toBeDefined();
    verifyToken = user!.emailVerifyToken!;
  });

  it("rechaza un email ya registrado (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register-company")
      .send(COMPANY);

    expect(res.status).toBe(400);
  });
});

// ── Login antes de verificar email ────────────────────────────────────────────

describe("POST /api/v1/auth/login — sin verificación", () => {
  it("rechaza el login si el email no está verificado (403)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: COMPANY.ownerPassword, slug: tenantSlug });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("EMAIL_NOT_VERIFIED");
  });
});

// ── Verificación de email ──────────────────────────────────────────────────────

describe("POST /api/v1/auth/verify-email", () => {
  it("rechaza un token inválido (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: "token-que-no-existe" });

    expect(res.status).toBe(400);
  });

  it("verifica el email con el token correcto (200)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: verifyToken });

    expect(res.status).toBe(200);

    const user = await prisma.user.findFirst({ where: { email: COMPANY.ownerEmail } });
    expect(user?.emailVerified).toBe(true);
    expect(user?.emailVerifyToken).toBeNull();
  });
});

// ── Login exitoso ──────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/login — verificado", () => {
  it("devuelve JWT con credenciales correctas (200)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: COMPANY.ownerPassword, slug: tenantSlug });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.data.email).toBe(COMPANY.ownerEmail);
    expect(res.body.data.slug).toBe(tenantSlug);
  });

  it("rechaza credenciales incorrectas (401)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: "wrong-password", slug: tenantSlug });

    expect(res.status).toBe(401);
  });

  it("rechaza un slug de empresa incorrecto (403)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: COMPANY.ownerPassword, slug: "empresa-que-no-existe" });

    expect(res.status).toBe(404);
  });
});

// ── Olvidé mi contraseña ───────────────────────────────────────────────────────

describe("POST /api/v1/auth/forgot-password", () => {
  it("siempre responde 200 aunque el email no exista", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "noexiste@nada.com" });

    expect(res.status).toBe(200);
  });

  it("genera token de reset en BD cuando el email sí existe", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: COMPANY.ownerEmail });

    expect(res.status).toBe(200);

    const user = await prisma.user.findFirst({ where: { email: COMPANY.ownerEmail } });
    expect(user?.passwordResetToken).toBeDefined();
    resetToken = user!.passwordResetToken!;
  });
});

// ── Reset de contraseña ────────────────────────────────────────────────────────

describe("POST /api/v1/auth/reset-password", () => {
  it("rechaza un token inválido (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "token-invalido", newPassword: "NuevaPass123!" });

    expect(res.status).toBe(400);
  });

  it("actualiza la contraseña con token válido (200)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: resetToken, newPassword: "NuevaPass123!" });

    expect(res.status).toBe(200);

    const user = await prisma.user.findFirst({ where: { email: COMPANY.ownerEmail } });
    expect(user?.passwordResetToken).toBeNull();
  });

  it("puede hacer login con la nueva contraseña (200)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: "NuevaPass123!", slug: tenantSlug });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("no puede hacer login con la contraseña anterior (401)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: COMPANY.ownerEmail, password: COMPANY.ownerPassword, slug: tenantSlug });

    expect(res.status).toBe(401);
  });
});
