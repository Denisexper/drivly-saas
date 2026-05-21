import { useEffect, useState } from "react";
import { useAudit } from "@/hooks/useAudit";
import { Eye, Filter, RefreshCw, X } from "lucide-react";

const ACTION_LABELS = {
  CREATE:        { label: "Creación",    color: "bg-green-900/40 text-green-400" },
  UPDATE:        { label: "Edición",     color: "bg-blue-900/40 text-blue-400" },
  DELETE:        { label: "Eliminación", color: "bg-red-900/40 text-red-400" },
  RETURN:        { label: "Devolución",  color: "bg-purple-900/40 text-purple-400" },
  CANCEL:        { label: "Cancelación", color: "bg-orange-900/40 text-orange-400" },
  UPLOAD_PHOTOS: { label: "Fotos",       color: "bg-yellow-900/40 text-yellow-400" },
  LOGIN:         { label: "Login",       color: "bg-cyan-900/40 text-cyan-400" },
  LOGOUT:         { label: "Logout",       color: "bg-orange-900/40 text-white-400" },
};

const ENTITY_LABELS = {
  Vehicle: "Vehículo",
  Client:  "Cliente",
  Rental:  "Alquiler",
  Payment: "Pago",
  User:    "Usuario",
  Tenant:  "Empresa",
  Auth:    "Autenticación",
};

const FIELD_LABELS = {
  id: "ID", tenantId: "Empresa", vehicleId: "Vehículo", clientId: "Cliente",
  userId: "Usuario", status: "Estado", startDate: "Fecha inicio", endDate: "Fecha fin",
  actualReturn: "Devolución real", dailyRate: "Tarifa diaria", totalDays: "Días totales",
  subtotal: "Subtotal", discount: "Descuento", extraCharges: "Cargos extra",
  totalAmount: "Total", deposit: "Depósito", mileageStart: "Km salida",
  mileageEnd: "Km entrada", fuelOut: "Combustible salida", fuelIn: "Combustible entrada",
  notes: "Notas", plate: "Placa", brand: "Marca", model: "Modelo", year: "Año",
  category: "Categoría", color: "Color", seats: "Asientos", mileage: "Km actual",
  fuelType: "Tipo combustible", transmission: "Transmisión",
  firstName: "Nombre", lastName: "Apellido", email: "Email", phone: "Teléfono",
  address: "Dirección", idType: "Tipo ID", idNumber: "Número ID",
  licenseNum: "Licencia", licenseExp: "Vence licencia", blacklisted: "Bloqueado",
  name: "Nombre", role: "Rol", active: "Activo",
  amount: "Monto", method: "Método", type: "Tipo", reference: "Referencia",
  rentalId: "Alquiler", slug: "Slug",
};

const ENTITIES = ["Vehicle", "Client", "Rental", "Payment", "User", "Auth"];
const ACTIONS  = ["CREATE", "UPDATE", "DELETE", "RETURN", "CANCEL", "LOGIN", "LOGOUT"];
const LIMIT    = 20;

function formatValue(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Sí" : "No";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return new Date(val).toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });
  }
  return String(val);
}

