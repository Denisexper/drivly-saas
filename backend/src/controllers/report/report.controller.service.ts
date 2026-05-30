import { Request, Response } from "express"
import { ReportRepositoryInterface } from "../../interfaces/report/report.repository.interface"
import { generateCsv } from "../../utils/csv"
import { RentalsReport, PaymentsReport, VehiclesReport } from "../../types/report/report.types"

export class ReportControllerService {
  constructor(private readonly repository: ReportRepositoryInterface) {}

  async getDailySummary(req: Request, res: Response) {
    const isSuperAdmin = req.user!.role === "SuperAdmin"
    const tenantId = isSuperAdmin
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId!

    const date = (req.query.date as string) ?? new Date().toISOString().split("T")[0]

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." })
    }

    try {
      const data = await this.repository.getDailySummary(date, tenantId)
      return res.status(200).json({ message: "Daily summary retrieved", data })
    } catch (error: any) {
      console.error("[ReportController] Error en getDailySummary():", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  async getReceivables(req: Request, res: Response) {
    const isSuperAdmin = req.user!.role === "SuperAdmin"
    const tenantId = isSuperAdmin
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId!

    try {
      const data = await this.repository.getReceivables(tenantId)
      return res.status(200).json({ message: "Receivables retrieved", data })
    } catch (error: any) {
      console.error("[ReportController] Error en getReceivables():", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  private resolveTenantId(req: Request): string | undefined {
    const isSuperAdmin = req.user!.role === "SuperAdmin"
    return isSuperAdmin ? (req.query.tenantId as string | undefined) : req.user!.tenantId!
  }

  private isValidDate(d?: string): boolean {
    return !d || /^\d{4}-\d{2}-\d{2}$/.test(d)
  }

  async getRentalsReport(req: Request, res: Response) {
    const tenantId = this.resolveTenantId(req)
    const { dateFrom, dateTo, status, vehicleId, format } = req.query as Record<string, string>

    if (!this.isValidDate(dateFrom) || !this.isValidDate(dateTo)) {
      return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." })
    }

    try {
      const data = await this.repository.getRentalsReport({ dateFrom, dateTo, status, vehicleId }, tenantId)

      if (format === "csv") {
        return this.sendRentalsCsv(res, data)
      }

      return res.status(200).json({ message: "Rentals report retrieved", data })
    } catch (error: any) {
      console.error("[ReportController] Error en getRentalsReport():", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  async getPaymentsReport(req: Request, res: Response) {
    const tenantId = this.resolveTenantId(req)
    const { dateFrom, dateTo, format } = req.query as Record<string, string>

    if (!this.isValidDate(dateFrom) || !this.isValidDate(dateTo)) {
      return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." })
    }

    try {
      const data = await this.repository.getPaymentsReport({ dateFrom, dateTo }, tenantId)

      if (format === "csv") {
        return this.sendPaymentsCsv(res, data)
      }

      return res.status(200).json({ message: "Payments report retrieved", data })
    } catch (error: any) {
      console.error("[ReportController] Error en getPaymentsReport():", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  async getVehiclesReport(req: Request, res: Response) {
    const tenantId = this.resolveTenantId(req)
    const { dateFrom, dateTo, format } = req.query as Record<string, string>

    if (!this.isValidDate(dateFrom) || !this.isValidDate(dateTo)) {
      return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." })
    }

    try {
      const data = await this.repository.getVehiclesReport({ dateFrom, dateTo }, tenantId)

      if (format === "csv") {
        return this.sendVehiclesCsv(res, data)
      }

      return res.status(200).json({ message: "Vehicles report retrieved", data })
    } catch (error: any) {
      console.error("[ReportController] Error en getVehiclesReport():", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  private sendCsvResponse(res: Response, filename: string, csv: string) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    return res.status(200).send(csv)
  }

  private sendRentalsCsv(res: Response, data: RentalsReport) {
    const headers = [
      "ID Alquiler", "Cliente", "Placa", "Marca", "Modelo",
      "Fecha Inicio", "Fecha Fin", "Días", "Tarifa Diaria",
      "Total Acordado", "Total Pagado", "Saldo Pendiente", "Estado",
    ]
    const rows = data.items.map((r) => [
      r.rentalId, r.clientName, r.vehiclePlate, r.vehicleBrand, r.vehicleModel,
      r.startDate.toISOString().split("T")[0],
      r.endDate.toISOString().split("T")[0],
      r.totalDays, r.dailyRate, r.totalAmount, r.totalPagado, r.saldoPendiente, r.status,
    ])
    return this.sendCsvResponse(res, "reporte-alquileres.csv", generateCsv(headers, rows))
  }

  private sendPaymentsCsv(res: Response, data: PaymentsReport) {
    const headers = ["ID Pago", "Tipo", "Método", "Monto", "Cliente", "Placa", "Notas", "Fecha"]
    const rows = data.items.map((p) => [
      p.paymentId, p.type, p.method, p.amount,
      p.clientName, p.vehiclePlate, p.notes,
      p.createdAt.toISOString().split("T")[0],
    ])
    return this.sendCsvResponse(res, "reporte-pagos.csv", generateCsv(headers, rows))
  }

  private sendVehiclesCsv(res: Response, data: VehiclesReport) {
    const headers = [
      "ID", "Placa", "Marca", "Modelo", "Año", "Categoría",
      "Alquileres", "Días Alquilado", "Tasa Ocupación %", "Ingresos",
    ]
    const rows = data.items.map((v) => [
      v.vehicleId, v.plate, v.brand, v.model, v.year, v.category,
      v.totalAlquileres, v.totalDiasAlquilado, v.tasaOcupacion, v.totalIngresos,
    ])
    return this.sendCsvResponse(res, "reporte-vehiculos.csv", generateCsv(headers, rows))
  }
}
