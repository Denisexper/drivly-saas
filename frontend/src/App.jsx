import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";
import MainLayout from "@/components/layout/MainLayout";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import LoginPage from "@/pages/LoginPage";
import WelcomePage from "@/pages/WelcomePage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import DashboardPage from "@/pages/DashboardPage";
import VehiclesPage from "@/pages/VehiclesPage";
import CustomersPage from "@/pages/CustomersPage";
import RentalsPage from "@/pages/RentalsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import UsersPage from "@/pages/UsersPage";
import RolesPage from "@/pages/RolesPage";
import DailySummaryPage from "@/pages/DailySummaryPage";
import ReceivablesPage from "@/pages/ReceivablesPage";
import SettingsPage from "@/pages/SettingsPage";
import AuditPage from "@/pages/AuditPage";
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import SATenantsPage from "@/pages/superadmin/SATenantsPage";
import SAVehiclesPage from "@/pages/superadmin/SAVehiclesPage";
import SARentalsPage from "@/pages/superadmin/SARentalsPage";
import SACustomersPage from "@/pages/superadmin/SACustomersPage";
import SAUsersPage from "@/pages/superadmin/SAUsersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<WelcomePage />} />
        <Route path="/login/:slug" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Universo SuperAdmin */}
        <Route
          path="/superadmin"
          element={
            <PrivateRoute>
              <SuperAdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="tenants"   element={<SATenantsPage />} />
          <Route path="vehicles"  element={<SAVehiclesPage />} />
          <Route path="rentals"   element={<SARentalsPage />} />
          <Route path="customers" element={<SACustomersPage />} />
          <Route path="users"     element={<SAUsersPage />} />
        </Route>

        {/* Universo Tenant */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles"  element={<VehiclesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/rentals"   element={<RentalsPage />} />
          <Route path="/payments"  element={<PaymentsPage />} />
          <Route path="/users"     element={<UsersPage />} />
          <Route path="/roles"          element={<RolesPage />} />
          <Route path="/cierre-caja"    element={<DailySummaryPage />} />
          <Route path="/cuentas-cobrar" element={<ReceivablesPage />} />
          <Route path="/settings"       element={<SettingsPage />} />
          <Route path="/audit"          element={<AuditPage />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
