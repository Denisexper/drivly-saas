import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "../hooks/usePermissions";
import { usePayments } from "../hooks/usePayments";
import { PaymentFormModal } from "../components/payments/PaymentFormModal";
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { paymentService } from "../services/payment.service";

const RENTAL_PAYMENT_TYPES = ["Deposito", "PagoAlquiler"];
const EXTRA_CHARGE_TYPES = ["CobroDano", "CobroCombustible", "CobrodiaExtra"];

const METHOD_LABELS = {
  Cash: "Efectivo",
  Card: "Tarjeta",
  Transfer: "Transferencia",
  Check: "Cheque",
};

const TYPE_LABELS = {
  Deposito: "Depósito",
  PagoAlquiler: "Pago alquiler",
  CobroDano: "Cobro daño",
  CobroCombustible: "Cobro combustible",
  CobrodiaExtra: "Día extra",
  Devolucion: "Devolución",
};

const TYPE_STYLES = {
  Deposito: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PagoAlquiler: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CobroDano: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CobroCombustible: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CobrodiaExtra: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Devolucion: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[type] ?? "bg-muted text-muted-foreground"}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function fmt(n) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function groupByRental(payments) {
  const map = {};
  for (const p of payments) {
    if (!map[p.rentalId]) {
      map[p.rentalId] = { rental: p.rental, rentalId: p.rentalId, payments: [] };
    }
    map[p.rentalId].payments.push(p);
  }
  return Object.values(map);
}

function computeSummary(payments, totalAmount) {
  const totalAcordado = Number(totalAmount ?? 0);
  const totalPagado = payments
    .filter((p) => RENTAL_PAYMENT_TYPES.includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalCobrosExtra = payments
    .filter((p) => EXTRA_CHARGE_TYPES.includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalDevuelto = payments
    .filter((p) => p.type === "Devolucion")
    .reduce((s, p) => s + Number(p.amount), 0);
  const saldoPendiente = Math.max(0, totalAcordado - totalPagado);
  return { totalAcordado, totalPagado, saldoPendiente, totalCobrosExtra, totalDevuelto };
}

function FinancialBadge({ saldoPendiente, totalPagado }) {
  if (totalPagado === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        Sin pagos
      </span>
    );
  }
  if (saldoPendiente === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Pagado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
      Pendiente {fmt(saldoPendiente)}
    </span>
  );
}

function CardSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-36 rounded bg-muted" />
        </div>
        <div className="h-5 w-20 rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((j) => (
          <div key={j} className="rounded-lg bg-muted/60 p-3 space-y-1">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  ));
}

function RentalCard({ group, canDelete, onDelete, onSuccess }) {
  const [expanded, setExpanded] = useState(false);
  const { rental, rentalId, payments } = group;
  const { totalAcordado, totalPagado, saldoPendiente, totalCobrosExtra, totalDevuelto } =
    computeSummary(payments, rental?.totalAmount);

  const plate = rental?.vehicle?.plate ?? "—";
  const clientName = `${rental?.client?.firstName ?? ""} ${rental?.client?.lastName ?? ""}`.trim() || "—";
  const startDate = formatDate(rental?.startDate);
  const endDate = formatDate(rental?.endDate);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-base">{plate}</span>
            <FinancialBadge saldoPendiente={saldoPendiente} totalPagado={totalPagado} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground truncate">{clientName}</p>
          <p className="text-xs text-muted-foreground">{startDate} → {endDate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {saldoPendiente > 0 && (
            <PaymentFormModal
              rentalId={rentalId}
              initialAmount={Number(saldoPendiente.toFixed(2))}
              initialType="PagoAlquiler"
              triggerLabel={`Completar pago ${fmt(saldoPendiente)}`}
              onSuccess={onSuccess}
            />
          )}
          <PaymentFormModal rentalId={rentalId} onSuccess={onSuccess} compact />
        </div>
      </div>

      {/* Financial summary */}
      <div className="px-5 pb-4">
        <div className={`grid gap-2 text-sm ${totalCobrosExtra > 0 || totalDevuelto > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Total acordado</p>
            <p className="font-mono font-semibold">{fmt(totalAcordado)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Pagado</p>
            <p className="font-mono font-semibold text-green-600 dark:text-green-400">{fmt(totalPagado)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Saldo pendiente</p>
            <p className={`font-mono font-semibold ${saldoPendiente > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`}>
              {fmt(saldoPendiente)}
            </p>
          </div>
          {(totalCobrosExtra > 0 || totalDevuelto > 0) && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">
                {totalDevuelto > 0 ? "Devolución" : "Cobros extra"}
              </p>
              <p className={`font-mono font-semibold ${totalDevuelto > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                {totalDevuelto > 0 ? `-${fmt(totalDevuelto)}` : `+${fmt(totalCobrosExtra)}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expand/collapse toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-muted-foreground border-t border-border hover:bg-muted/30 transition-colors"
      >
        <span>{payments.length} pago{payments.length !== 1 ? "s" : ""}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Payment list */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <TypeBadge type={p.type} />
                <span className="font-mono font-medium">{fmt(p.amount)}</span>
                <span className="text-muted-foreground text-xs">{METHOD_LABELS[p.method] ?? p.method}</span>
                {p.notes && (
                  <span className="text-muted-foreground text-xs truncate max-w-[200px]" title={p.notes}>
                    · {p.notes}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                <button
                  onClick={() => paymentService.downloadPdfReceipt(p.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Descargar recibo PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => onDelete(p)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Eliminar pago"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const { payments, loading, error, refetch } = usePayments();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [deletePayment, setDeletePayment] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deletePayment) return;
    setDeleting(true);
    try {
      await paymentService.remove(deletePayment.id);
      toast.success("Pago eliminado");
      setDeletePayment(null);
      refetch();
    } catch {
      toast.error("No se pudo eliminar el pago");
    } finally {
      setDeleting(false);
    }
  }

  const groups = groupByRental(payments);

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    const plate = g.rental?.vehicle?.plate?.toLowerCase() ?? "";
    const client = `${g.rental?.client?.firstName ?? ""} ${g.rental?.client?.lastName ?? ""}`.toLowerCase();
    return plate.includes(q) || client.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pagos</h1>
          <p className="text-sm text-muted-foreground">Registro financiero por alquiler</p>
        </div>
        {can("payments:create") && <PaymentFormModal onSuccess={refetch} />}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por placa o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-72 rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={refetch} className="underline text-xs">Reintentar</button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <CardSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {search ? "Sin resultados para esa búsqueda." : "No hay pagos registrados."}
          </div>
        ) : (
          filtered.map((g) => (
            <RentalCard
              key={g.rentalId}
              group={g}
              canDelete={can("payments:delete")}
              onDelete={setDeletePayment}
              onSuccess={refetch}
            />
          ))
        )}
      </div>

      <AlertDialogRoot open={!!deletePayment} onOpenChange={(v) => { if (!v) setDeletePayment(null); }}>
        <AlertDialogContent>
          <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar el pago de{" "}
            <span className="font-mono font-medium text-foreground">
              ${Number(deletePayment?.amount ?? 0).toFixed(2)}
            </span>{" "}
            ({TYPE_LABELS[deletePayment?.type] ?? deletePayment?.type}). Esta acción no se puede deshacer.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleting}>Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} alquiler{filtered.length !== 1 ? "es" : ""} con pagos
          {search ? ` encontrado${filtered.length !== 1 ? "s" : ""}` : ""}
        </p>
      )}
    </div>
  );
}
