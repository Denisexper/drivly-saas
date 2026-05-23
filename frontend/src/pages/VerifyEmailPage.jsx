import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | expired | no_token
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("no_token");
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        const msg = err.response?.data?.message ?? "";
        setStatus(msg === "TOKEN_INVALID_OR_EXPIRED" ? "expired" : "expired");
      });
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    setResendLoading(true);
    setResendError(null);
    try {
      await authService.resendVerification(resendEmail);
      setResendDone(true);
    } catch {
      setResendError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 text-center">

        <div className="flex justify-center">
          <img src="/saas_rounded_icon.png" alt="Drivly" className="w-16 h-16" />
        </div>

        {status === "verifying" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Verificando tu email...</h2>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">¡Cuenta activada!</h2>
            <p className="text-muted-foreground text-sm">
              Tu email ha sido verificado. Ya puedes iniciar sesión.
            </p>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        )}

        {(status === "expired" || status === "no_token") && (
          <div className="space-y-4">
            <XCircle className="w-14 h-14 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">
              {status === "no_token" ? "Enlace inválido" : "Enlace expirado"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {status === "no_token"
                ? "Este enlace de verificación no es válido."
                : "Este enlace ya no es válido. Solicita uno nuevo ingresando tu email."}
            </p>

            {!resendDone ? (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {resendError && (
                  <p className="text-sm text-destructive">{resendError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Reenviar verificación"
                  )}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Revisa tu bandeja de entrada. Si el email existe recibirás el enlace en breve.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="text-blue-500 hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
