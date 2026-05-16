import { useEffect, useState } from "react";
import { useAudit } from "@/hooks/useAudit";
import { ChevronDown, ChevronRight, Filter, RefreshCw } from "lucide-react";

const ACTION_LABELS = {
  CREATE:        { label: "Creación",    color: "bg-green-900/40 text-green-400" },
  UPDATE:        { label: "Edición",     color: "bg-blue-900/40 text-blue-400" },
  DELETE:        { label: "Eliminación", color: "bg-red-900/40 text-red-400" },
  RETURN:        { label: "Devolución",  color: "bg-purple-900/40 text-purple-400" },
  CANCEL:        { label: "Cancelación", color: "bg-orange-900/40 text-orange-400" },
  UPLOAD_PHOTOS: { label: "Fotos",       color: "bg-yellow-900/40 text-yellow-400" },
};

const ENTITY_LABELS = {
  Vehicle: "Vehículo",
  Client:  "Cliente",
  Rental:  "Alquiler",
  Payment: "Pago",
  User:    "Usuario",
  Tenant:  "Empresa",
};

const ENTITIES = ["Vehicle", "Client", "Rental", "Payment", "User", "Tenant"];
const ACTIONS  = ["CREATE", "UPDATE", "DELETE", "RETURN", "CANCEL", "UPLOAD_PHOTOS"];
const LIMIT    = 20;

function DiffViewer({ before, after }) {
  if (!before && !after) return <span className="text-muted-foreground text-xs">Sin detalles</span>;

  const allKeys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  const changed = allKeys.filter((k) => {
    const b = JSON.stringify(before?.[k]);
    const a = JSON.stringify(after?.[k]);
    return b !== a;
  });

  if (changed.length === 0) return <span className="text-muted-foreground text-xs">Sin cambios detectados</span>;

  return (
    <div className="space-y-1 text-xs font-mono">
      {changed.map((key) => (
        <div key={key} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-start">
          <span className="text-muted-foreground shrink-0">{key}:</span>
          {before && (
            <span className="text-red-400 break-all line-through">
              {JSON.stringify(before[key]) ?? "—"}
            </span>
          )}
          {after && (
            <span className="text-green-400 break-all">
              {JSON.stringify(after[key]) ?? "—"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const action = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-muted text-muted-foreground" };
  const hasDetail = log.before || log.after;

  return (
    <>
      <tr
        className={`border-b border-border hover:bg-muted/20 transition-colors ${hasDetail ? "cursor-pointer" : ""}`}
        onClick={() => hasDetail && setExpanded((p) => !p)}
      >
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString("es-SV", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </td>
        <td className="px-4 py-3 text-sm">{log.userEmail}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${action.color}`}>
            {action.label}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">{ENTITY_LABELS[log.entity] ?? log.entity}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[160px]">
          {log.entityId}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{log.ip ?? "—"}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {hasDetail ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </td>
      </tr>

      {expanded && hasDetail && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={7} className="px-6 py-3">
            <DiffViewer before={log.before} after={log.after} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditPage() {
  const { logs, total, totalPages, loading, error, fetchLogs } = useAudit();

  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);

  const load = (p = 1) => {
    fetchLogs({
      ...filters,
      page: p,
      limit: LIMIT,
    });
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const handleReset = () => {
    const reset = { entity: "", action: "", dateFrom: "", dateTo: "" };
    setFilters(reset);
    setPage(1);
    fetchLogs({ page: 1, limit: LIMIT });
  };

  const goToPage = (p) => {
    setPage(p);
    load(p);
  };

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
            className="bg-background border border-border rounded px-2 py-1.5 text-sm min-w-[120px]"
          >
            <option value="">Todas</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Acción</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm min-w-[120px]"
          >
            <option value="">Todas</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            className="bg-background border border-border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium"
          >
            <Filter size={14} />
            Filtrar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-sm text-muted-foreground hover:bg-muted/30"
          >
            <RefreshCw size={14} />
            Limpiar
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
        </div>

        {error && (
          <div className="p-6 text-center text-destructive text-sm">{error}</div>
        )}

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">IP</th>
                  <th className="px-4 py-3 w-6" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              className="px-3 py-1 rounded border border-border text-sm disabled:opacity-40"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1 rounded border text-sm ${
                    p === page
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-3 py-1 rounded border border-border text-sm disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
