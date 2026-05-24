import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  CreditCard,
  UserCog,
  ShieldCheck,
  KeyRound,
  LogOut,
  BarChart2,
  AlertCircle,
  Settings,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/hooks/usePermissions";

const navItems = [
  { to: "/dashboard",      label: "Dashboard",          icon: LayoutDashboard, permission: null },
  { to: "/vehicles",       label: "Vehículos",           icon: Car,             permission: "vehicles:read" },
  { to: "/customers",      label: "Clientes",            icon: Users,           permission: "clients:read" },
  { to: "/rentals",        label: "Alquileres",          icon: FileText,        permission: "rentals:read" },
  { to: "/payments",       label: "Pagos",               icon: CreditCard,      permission: "payments:read" },
  { to: "/users",          label: "Usuarios",            icon: UserCog,         permission: "users:read" },
  { to: "/roles",          label: "Roles y Permisos",    icon: KeyRound,        permission: "roles:manage" },
  { to: "/reportes",       label: "Reportes",            icon: TrendingUp,      permission: "reports:read" },
  { to: "/cierre-caja",    label: "Cierre de Caja",      icon: BarChart2,       permission: "reports:read" },
  { to: "/cuentas-cobrar", label: "Cuentas por Cobrar",  icon: AlertCircle,     permission: "reports:read" },
  { to: "/audit",          label: "Logs de Auditoría",   icon: ClipboardList,   permission: "audit:read" },
  { to: "/settings",       label: "Configuración",       icon: Settings,        permission: null, adminOnly: true },
];

export default function Sidebar() {
  const { logout, user, savedSASession } = useAuthStore();
  const navigate = useNavigate();
  const { can, role } = usePermissions();

  const isImpersonating = user?.role === "SuperAdmin" && !!savedSASession;

  const handleLogout = () => {
    const slug = localStorage.getItem("lastSlug");
    logout();
    navigate(slug ? `/login/${slug}` : "/login");
  };

  return (
    <aside className={`fixed left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-20 ${isImpersonating ? "top-10" : "top-0"}`}>
      <div className="px-6 py-5 border-b border-sidebar-border">
        <span className="text-sidebar-primary font-bold text-xl tracking-tight">
          Drivly
        </span>
        {isImpersonating && user?.tenantName && (
          <p className="mt-0.5 text-xs font-medium text-purple-400 truncate">
            {user.tenantName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(({ permission, adminOnly }) =>
            (!permission || can(permission)) && (!adminOnly || role === "Admin")
          )
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>

      {role === "SuperAdmin" && (
        <div className="px-3 pb-2 border-t border-sidebar-border pt-3">
          <NavLink
            to="/superadmin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-purple-400 hover:bg-purple-900/30 hover:text-purple-300"
              }`
            }
          >
            <ShieldCheck size={18} />
            Panel SuperAdmin
          </NavLink>
        </div>
      )}

      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
