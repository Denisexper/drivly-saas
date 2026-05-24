import {
  DailySummaryReport,
  ReceivableItem,
  RentalsReport,
  RentalsReportFilters,
  PaymentsReport,
  PaymentsReportFilters,
  VehiclesReport,
  VehiclesReportFilters,
} from "../../types/report/report.types"

export interface ReportRepositoryInterface {
  getDailySummary(date: string, tenantId?: string): Promise<DailySummaryReport>
  getReceivables(tenantId?: string): Promise<ReceivableItem[]>
  getRentalsReport(filters: RentalsReportFilters, tenantId?: string): Promise<RentalsReport>
  getPaymentsReport(filters: PaymentsReportFilters, tenantId?: string): Promise<PaymentsReport>
  getVehiclesReport(filters: VehiclesReportFilters, tenantId?: string): Promise<VehiclesReport>
}
