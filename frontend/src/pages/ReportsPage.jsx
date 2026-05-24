import { useState } from "react";
import { FileDown, TrendingUp, Car, CreditCard, FileText, RefreshCw } from "lucide-react";
import { useRentalsReport, usePaymentsReport, useVehiclesReport } from "../hooks/useReports";
import { reportService } from "../services/report.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  Active:    "Activo",
  Completed: "Completado",
  Cancelled: "Cancelado",
  Reserved:  "Reservado",
};

const STATUS_STYLES = {
  Active:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Reserved:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const METHOD_LABELS = {
  Cash:     "Efectivo",
  Card:     "Tarjeta",
  Transfer: "Transferencia",
  Check:    "Cheque",
};

const TYPE_LABELS = {
  Deposito:         "Depósito",
  PagoAlquiler:     "Pago alquiler",
  CobroDano:        "Cobro daño",
  CobroCombustible: "Cobro combustible",
  CobrodiaExtra:    "Día extra",
  Devolucion:       "Devolución",
};

const TABS = [
  { id: "rentals",  label: "Alquileres", icon: FileText },
  { id: "payments", label: "Pagos",      icon: CreditCard },
  { id: "vehicles", label: "Vehículos",  icon: Car },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function toISO(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultRange() {
  const today = new Date();
  const from = new Date(today.getTime() - 29 * 86_400_000);
  return { dateFrom: toISO(from), dateTo: toISO(today) };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${accent ?? ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SkeletonRows({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 w-full max-w-24 rounded bg-muted" />
        </td>
      ))}
    </tr>
  ));
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span>{msg}</span>
      <button onClick={onRetry} className="underline text-xs">Reintentar</button>
    </div>
  );
}

function ExportButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40"
    >
      <FileDown className="h-3.5 w-3.5" />
      Exportar CSV
    </button>
  );
}

// ─── Rentals Section ──────────────────────────────────────────────────────────

function RentalsSection({ dateFrom, dateTo }) {
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const { report, loading, error, refetch } = useRentalsReport(dateFrom, dateTo, status);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.downloadRentalsCsv({ dateFrom, dateTo, status: status || undefined });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Estado:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <ExportButton onClick={handleExport} loading={exporting || loading} />
      </div>

      {error && <ErrorBanner msg={error} onRetry={refetch} />}

      {/* Summary cards */}
      {!loading && report && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Alquileres" value={report.totalAlquileres} />
          <StatCard label="Ingresos cobrados" value={fmt(report.totalIngresos)} accent="text-green-600 dark:text-green-400" />
          <StatCard label="Saldo pendiente" value={fmt(report.totalPendiente)} accent="text-red-600 dark:text-red-400" />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Vehículo</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Período</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Días</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pagado</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pendiente</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonRows cols={8} />
              ) : report?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <TrendingUp className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    Sin alquileres en el período seleccionado.
                  </td>
                </tr>
              ) : (
                report?.items.map((r) => (
                  <tr key={r.rentalId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{r.clientName}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-xs">{r.vehiclePlate}</span>
                      <span className="block text-xs text-muted-foreground">{r.vehicleBrand} {r.vehicleModel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    </td>
                    <td className="px-4 py-2.5 text-right">{r.totalDays}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{fmt(r.totalAmount)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-600 dark:text-green-400">{fmt(r.totalPagado)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-600 dark:text-red-400">{fmt(r.saldoPendiente)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && report && report.items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {report.totalAlquileres} alquiler{report.totalAlquileres !== 1 ? "es" : ""} en el período
        </p>
      )}
    </div>
  );
}

// ─── Payments Section ─────────────────────────────────────────────────────────

function PaymentsSection({ dateFrom, dateTo }) {
  const [exporting, setExporting] = useState(false);
  const { report, loading, error, refetch } = usePaymentsReport(dateFrom, dateTo);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.downloadPaymentsCsv({ dateFrom, dateTo });
    } finally {
      setExporting(false);
    }
  };

  const allMethods = ["Cash", "Card", "Transfer", "Check"];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton onClick={handleExport} loading={exporting || loading} />
      </div>

      {error && <ErrorBanner msg={error} onRetry={refetch} />}

      {/* Summary cards */}
      {!loading && report && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total ingresos" value={fmt(report.totalIngresos)} accent="text-green-600 dark:text-green-400" />
            <StatCard label="Transacciones" value={report.totalTransacciones} sub="pagos registrados" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Por método de pago</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allMethods.map((method) => {
                const entry = report.byMethod.find((m) => m.method === method);
                return (
                  <div key={method} className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{METHOD_LABELS[method]}</p>
                    <p className="font-mono font-bold text-lg">{entry ? fmt(entry.total) : "$0.00"}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry ? `${entry.count} transacción${entry.count !== 1 ? "es" : ""}` : "Sin movimientos"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Placa</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Método</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Monto</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonRows cols={7} />
              ) : report?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    <CreditCard className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    Sin pagos en el período seleccionado.
                  </td>
                </tr>
              ) : (
                report?.items.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">{p.clientName}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-xs">{p.vehiclePlate}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmt(p.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.notes ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicles Section ─────────────────────────────────────────────────────────

function VehiclesSection({ dateFrom, dateTo }) {
  const [exporting, setExporting] = useState(false);
  const { report, loading, error, refetch } = useVehiclesReport(dateFrom, dateTo);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.downloadVehiclesCsv({ dateFrom, dateTo });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton onClick={handleExport} loading={exporting || loading} />
      </div>

      {error && <ErrorBanner msg={error} onRetry={refetch} />}

      {/* Summary cards */}
      {!loading && report && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Período analizado" value={`${report.periodDays} días`} />
          <StatCard
            label="Ocupación promedio"
            value={`${report.promedioOcupacion}%`}
            accent={report.promedioOcupacion >= 50 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Placa</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Vehículo</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Alquileres</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Días alquilado</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ocupación</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonRows cols={6} />
              ) : report?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Car className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    Sin vehículos registrados.
                  </td>
                </tr>
              ) : (
                report?.items.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-semibold text-xs">{v.plate}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{v.brand} {v.model}</span>
                      <span className="block text-xs text-muted-foreground">{v.year} · {v.category}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">{v.totalAlquileres}</td>
                    <td className="px-4 py-2.5 text-right">{v.totalDiasAlquilado}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-20">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${v.tasaOcupacion}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">{v.tasaOcupacion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                      {fmt(v.totalIngresos)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { dateFrom: defaultFrom, dateTo: defaultTo } = defaultRange();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [activeTab, setActiveTab] = useState("rentals");

  const today = toISO(new Date());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis de alquileres, pagos y flota por período</p>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-muted-foreground">Desde:</label>
        <input
          type="date"
          value={dateFrom}
          max={dateTo}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <label className="text-sm text-muted-foreground">Hasta:</label>
        <input
          type="date"
          value={dateTo}
          min={dateFrom}
          max={today}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <button
          onClick={() => { setDateFrom(defaultFrom); setDateTo(defaultTo); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Últimos 30 días
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "rentals"  && <RentalsSection  dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === "payments" && <PaymentsSection dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === "vehicles" && <VehiclesSection dateFrom={dateFrom} dateTo={dateTo} />}
    </div>
  );
}
