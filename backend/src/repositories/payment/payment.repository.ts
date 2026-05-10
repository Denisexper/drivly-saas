import { Payment, PrismaClient } from "@prisma/client";
import { PaymentRepositoryInterface } from "../../interfaces/payment/payment.repository.interface";
import { CreatePaymentInput, PaymentSummary, PaymentWithDetails } from "../../types/payment/payment.types";

const RENTAL_PAYMENT_TYPES = ["Deposito", "PagoAlquiler"] as const;
const EXTRA_CHARGE_TYPES = ["CobroDano", "CobroCombustible", "CobrodiaExtra"] as const;

export class PaymentRepository implements PaymentRepositoryInterface {

    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    async getById(id: string): Promise<Payment | null> {
        try {
            return await this.prisma.payment.findUnique({ where: { id } })
        } catch (error) {
            throw new Error(`${error}`)
        }
    }

    async getByIdWithDetails(id: string): Promise<PaymentWithDetails | null> {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id },
                include: {
                    rental: {
                        include: {
                            tenant: { select: { name: true, slug: true } },
                            client: { select: { firstName: true, lastName: true, email: true, phone: true, idNumber: true } },
                            vehicle: { select: { plate: true, brand: true, model: true } },
                        },
                    },
                },
            })

            if (!payment) return null

            return {
                id: payment.id,
                amount: payment.amount.toString(),
                method: payment.method,
                type: payment.type,
                notes: payment.notes,
                createdAt: payment.createdAt,
                rental: {
                    id: payment.rental.id,
                    startDate: payment.rental.startDate,
                    endDate: payment.rental.endDate,
                    totalAmount: payment.rental.totalAmount.toString(),
                    tenant: payment.rental.tenant,
                    client: payment.rental.client,
                    vehicle: payment.rental.vehicle,
                },
            }
        } catch (error) {
            throw new Error(`${error}`)
        }
    }

    async getAll(tenantId?: string): Promise<Payment[]> {
        try {
            return await this.prisma.payment.findMany({
                where: tenantId ? { rental: { tenantId } } : undefined,
                include: { rental: { include: { vehicle: true, client: true } } },
                orderBy: { createdAt: "desc" },
            })
        } catch (error) {
            throw new Error(`${error}`)
        }
    }

    async create(data: CreatePaymentInput): Promise<Payment> {
        try {
            const type = data.type ?? "PagoAlquiler";

            // Validate against rental total only for base payment types
            if ((RENTAL_PAYMENT_TYPES as readonly string[]).includes(type)) {
                const rental = await this.prisma.rental.findUnique({
                    where: { id: data.rentalId },
                    select: { totalAmount: true },
                })

                if (!rental) throw new Error("Rental not found")

                const pagados = await this.prisma.payment.aggregate({
                    where: {
                        rentalId: data.rentalId,
                        type: { in: [...RENTAL_PAYMENT_TYPES] },
                    },
                    _sum: { amount: true },
                })

                const sumActual = Number(pagados._sum.amount ?? 0)
                const totalAcordado = Number(rental.totalAmount)
                const nuevo = Number(data.amount)

                if (sumActual + nuevo > totalAcordado) {
                    const disponible = (totalAcordado - sumActual).toFixed(2)
                    throw new Error(`El monto excede el saldo pendiente del alquiler ($${disponible} disponible)`)
                }
            }

            return await this.prisma.payment.create({ data })
        } catch (error) {
            throw error
        }
    }

    async delete(id: string): Promise<Payment> {
        try {
            return await this.prisma.payment.delete({ where: { id } })
        } catch (error) {
            throw new Error(`${error}`)
        }
    }

    async getPaymentSummary(rentalId: string): Promise<PaymentSummary> {
        try {
            const rental = await this.prisma.rental.findUnique({
                where: { id: rentalId },
                select: { totalAmount: true },
            })

            if (!rental) throw new Error("Rental not found")

            const pagos = await this.prisma.payment.findMany({
                where: { rentalId },
                orderBy: { createdAt: "asc" },
            })

            const totalAcordado = Number(rental.totalAmount)

            const totalPagado = pagos
                .filter(p => (RENTAL_PAYMENT_TYPES as readonly string[]).includes(p.type))
                .reduce((sum, p) => sum + Number(p.amount), 0)

            const totalCobrosExtra = pagos
                .filter(p => (EXTRA_CHARGE_TYPES as readonly string[]).includes(p.type))
                .reduce((sum, p) => sum + Number(p.amount), 0)

            const totalDevuelto = pagos
                .filter(p => p.type === "Devolucion")
                .reduce((sum, p) => sum + Number(p.amount), 0)

            const saldoPendiente = Math.max(0, totalAcordado - totalPagado)
            const totalFinal = totalAcordado + totalCobrosExtra - totalDevuelto

            return {
                rentalId,
                totalAcordado,
                totalPagado,
                saldoPendiente,
                totalCobrosExtra,
                totalDevuelto,
                totalFinal,
                pagos,
            }
        } catch (error) {
            throw error
        }
    }
}
