import { Router } from "express";
import prisma from "../dataBase/prisma";

//importaciones modulo de clients
import { ClientRepository } from "../repositories/client/client.repository";
import { ClienteControllerService } from "../controllers/client/client.controller.service";
import { ClientRoutes } from "./client/client.routes";

//importaciones modulo payment
import { PaymentRepository } from "../repositories/payment/payment.repository";
import { PaymentControllerService } from "../controllers/payment/payment.controller.service";
import { PaymentRoutes } from "./payment/payment.routes";

//importaciones modulo rental
import { RentalRepository } from "../repositories/rental/rental.repository";
import { RentalControllerService } from "../controllers/rental/rental.controller.service";
import { RentalPhotoRepository } from "../repositories/rental/rental-photo.repository";
import { RentalPhotoControllerService } from "../controllers/rental/rental-photo.controller.service";
import { RentalRoutes } from "./rental/rental.routes";


//importaciones modulo tenant
import { TenantRepository } from "../repositories/tenant/tenant.repository";
import { TenantControllerService } from "../controllers/tenant/tenant.controller.service";
import { TenantRoutes } from "./tenant/tenant.routes";

//importaciones modulo de Users
import { UserRepository } from "../repositories/user/user.repository";
import { UserControllerService } from "../controllers/user/user.controller.service";
import { UserRoutes } from "./user/user.routes";

//imporatciones modulo vehicle
import { VehicleRepository } from "../repositories/vehicle/vehicle.repository";
import { VehicleControllerService } from "../controllers/vehicle/vehicle.controller.service";
import { VehicleRoutes } from "./vehicle/vehicle.routes";

//importaciones modulo auth
import { AuthRepository } from "../repositories/auth/auth.repository";
import { AuthControllerService } from "../controllers/auth/auth.controller.service";
import { AuthRoutes } from "./auth/auth.routes";

//importaciones modulo custom roles
import { CustomRoleRepository } from "../repositories/role/role.repository";
import { CustomRoleControllerService } from "../controllers/role/role.controller.service";
import { CustomRoleRoutes } from "./role/role.routes";

//importaciones modulo permissions
import { PermissionRepository } from "../repositories/permission/permission.repository";
import { PermissionControllerService } from "../controllers/permission/permission.controller.service";
import { PermissionRoutes } from "./permission/permission.routes";

//importaciones modulo reports
import { ReportRepository } from "../repositories/report/report.repository";
import { ReportControllerService } from "../controllers/report/report.controller.service";
import { ReportRoutes } from "./report/report.routes";

//importaciones modulo settings
import { SettingsControllerService } from "../controllers/settings/settings.controller.service";
import { SettingsRoutes } from "./settings/settings.routes";

//importaciones modulo audit
import { AuditRepository } from "../repositories/audit/audit.repository";
import { AuditControllerService } from "../controllers/audit/audit.controller.service";
import { AuditRoutes } from "./audit/audit.routes";

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    // --- Configuración Modulo Clientes ---
    const clientRepo = new ClientRepository(prisma);
    const clientCtrl = new ClienteControllerService(clientRepo);
    const clientRoutes = new ClientRoutes(Router(), clientCtrl);

    // --- Configuración Modulo Pagos ---
    const paymentRepo = new PaymentRepository(prisma);
    const paymentCtrl = new PaymentControllerService(paymentRepo);
    const paymentRoutes = new PaymentRoutes(Router(), paymentCtrl);

    // --- configuracion Modulo Rental ---
    const rentalRepo = new RentalRepository(prisma)
    const rentalCtrl = new RentalControllerService(rentalRepo)
    const rentalPhotoRepo = new RentalPhotoRepository(prisma)
    const rentalPhotoCtrl = new RentalPhotoControllerService(rentalPhotoRepo)
    const rentalRoutes = new RentalRoutes(Router(), rentalCtrl, rentalPhotoCtrl, paymentCtrl);

    // --- configuracon Modulo Tenant ---
    const tenantRepo = new TenantRepository(prisma)
    const tenantCtrl = new TenantControllerService(tenantRepo)
    const tenantRoutes = new TenantRoutes(Router(), tenantCtrl)

    // --- configuracion Modulo Users ---
    const userRepo = new UserRepository(prisma)
    const userCtrl = new UserControllerService(userRepo)
    const userRoutes = new UserRoutes(Router(),userCtrl)

    // --- configuracion Modulo Users ---
    const vehicleRepo = new VehicleRepository(prisma)
    const vehicleCtrl = new VehicleControllerService(vehicleRepo)
    const vehicleRoutes = new VehicleRoutes(Router(), vehicleCtrl)

    // --- configuracion Modulo Auth ---
    const authRepo = new AuthRepository(prisma)
    const authCtrl = new AuthControllerService(authRepo, tenantRepo)
    const authRoutes = new AuthRoutes(Router(), authCtrl)

    // --- configuracion Modulo Custom Roles ---
    const customRoleRepo = new CustomRoleRepository(prisma)
    const customRoleCtrl = new CustomRoleControllerService(customRoleRepo)
    const customRoleRoutes = new CustomRoleRoutes(Router(), customRoleCtrl)

    // --- configuracion Modulo Permissions ---
    const permissionRepo = new PermissionRepository(prisma)
    const permissionCtrl = new PermissionControllerService(permissionRepo)
    const permissionRoutes = new PermissionRoutes(Router(), permissionCtrl)

    // --- configuracion Modulo Reports ---
    const reportRepo = new ReportRepository(prisma)
    const reportCtrl = new ReportControllerService(reportRepo)
    const reportRoutes = new ReportRoutes(Router(), reportCtrl)

    // --- configuracion Modulo Settings ---
    const settingsCtrl = new SettingsControllerService(tenantRepo)
    const settingsRoutes = new SettingsRoutes(Router(), settingsCtrl)

    // --- configuracion Modulo Audit ---
    const auditRepo = new AuditRepository(prisma)
    const auditCtrl = new AuditControllerService(auditRepo)
    const auditRoutes = new AuditRoutes(Router(), auditCtrl)

    // --- Definición de Prefijos de Ruta ---
    router.use("/auth", authRoutes.initRoutes());
    router.use("/clients", clientRoutes.initRoutes());
    router.use("/payments", paymentRoutes.initRoutes());
    router.use("/permissions", permissionRoutes.initRoutes());
    router.use("/rentals", rentalRoutes.initRoutes());
    router.use("/roles", customRoleRoutes.initRoutes());
    router.use("/tenants", tenantRoutes.initRoutes());
    router.use("/users", userRoutes.initRoutes());
    router.use("/vehicles", vehicleRoutes.initRoutes());
    router.use("/reports", reportRoutes.initRoutes());
    router.use("/settings", settingsRoutes.initRoutes());
    router.use("/audit",    auditRoutes.initRoutes());

    return router;
  }
}
