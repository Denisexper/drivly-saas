import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { rentalService } from "../../services/rental.service";
import { paymentService } from "../../services/payment.service";

const STATUS_LABELS = { Active: "Activo", Completed: "Completado", Cancelled: "Cancelado" };
const FUEL_LABELS = { Full: "Lleno", ThreeQuarters: "3/4", Half: "1/2", Quarter: "1/4", Empty: "Vacío" };

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

function fmt(n) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[type] ?? "bg-muted text-muted-foreground"}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-muted/60 p-3 space-y-1.5">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function handleDownloadReceipt(paymentId) {
  try {
    await paymentService.downloadPdfReceipt(paymentId);
  } catch {
    // silencioso — el operador verá que no descargó nada
  }
}

function FinancialSummary({ summary, loading }) {
  if (loading) return <SummarySkeleton />;
  if (!summary) return null;

  const { totalAcordado, totalPagado, saldoPendiente, totalCobrosExtra, totalDevuelto, totalFinal, pagos } = summary;
  const isPaid = saldoPendiente === 0;

  return (
    <div className="space-y-3">
      {/* Métricas principales */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Total acordado</p>
          <p className="font-mono font-semibold text-sm">{fmt(totalAcordado)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Pagado</p>
          <p className="font-mono font-semibold text-sm text-green-600 dark:text-green-400">{fmt(totalPagado)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Saldo pendiente</p>
          <p className={`font-mono font-semibold text-sm ${isPaid ? "text-muted-foreground" : "text-yellow-600 dark:text-yellow-400"}`}>
            {fmt(saldoPendiente)}
          </p>
        </div>
      </div>

      {/* Cobros extra y devolución si aplica */}
      {(totalCobrosExtra > 0 || totalDevuelto > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {totalCobrosExtra > 0 && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Cobros extra</p>
              <p className="font-mono font-semibold text-sm text-red-500 dark:text-red-400">+{fmt(totalCobrosExtra)}</p>
            </div>
          )}
          {totalDevuelto > 0 && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Devuelto</p>
              <p className="font-mono font-semibold text-sm text-green-600 dark:text-green-400">-{fmt(totalDevuelto)}</p>
            </div>
          )}
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Total final</p>
            <p className="font-mono font-semibold text-sm">{fmt(totalFinal)}</p>
          </div>
        </div>
      )}

      {/* Lista de pagos */}
      {pagos.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 bg-muted/30 border-b border-border">
            Historial de pagos
          </p>
          <div className="divide-y divide-border">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <TypeBadge type={p.type} />
                  {p.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={p.notes}>
                      {p.notes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-medium">{fmt(p.amount)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                  <button
                    onClick={() => handleDownloadReceipt(p.id)}
                    title="Descargar recibo PDF"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pagos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">Sin pagos registrados</p>
      )}
    </div>
  );
}

function PhotoGrid({ photos, loading, emptyText }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }
  if (!photos.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p) => (
        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
          className="relative group aspect-square rounded-lg overflow-hidden border border-border block"
        >
          <img src={p.url} alt="foto evidencia" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </a>
      ))}
    </div>
  );
}

export function RentalDetailModal({ rental, open, onOpenChange }) {
  const [checkoutPhotos, setCheckoutPhotos] = useState([]);
  const [returnPhotos, setReturnPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (!open || !rental) return;

    // Fotos
    setLoadingPhotos(true);
    const requests = [rentalService.getPhotos(rental.id, "Checkout")];
    if (rental.status === "Completed") {
      requests.push(rentalService.getPhotos(rental.id, "Return"));
    }
    Promise.all(requests)
      .then(([checkoutRes, returnRes]) => {
        setCheckoutPhotos(checkoutRes.data?.data ?? []);
        setReturnPhotos(returnRes?.data?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));

    // Resumen financiero
    setLoadingSummary(true);
    paymentService.getSummary(rental.id)
      .then((res) => setSummary(res.data?.data ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));
  }, [open, rental]);

  useEffect(() => {
    if (!open) {
      setCheckoutPhotos([]);
      setReturnPhotos([]);
      setSummary(null);
    }
  }, [open]);

  if (!rental) return null;

  const isCompleted = rental.status === "Completed";

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle del Alquiler</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-medium text-foreground">{rental.vehicle?.plate}</span>
            {" "}— {rental.client?.firstName} {rental.client?.lastName}
          </DialogDescription>
        </DialogHeader>

        {/* Info del alquiler */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-0.5">
            <InfoRow label="Cliente" value={`${rental.client?.firstName} ${rental.client?.lastName}`} />
            <InfoRow label="Documento" value={rental.client?.idNumber} />
            <InfoRow label="Vehículo" value={`${rental.vehicle?.brand} ${rental.vehicle?.model}`} />
            <InfoRow label="Placa" value={rental.vehicle?.plate} />
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-0.5">
            <InfoRow label="Inicio" value={formatDate(rental.startDate)} />
            <InfoRow label="Fin" value={formatDate(rental.endDate)} />
            <InfoRow label="Estado" value={STATUS_LABELS[rental.status] ?? rental.status} />
            <InfoRow label="Total" value={fmt(rental.totalAmount)} />
          </div>
        </div>

        {/* Info adicional */}
        <div className="rounded-lg bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-8 gap-y-0.5">
          <InfoRow label="Km inicial" value={rental.mileageStart ?? "—"} />
          <InfoRow label="Km final" value={rental.mileageEnd ?? "—"} />
          <InfoRow label="Combustible salida" value={FUEL_LABELS[rental.fuelOut] ?? rental.fuelOut ?? "—"} />
          <InfoRow label="Combustible entrada" value={FUEL_LABELS[rental.fuelIn] ?? rental.fuelIn ?? "—"} />
          <InfoRow label="Depósito" value={rental.deposit ? fmt(rental.deposit) : "—"} />
          <InfoRow label="Cargos extra" value={rental.extraCharges ? fmt(rental.extraCharges) : "—"} />
        </div>

        {rental.notes && (
          <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Notas</p>
            <p>{rental.notes}</p>
          </div>
        )}

        {/* Resumen financiero */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Resumen Financiero
          </p>
          <FinancialSummary summary={summary} loading={loadingSummary} />
        </div>

        {/* Fotos comparativas */}
        <div className={`grid gap-4 ${isCompleted ? "grid-cols-2" : "grid-cols-1"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Fotos Checkout
            </p>
            <PhotoGrid
              photos={checkoutPhotos}
              loading={loadingPhotos}
              emptyText="Sin fotos de checkout"
            />
          </div>

          {isCompleted && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Fotos Return
              </p>
              <PhotoGrid
                photos={returnPhotos}
                loading={loadingPhotos}
                emptyText="Sin fotos de devolución"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
