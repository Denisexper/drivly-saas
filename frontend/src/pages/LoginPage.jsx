import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { tenantService } from "@/services/tenant.service";
import api from "@/services/api";
import { Mail, Lock, ShieldCheck, Building2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const login = useAuthStore((state) => state.login);

  const isSuperAdmin = slug === "superadmin";

  const [tenant, setTenant] = useState(null);
  const [tenantError, setTenantError] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(!isSuperAdmin);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) return;
    setTenantLoading(true);
    tenantService.getBySlug(slug)
      .then((res) => setTenant(res.data.data))
      .catch(() => setTenantError("Empresa no encontrada. Verifica el enlace."))
      .finally(() => setTenantLoading(false));
  }, [slug, isSuperAdmin]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin && !tenant?.active) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { ...form, slug });
      login(data.token, data.data, data.data.slug ?? slug);
      navigate(data.data?.role === "SuperAdmin" ? "/superadmin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.msj || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const leftGradient = isSuperAdmin
    ? "linear-gradient(135deg, #1e0a3c 0%, #3b1078 50%, #6d28d9 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)";

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: leftGradient }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: isSuperAdmin ? "#8b5cf6" : "#3b82f6" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: isSuperAdmin ? "#7c3aed" : "#60a5fa" }} />

        <div className="relative z-10 text-center text-white space-y-8 max-w-sm">
          <div className="flex justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-24 h-24" />
          </div>
          <div className="space-y-3">
            <p className="text-lg leading-relaxed" style={{ color: isSuperAdmin ? "#c4b5fd" : "#bfdbfe" }}>Less admin. More road.</p>
            <p className="text-lg leading-relaxed" style={{ color: isSuperAdmin ? "#c4b5fd" : "#bfdbfe" }}>
              {isSuperAdmin
                ? "Panel de administración global del sistema"
                : "Plataforma administrativa para la gestión profesional de tu flota"}
            </p>
          </div>
          {!isSuperAdmin && (
            <div className="flex flex-col gap-3 text-sm text-blue-100">
              {["Gestión de flota vehicular", "Control de alquileres y pagos", "Reportes y estadísticas"].map((f) => (
                <div key={f} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                  <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="absolute bottom-6 text-xs z-10" style={{ color: isSuperAdmin ? "#a78bfa60" : "#93c5fd60" }}>
          © {new Date().getFullYear()} Drivly · Todos los derechos reservados
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">

          <div className="flex lg:hidden justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-16 h-16" />
          </div>

          {/* Company badge / SA badge */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-400">SuperAdmin</p>
                <p className="text-xs text-muted-foreground">Acceso global al sistema</p>
              </div>
            </div>
          ) : tenantLoading ? (
            <div className="h-14 rounded-xl bg-muted animate-pulse" />
          ) : tenantError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive font-medium">{tenantError}</p>
            </div>
          ) : tenant ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
              </div>
              {!tenant.active && (
                <span className="ml-auto text-xs font-medium text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                  Inactiva
                </span>
              )}
            </div>
          ) : null}

          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Iniciar sesión</h2>
            <p className="text-muted-foreground text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@empresa.com"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={!isSuperAdmin && (tenantLoading || !!tenantError || !tenant?.active)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={!isSuperAdmin && (tenantLoading || !!tenantError || !tenant?.active)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full h-11 text-base font-semibold ${isSuperAdmin ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
              disabled={loading || (!isSuperAdmin && (tenantLoading || !!tenantError || !tenant?.active))}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : "Iniciar sesión"}
            </Button>
          </form>

          <div className="space-y-2 text-center">
            {!isSuperAdmin && (
              <p className="text-sm text-muted-foreground">
                <Link to="/forgot-password" className="text-blue-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Al iniciar sesión aceptas los términos y condiciones del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
