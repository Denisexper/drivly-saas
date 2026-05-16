import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message ?? "Token inválido o expirado. Solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Enlace inválido.</p>
          <Link to="/forgot-password" className="text-blue-500 hover:underline text-sm">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
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
        <div className="relative z-10 text-center text-white space-y-6 max-w-sm">
          <div className="flex justify-center">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="w-24 h-24" />
          </div>
          <p className="text-blue-200 text-lg">Less admin. More road.</p>
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

          {done ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Contraseña actualizada</h2>
                <p className="text-muted-foreground text-sm">
                  Serás redirigido al inicio de sesión en unos segundos...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Nueva contraseña</h2>
                <p className="text-muted-foreground text-sm">
                  Elige una contraseña segura de al menos 6 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      className="pl-10"
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                      className="pl-10"
                      required
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
                  className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    "Guardar contraseña"
                  )}
                </Button>
              </form>

              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
