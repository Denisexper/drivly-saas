import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { Sun, Moon, Building2 } from "lucide-react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { useTenants } from "@/hooks/useTenants";
import { useSuperAdminStore } from "@/store/superAdminStore";

const routeTitles = {
  "/superadmin":           "Dashboard Global",
  "/superadmin/tenants":   "Empresas",
  "/superadmin/vehicles":  "Vehículos",
  "/superadmin/rentals":   "Alquileres",
  "/superadmin/customers": "Clientes",
  "/superadmin/users":     "Usuarios",
};

function SuperAdminHeader() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const { tenants } = useTenants();
  const { selectedTenantId, setSelectedTenantId } = useSuperAdminStore();

  const title = routeTitles[pathname] ?? "Super Admin";

  return (
    <header className="h-16 px-6 border-b border-border bg-card flex items-center justify-between">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Tenant selector global */}
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-muted-foreground" />
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => setSelectedTenantId(e.target.value || null)}
            className="text-sm bg-background border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Todos los tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <span className="text-sm text-muted-foreground font-medium">
            {user.name ?? user.email}
          </span>
        )}
      </div>
    </header>
  );
}

export default function SuperAdminLayout() {
  const init = useThemeStore((s) => s.init);
  const role = useAuthStore((s) => s.user?.role);
  const setSelectedTenantId = useSuperAdminStore((s) => s.setSelectedTenantId);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setSelectedTenantId(null);
  }, [setSelectedTenantId]);

  if (role !== "SuperAdmin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <SuperAdminSidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
