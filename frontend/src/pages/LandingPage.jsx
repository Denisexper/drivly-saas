import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  CalendarClock,
  Building2,
  BarChart3,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Car,
    title: "Gestión de flota",
    description:
      "Controla el estado, disponibilidad e historial de cada vehículo desde un solo lugar.",
  },
  {
    icon: CalendarClock,
    title: "Alquileres sin fricción",
    description:
      "Crea, retorna y cancela alquileres validando conflictos de fechas y disponibilidad automáticamente.",
  },
  {
    icon: Wallet,
    title: "Cobros y cuentas por cobrar",
    description:
      "Registra pagos, controla saldos pendientes y cierra caja diaria sin hojas de cálculo.",
  },
  {
    icon: Building2,
    title: "Multi-tenant seguro",
    description:
      "Cada empresa opera en su propio espacio aislado, con roles y permisos configurables por usuario.",
  },
  {
    icon: BarChart3,
    title: "Reportes y analítica",
    description:
      "Visualiza ingresos, ocupación de flota y desempeño del negocio con reportes exportables.",
  },
  {
    icon: ShieldCheck,
    title: "Auditoría completa",
    description:
      "Cada acción queda registrada en un log de auditoría para tener trazabilidad total.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="h-8 w-8" />
            <span className="font-heading text-lg font-semibold">Drivly</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/register">
                Registrarse
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-[-100px] right-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-28 text-center text-white">
          <p className="mb-4 text-sm font-medium tracking-wide text-blue-200 uppercase">
            Software de gestión para rent-a-car
          </p>
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
            Less admin. More road.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Drivly centraliza flota, alquileres, clientes y cobros de tu empresa de renta de
            vehículos, con roles por usuario y un espacio aislado para cada empresa.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Crear mi empresa
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
              <Link to="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold">Todo lo que necesita tu operación</h2>
          <p className="mt-3 text-muted-foreground">
            Un solo sistema para administrar vehículos, alquileres y equipo, sin depender de
            hojas de cálculo sueltas.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-14 text-center text-white"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)" }}
        >
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Empieza a administrar tu flota hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Crea tu empresa en minutos y da acceso a tu equipo con los roles que necesites.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Registrarse gratis
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-foreground/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/saas_rounded_icon.png" alt="Drivly" className="h-5 w-5" />
            <span>Drivly</span>
          </div>
          <p>© {new Date().getFullYear()} Drivly · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
