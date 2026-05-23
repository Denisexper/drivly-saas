import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, User, Mail, Lock, ArrowRight, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(false);

  const slug = slugify(form.companyName);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.registerCompany(form);
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative z-10 text-center text-white space-y-8 max-w-sm">
          <div className="flex justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-24 h-24" />
          </div>
          <div className="space-y-4">
            <p className="text-blue-200 text-lg leading-relaxed">Less admin. More road.</p>
            <div className="space-y-2 text-sm text-blue-300/80">
              <p>✓ 14 días de prueba gratis</p>
              <p>✓ Sin tarjeta de crédito</p>
              <p>✓ Cancela cuando quieras</p>
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 text-blue-300/60 text-xs z-10">
          © {new Date().getFullYear()} Drivly · Todos los derechos reservados
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-7 py-8">

          <div className="flex lg:hidden justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-16 h-16" />
          </div>

          {registered ? (
            <div className="space-y-6 text-center">
              <MailCheck className="w-16 h-16 text-blue-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Revisa tu email</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enviamos un enlace de activación a{" "}
                  <strong className="text-foreground">{form.ownerEmail}</strong>.
                  <br />
                  Haz click en el enlace para activar tu cuenta.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-left space-y-1">
                <p className="text-xs text-muted-foreground">¿No lo ves? Revisa tu carpeta de spam.</p>
                <p className="text-xs text-muted-foreground">El enlace expira en 24 horas.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-blue-500 hover:underline font-medium">
                  Volver al inicio de sesión
                </Link>
              </p>
            </div>
          ) : (
          <>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Crea tu empresa</h2>
            <p className="text-muted-foreground text-sm">14 días gratis, sin tarjeta de crédito</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Company name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nombre de tu empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="companyName"
                  placeholder="ej: RentCar García"
                  value={form.companyName}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
              {slug && (
                <p className="text-xs text-muted-foreground">
                  Tu URL:{" "}
                  <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                    /login/{slug}
                  </span>
                </p>
              )}
            </div>

            {/* Owner name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tu nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="ownerName"
                  placeholder="Carlos García"
                  value={form.ownerName}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="ownerEmail"
                  type="email"
                  placeholder="carlos@miempresa.com"
                  value={form.ownerEmail}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="ownerPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.ownerPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando tu empresa...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-500 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
