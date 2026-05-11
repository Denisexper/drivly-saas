import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { useSettings } from "../hooks/useSettings";
import { settingsService } from "../services/settings.service";

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, checked, onChange, saving }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={saving} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-64 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { role } = usePermissions();
  const { settings, loading, error, refetch } = useSettings();
  const [saving, setSaving] = useState(false);

  if (role !== "Admin") return <Navigate to="/dashboard" replace />;

  async function handleToggle(key, value) {
    setSaving(true);
    try {
      await settingsService.update({ [key]: value });
      await refetch();
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las preferencias de tu empresa
        </p>
      </div>

      {/* Notificaciones */}
      <div className="rounded-xl ring-1 ring-foreground/10 bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-medium">Notificaciones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controla qué emails se envían automáticamente desde tu cuenta
          </p>
        </div>

        <div className="px-6 divide-y divide-border">
          {loading ? (
            <SettingsSkeleton />
          ) : error ? (
            <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 my-4 text-sm text-destructive">
              <span>{error}</span>
              <button onClick={refetch} className="underline text-xs">
                Reintentar
              </button>
            </div>
          ) : (
            <SettingRow
              icon={Mail}
              label="Emails automáticos"
              description="Envía emails de bienvenida, confirmación de alquiler, devolución y recibos de pago a los clientes"
              checked={settings?.emailNotifications ?? true}
              onChange={(val) => handleToggle("emailNotifications", val)}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
