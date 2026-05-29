/// <reference types="jest" />
import { Prisma, PrismaClient } from "@prisma/client";
import { PaymentRepository } from "../../repositories/payment/payment.repository";

const d = (n: number) => new Prisma.Decimal(n);

// ─── Mock del PrismaClient ────────────────────────────────────────────────────

// No cast a PrismaClient para que el tipo `any` no se pierda al acceder a las props
const buildPrisma = () => ({
  payment: {
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    create: jest.fn() as any,
    delete: jest.fn() as any,
    aggregate: jest.fn() as any,
  },
  rental: {
    findUnique: jest.fn() as any,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// CREATE — validación de saldo
// ═════════════════════════════════════════════════════════════════════════════

describe("PaymentRepository.create — validación de saldo", () => {
  let prisma: ReturnType<typeof buildPrisma>;
  let repo: PaymentRepository;

  beforeEach(() => {
    prisma = buildPrisma();
    repo = new PaymentRepository(prisma as unknown as PrismaClient);
  });

  it("lanza error si el pago supera el saldo pendiente del alquiler", async () => {
    // $100 total, $80 pagados → solo quedan $20, llega un pago de $30
    prisma.rental.findUnique.mockResolvedValue({ totalAmount: 100 });
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 80 } });

    await expect(
      repo.create({ rentalId: "rental-1", amount: d(30), method: "Cash", type: "PagoAlquiler", reference: null, notes: null })
    ).rejects.toThrow("El monto excede el saldo pendiente");
  });

  it("registra el pago si el monto es exactamente el saldo restante", async () => {
    // $100 total, $80 pagados → quedan $20 exactos
    prisma.rental.findUnique.mockResolvedValue({ totalAmount: 100 });
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 80 } });
    prisma.payment.create.mockResolvedValue({ id: "payment-1", amount: 20 });

    const result = await repo.create({
      rentalId: "rental-1", amount: d(20), method: "Cash", type: "PagoAlquiler", reference: null, notes: null,
    });

    expect(result.id).toBe("payment-1");
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it("no valida saldo para cobros extra (CobroDano, CobroCombustible, CobrodiaExtra)", async () => {
    prisma.payment.create.mockResolvedValue({ id: "payment-extra" });

    const result = await repo.create({
      rentalId: "rental-1", amount: d(9999), method: "Cash", type: "CobroDano", reference: null, notes: null,
    });

    expect(prisma.rental.findUnique).not.toHaveBeenCalled();
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
    expect(result.id).toBe("payment-extra");
  });

  it("no valida saldo para devoluciones (Devolucion)", async () => {
    prisma.payment.create.mockResolvedValue({ id: "payment-dev" });

    await repo.create({ rentalId: "rental-1", amount: d(50), method: "Cash", type: "Devolucion", reference: null, notes: null });

    expect(prisma.rental.findUnique).not.toHaveBeenCalled();
  });

  it("lanza error si el alquiler no existe al registrar un pago base", async () => {
    prisma.rental.findUnique.mockResolvedValue(null);

    await expect(
      repo.create({ rentalId: "no-existe", amount: d(10), method: "Cash", type: "PagoAlquiler", reference: null, notes: null })
    ).rejects.toThrow("Rental not found");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET PAYMENT SUMMARY — cálculos financieros
// ═════════════════════════════════════════════════════════════════════════════

describe("PaymentRepository.getPaymentSummary — cálculos financieros", () => {
  let prisma: ReturnType<typeof buildPrisma>;
  let repo: PaymentRepository;

  beforeEach(() => {
    prisma = buildPrisma();
    repo = new PaymentRepository(prisma as unknown as PrismaClient);
  });

  it("calcula saldoPendiente correctamente cuando hay pagos parciales", async () => {
    prisma.rental.findUnique.mockResolvedValue({ totalAmount: 200 });
    prisma.payment.findMany.mockResolvedValue([
      { type: "PagoAlquiler", amount: 100 },
      { type: "Deposito", amount: 50 },
    ]);

    const summary = await repo.getPaymentSummary("rental-1");

    expect(summary.totalPagado).toBe(150);
    expect(summary.saldoPendiente).toBe(50);
  });

  it("saldoPendiente es 0 cuando el alquiler está completamente pagado", async () => {
    prisma.rental.findUnique.mockResolvedValue({ totalAmount: 200 });
    prisma.payment.findMany.mockResolvedValue([{ type: "PagoAlquiler", amount: 200 }]);

    const summary = await repo.getPaymentSummary("rental-1");

    expect(summary.saldoPendiente).toBe(0);
  });

  it("totalFinal incluye cobros extra y descuenta devoluciones", async () => {
    // $200 + $50 cobro extra - $30 devolución = $220
    prisma.rental.findUnique.mockResolvedValue({ totalAmount: 200 });
    prisma.payment.findMany.mockResolvedValue([
      { type: "PagoAlquiler", amount: 100 },
      { type: "CobroDano", amount: 50 },
      { type: "Devolucion", amount: 30 },
    ]);

    const summary = await repo.getPaymentSummary("rental-1");

    expect(summary.totalCobrosExtra).toBe(50);
    expect(summary.totalDevuelto).toBe(30);
    expect(summary.totalFinal).toBe(220);
  });

  it("lanza error si el rentalId no existe", async () => {
    prisma.rental.findUnique.mockResolvedValue(null);

    await expect(repo.getPaymentSummary("no-existe")).rejects.toThrow("Rental not found");
  });
});
