export interface DailySummaryByMethod {
  method: string
  total: number
  count: number
}

export interface DailySummaryByType {
  type: string
  total: number
  count: number
}

export interface DailyMovement {
  id: string
  type: string
  method: string
  amount: number
  notes: string | null
  createdAt: Date
  clientName: string
  vehiclePlate: string
}

export interface DailySummaryReport {
  date: string
  totalIngresos: number
  totalTransacciones: number
  byMethod: DailySummaryByMethod[]
  byType: DailySummaryByType[]
  movimientos: DailyMovement[]
}

export interface ReceivableItem {
  rentalId: string
  clientName: string
  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  startDate: Date
  endDate: Date
  totalAmount: number
  totalPagado: number
  saldoPendiente: number
  diasVencido: number
}

// ─── Rentals Report ───────────────────────────────────────────────────────────

export interface RentalsReportFilters {
  dateFrom?: string
  dateTo?: string
  status?: string
  vehicleId?: string
}

export interface RentalsReportItem {
  rentalId: string
  clientName: string
  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  startDate: Date
  endDate: Date
  totalDays: number
  dailyRate: number
  totalAmount: number
  totalPagado: number
  saldoPendiente: number
  status: string
}

export interface RentalsReport {
  totalAlquileres: number
  totalIngresos: number
  totalPendiente: number
  items: RentalsReportItem[]
}

// ─── Payments Report ──────────────────────────────────────────────────────────

export interface PaymentsReportFilters {
  dateFrom?: string
  dateTo?: string
}

export interface PaymentsReportItem {
  paymentId: string
  type: string
  method: string
  amount: number
  notes: string | null
  clientName: string
  vehiclePlate: string
  createdAt: Date
}

export interface PaymentsByMethod {
  method: string
  total: number
  count: number
}

export interface PaymentsReport {
  totalIngresos: number
  totalTransacciones: number
  byMethod: PaymentsByMethod[]
  items: PaymentsReportItem[]
}

// ─── Vehicles Report ──────────────────────────────────────────────────────────

export interface VehiclesReportFilters {
  dateFrom?: string
  dateTo?: string
}

export interface VehiclesReportItem {
  vehicleId: string
  plate: string
  brand: string
  model: string
  year: number
  category: string
  totalAlquileres: number
  totalDiasAlquilado: number
  tasaOcupacion: number
  totalIngresos: number
}

export interface VehiclesReport {
  periodDays: number
  promedioOcupacion: number
  items: VehiclesReportItem[]
}