function DetailModal({ log, onClose }) {
  if (!log) return null;

  const action  = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-muted text-muted-foreground" };
  const hasData = log.before || log.after;

  const allKeys = hasData
    ? [...new Set([...Object.keys(log.before ?? {}), ...Object.keys(log.after ?? {})])]
    : [];

  const changedKeys = allKeys.filter((k) => {
    return JSON.stringify(log.before?.[k]) !== JSON.stringify(log.after?.[k]);
  });

  const unchangedKeys = allKeys.filter((k) => !changedKeys.includes(k));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg">Detalle del log</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(log.createdAt).toLocaleString("es-SV", { dateStyle: "long", timeStyle: "medium" })}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Info general */}
        <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Usuario</span>
            <p className="font-medium">{log.userEmail}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Acción</span>
            <p>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${action.color}`}>
                {action.label}
              </span>
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Entidad</span>
            <p className="font-medium">{ENTITY_LABELS[log.entity] ?? log.entity}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">IP</span>
            <p className="font-medium font-mono">{log.ip ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">Endpoint</span>
            <p className="font-mono text-xs text-muted-foreground">{log.method} {log.resource}</p>
          </div>
        </div>

        {/* Cambios */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!hasData ? (
            <p className="text-sm text-muted-foreground">No hay datos de detalle para este log.</p>
          ) : changedKeys.length === 0 && !log.after ? (
            <p className="text-sm text-muted-foreground">No se detectaron cambios de campos.</p>
          ) : (
            <div className="space-y-4">
              {/* Campos que cambiaron */}
              {changedKeys.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Campos modificados
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground w-1/3">Campo</th>
                          {log.before && <th className="px-3 py-2 text-left text-xs text-red-400">Antes</th>}
                          {log.after  && <th className="px-3 py-2 text-left text-xs text-green-400">Después</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {changedKeys.map((key) => (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-muted-foreground text-xs font-medium">
                              {FIELD_LABELS[key] ?? key}
                            </td>
                            {log.before && (
                              <td className="px-3 py-2 text-red-400 text-xs">
                                {formatValue(log.before[key])}
                              </td>
                            )}
                            {log.after && (
                              <td className="px-3 py-2 text-green-400 text-xs">
                                {formatValue(log.after[key])}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Campos sin cambio (solo en CREATE/DELETE para mostrar el snapshot) */}
              {unchangedKeys.length > 0 && (!log.before || !log.after) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {log.before ? "Estado al eliminar" : "Datos creados"}
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {unchangedKeys.map((key) => {
                          const val = log.after?.[key] ?? log.before?.[key];
                          return (
                            <tr key={key} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 text-muted-foreground text-xs font-medium w-1/3">
                                {FIELD_LABELS[key] ?? key}
                              </td>
                              <td className="px-3 py-2 text-xs">{formatValue(val)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const { logs, total, totalPages, loading, error, fetchLogs } = useAudit();
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({ entity: "", action: "", dateFrom: "", dateTo: "" });
  const [page, setPage] = useState(1);

  const load = (p = 1, f = filters) => fetchLogs({ ...f, page: p, limit: LIMIT });

  useEffect(() => { load(1); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const handleReset = () => {
    const reset = { entity: "", action: "", dateFrom: "", dateTo: "" };
    setFilters(reset);
    setPage(1);
    load(1, reset);
  };

  const goToPage = (p) => { setPage(p); load(p); };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de Auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de todas las acciones realizadas en el sistema.
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFilter} className="bg-card border border-border rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Entidad</label>
          <select
            value={filters.entity}
            onChange={(e) => setFilters((p) => ({ ...p, entity: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm min-w-[130px]"
          >
            <option value="">Todas</option>
            {ENTITIES.map((e) => <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Acción</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm min-w-[130px]"
          >
            <option value="">Todas</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input type="date" value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input type="date" value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit"
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium"
          >
            <Filter size={14} /> Filtrar
          </button>
          <button type="button" onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-sm text-muted-foreground hover:bg-muted/30"
          >
            <RefreshCw size={14} /> Limpiar
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
        </div>

        {error && <div className="p-6 text-center text-destructive text-sm">{error}</div>}

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No hay registros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Acción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">IP</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const action = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-muted text-muted-foreground" };
                  const hasDetail = log.before || log.after;
                  return (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("es-SV", { dateStyle: "short", timeStyle: "medium" })}
                      </td>
                      <td className="px-4 py-3 text-sm">{log.userEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${action.color}`}>
                          {action.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{ENTITY_LABELS[log.entity] ?? log.entity}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.ip ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {hasDetail && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-center gap-2">
            <button disabled={page === 1} onClick={() => goToPage(page - 1)}
              className="px-3 py-1 rounded border border-border text-sm disabled:opacity-40">
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button key={p} onClick={() => goToPage(p)}
                  className={`px-3 py-1 rounded border text-sm ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/30"}`}>
                  {p}
                </button>
              ))}
            <button disabled={page === totalPages} onClick={() => goToPage(page + 1)}
              className="px-3 py-1 rounded border border-border text-sm disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
