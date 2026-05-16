import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tenantService } from "@/services/tenant.service";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (!clean) return;
    setError(null);
    setLoading(true);
    try {
      await tenantService.getBySlug(clean);
      navigate(`/login/${clean}`);
    } catch {
      setError("Empresa no encontrada. Verifica el nombre e inténtalo de nuevo.");
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
          <div className="space-y-3">
            <p className="text-blue-200 text-lg leading-relaxed">Less admin. More road.</p>
          </div>
        </div>

        <p className="absolute bottom-6 text-blue-300/60 text-xs z-10">
          © {new Date().getFullYear()} Drivly · Todos los derechos reservados
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">

          <div className="flex lg:hidden justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-16 h-16" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Bienvenido</h2>
            <p className="text-muted-foreground">
              Ingresa el nombre de tu empresa para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nombre de tu empresa (slug)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ej: rentcar-garcia"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setError(null); }}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
              {slug.trim() && (
                <p className="text-xs text-muted-foreground">
                  Accederás a:{" "}
                  <span className="font-mono text-foreground">/login/{slug.trim().toLowerCase()}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              disabled={!slug.trim() || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando empresa...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ir a mi empresa
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-blue-500 hover:underline font-medium">
                Crea tu empresa gratis
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              ¿Eres el administrador del sistema?{" "}
              <button
                onClick={() => navigate("/login/superadmin")}
                className="text-purple-500 hover:underline font-medium"
              >
                Acceso SuperAdmin
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
