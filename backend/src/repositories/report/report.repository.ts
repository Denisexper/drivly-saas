import { PrismaClient } from "@prisma/client"
import { ReportRepositoryInterface } from "../../interfaces/report/report.repository.interface"
import {
  DailyMovement,
  DailySummaryReport,
  PaymentsReport,
  PaymentsReportFilters,
  PaymentsReportItem,
  ReceivableItem,
  RentalsReport,
  RentalsReportFilters,
  VehiclesReport,
  VehiclesReportFilters,
} from "../../types/report/report.types"

const RENTAL_PAYMENT_TYPES = ["Deposito", "PagoAlquiler"] as const

export class ReportRepository implements ReportRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  async getDailySummary(date: string, tenantId?: string): Promise<DailySummaryReport> {
    const start = new Date(`${date}T00:00:00.000Z`)
    const end = new Date(`${date}T23:59:59.999Z`)

    const pagos = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(tenantId ? { rental: { tenantId } } : {}),
      },
      include: {
        rental: {
          include: {
            client: { select: { firstName: true, lastName: true } },
            vehicle: { select: { plate: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    const byMethod = new Map<string, { total: number; count: number }>()
    const byType = new Map<string, { total: number; count: number }>()
    let totalIngresos = 0

    for (const p of pagos) {
      const amount = Number(p.amount)
      totalIngresos += amount

      const m = byMethod.get(p.method) ?? { total: 0, count: 0 }
      byMethod.set(p.method, { total: m.total + amount, count: m.count + 1 })

      const t = byType.get(p.type) ?? { total: 0, count: 0 }
      byType.set(p.type, { total: t.total + amount, count: t.count + 1 })
    }

    const movimientos: DailyMovement[] = pagos.map((p) => ({
      id: p.id,
      type: p.type,
      method: p.method,
      amount: Number(p.amount),
      notes: p.notes,
      createdAt: p.createdAt,
      clientName: `${p.rental.client.firstName} ${p.rental.client.lastName}`,
      vehiclePlate: p.rental.vehicle.plate,
    }))

    return {
      date,
      totalIngresos,
      totalTransacciones: pagos.length,
      byMethod: Array.from(byMethod.entries()).map(([method, v]) => ({ method, ...v })),
      byType: Array.from(byType.entries()).map(([type, v]) => ({ type, ...v })),
      movimientos,
    }
  }

  async getReceivables(tenantId?: string): Promise<ReceivableItem[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        status: "Active",
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        client: true,
        vehicle: true,
        payments: {
          where: { type: { in: [...RENTAL_PAYMENT_TYPES] } },
        },
      },
      orderBy: { endDate: "asc" },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result: ReceivableItem[] = []

    for (const r of rentals) {
      const totalPagado = r.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = Number(r.totalAmount)
      const saldoPendiente = Math.max(0, totalAmount - totalPagado)

      if (saldoPendiente <= 0) continue

      const endDate = new Date(r.endDate)
      endDate.setHours(0, 0, 0, 0)
      const diasVencido = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / 86_400_000))

      result.push({
        rentalId: r.id,
        clientName: `${r.client.firstName} ${r.client.lastName}`,
        vehiclePlate: r.vehicle.plate,
        vehicleBrand: r.vehicle.brand,
        vehicleModel: r.vehicle.model,
        startDate: r.startDate,
        endDate: r.endDate,
        totalAmount,
        totalPagado,
        saldoPendiente,
        diasVencido,
      })
    }

    return result
  }

  private parseDateRange(dateFrom?: string, dateTo?: string): { start: Date; end: Date } {
    const end = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : new Date()
    const start = dateFrom
      ? new Date(`${dateFrom}T00:00:00.000Z`)
      : new Date(end.getTime() - 30 * 86_400_000)
    return { start, end }
  }

  async getRentalsReport(filters: RentalsReportFilters, tenantId?: string): Promise<RentalsReport> {
    const { start, end } = this.parseDateRange(filters.dateFrom, filters.dateTo)

    const rentals = await this.prisma.rental.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        startDate: { gte: start, lte: end },
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        payments: { where: { type: { not: "Devolucion" } }, select: { amount: true } },
      },
      orderBy: { startDate: "desc" },
    })

    let totalIngresos = 0
    let totalPendiente = 0

    const items = rentals.map((r) => {
      const totalPagado = r.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = Number(r.totalAmount)
      const saldoPendiente = Math.max(0, totalAmount - totalPagado)

      totalIngresos += totalPagado
      totalPendiente += saldoPendiente

      return {
        rentalId: r.id,
        clientName: `${r.client.firstName} ${r.client.lastName}`,
        vehiclePlate: r.vehicle.plate,
        vehicleBrand: r.vehicle.brand,
        vehicleModel: r.vehicle.model,
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        dailyRate: Number(r.dailyRate),
        totalAmount,
        totalPagado,
        saldoPendiente,
        status: r.status,
      }
    })

    return { totalAlquileres: items.length, totalIngresos, totalPendiente, items }
  }

  async getPaymentsReport(filters: PaymentsReportFilters, tenantId?: string): Promise<PaymentsReport> {
    const { start, end } = this.parseDateRange(filters.dateFrom, filters.dateTo)

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        rental: { ...(tenantId ? { tenantId } : {}) },
      },
      include: {
        rental: {
          include: {
            client: { select: { firstName: true, lastName: true } },
            vehicle: { select: { plate: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const byMethodMap = new Map<string, { total: number; count: number }>()
    let totalIngresos = 0

    const items: PaymentsReportItem[] = payments.map((p) => {
      const amount = Number(p.amount)
      totalIngresos += amount

      const m = byMethodMap.get(p.method) ?? { total: 0, count: 0 }
      byMethodMap.set(p.method, { total: m.total + amount, count: m.count + 1 })

      return {
        paymentId: p.id,
        type: p.type,
        method: p.method,
        amount,
        notes: p.notes,
        clientName: `${p.rental.client.firstName} ${p.rental.client.lastName}`,
        vehiclePlate: p.rental.vehicle.plate,
        createdAt: p.createdAt,
      }
    })

    return {
      totalIngresos,
      totalTransacciones: items.length,
      byMethod: Array.from(byMethodMap.entries()).map(([method, v]) => ({ method, ...v })),
      items,
    }
  }

  async getVehiclesReport(filters: VehiclesReportFilters, tenantId?: string): Promise<VehiclesReport> {
    const { start, end } = this.parseDateRange(filters.dateFrom, filters.dateTo)
    const periodDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))

    const vehicles = await this.prisma.vehicle.findMany({
      where: { ...(tenantId ? { tenantId } : {}) },
      include: {
        rentals: {
          where: {
            ...(tenantId ? { tenantId } : {}),
            startDate: { gte: start, lte: end },
            status: { not: "Cancelled" },
          },
          include: {
            payments: { where: { type: { not: "Devolucion" } }, select: { amount: true } },
          },
        },
      },
      orderBy: { plate: "asc" },
    })

    const items = vehicles.map((v) => {
      const totalAlquileres = v.rentals.length
      const totalDiasAlquilado = v.rentals.reduce((sum, r) => sum + r.totalDays, 0)
      const totalIngresos = v.rentals.reduce(
        (sum, r) => sum + r.payments.reduce((s, p) => s + Number(p.amount), 0),
        0
      )
      const tasaOcupacion = Math.min(100, Math.round((totalDiasAlquilado / periodDays) * 100))

      return {
        vehicleId: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        category: v.category,
        totalAlquileres,
        totalDiasAlquilado,
        tasaOcupacion,
        totalIngresos,
      }
    })

    const promedioOcupacion =
      items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.tasaOcupacion, 0) / items.length)
        : 0

    return { periodDays, promedioOcupacion, items }
  }
}
