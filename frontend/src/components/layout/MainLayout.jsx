import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ShieldCheck, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";

export default function MainLayout() {
  const init = useThemeStore((s) => s.init);
  const navigate = useNavigate();
  const { user, savedSASession, exitImpersonation } = useAuthStore();

  const isImpersonating = user?.role === "SuperAdmin" && !!savedSASession;

  useEffect(() => { init(); }, [init]);

  function handleExit() {
    exitImpersonation();
    navigate("/superadmin");
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-purple-600 px-4 py-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              Modo vista SuperAdmin — estás dentro del panel de{" "}
              <span className="font-semibold">{user?.tenantName ?? "esta empresa"}</span>
            </span>
          </div>
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Volver al panel SA
          </button>
        </div>
      )}

      <Sidebar />
      <div className={`ml-64 flex flex-col min-h-screen ${isImpersonating ? "pt-10" : ""}`}>
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
