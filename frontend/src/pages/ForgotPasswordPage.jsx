import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
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

          {sent ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Revisa tu email</h2>
                <p className="text-muted-foreground text-sm">
                  Si <span className="font-medium text-foreground">{email}</span> está registrado,
                  recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">¿Olvidaste tu contraseña?</h2>
                <p className="text-muted-foreground text-sm">
                  Ingresa tu email y te enviaremos un enlace para recuperarla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      className="pl-10"
                      required
                      autoFocus
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
                      Enviando...
                    </span>
                  ) : (
                    "Enviar instrucciones"
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
