import { useState, useEffect } from "react";
import { vehicleService } from "@/services/vehicle.service";
import { rentalService } from "@/services/rental.service";
import { clientService } from "@/services/client.service";
import { paymentService } from "@/services/payment.service";
import { usePermissionsStore } from "@/store/permissionsStore";
import { useAuthStore } from "@/store/authStore";

const RENTAL_PAYMENT_TYPES = ["Deposito", "PagoAlquiler"];

const getCurrentMonthIncome = (payments) => {
  const now = new Date();
  return payments
    .filter((p) => {
      const created = new Date(p.createdAt);
      return (
        p.type !== "Devolucion" &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);
};

const getPendingBalance = (rentals, payments) => {
  const activeRentalIds = new Set(
    rentals.filter((r) => r.status === "Active").map((r) => r.id)
  );

  const paidByRental = {};
  for (const p of payments) {
    if (activeRentalIds.has(p.rentalId) && RENTAL_PAYMENT_TYPES.includes(p.type)) {
      paidByRental[p.rentalId] = (paidByRental[p.rentalId] ?? 0) + Number(p.amount);
    }
  }

  return rentals
    .filter((r) => r.status === "Active")
    .reduce((sum, r) => {
      const paid = paidByRental[r.id] ?? 0;
      return sum + Math.max(0, Number(r.totalAmount) - paid);
    }, 0);
};

const safe = (promise) => promise.catch(() => null);

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { can, loaded } = usePermissionsStore();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "SuperAdmin";

  useEffect(() => {
    if (!loaded && !isSuperAdmin) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [vehiclesRes, rentalsRes, clientsRes, paymentsRes] =
          await Promise.all([
            isSuperAdmin || can("vehicles:read") ? safe(vehicleService.getAll()) : Promise.resolve(null),
            isSuperAdmin || can("rentals:read")  ? safe(rentalService.getAll())  : Promise.resolve(null),
            isSuperAdmin || can("clients:read")  ? safe(clientService.getAll())  : Promise.resolve(null),
            isSuperAdmin || can("payments:read") ? safe(paymentService.getAll()) : Promise.resolve(null),
          ]);

        const vehicles = vehiclesRes?.data?.data ?? [];
        const rentals  = rentalsRes?.data?.data  ?? [];
        const clients  = clientsRes?.data?.data  ?? [];
        const payments = paymentsRes?.data?.data ?? [];

        setStats({
          totalVehicles:  vehiclesRes  ? vehicles.length : null,
          activeRentals:  rentalsRes   ? rentals.filter((r) => r.status === "Active").length : null,
          totalClients:   clientsRes   ? clients.length : null,
          monthlyIncome:  paymentsRes  ? getCurrentMonthIncome(payments) : null,
          pendingBalance: rentalsRes && paymentsRes ? getPendingBalance(rentals, payments) : null,
        });
      } catch (err) {
        setError("Error al cargar los datos del dashboard");
        console.error("[useDashboard]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [loaded, isSuperAdmin]);

  return { stats, loading, error };
};
