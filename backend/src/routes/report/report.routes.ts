import { Router, Request, Response, NextFunction } from "express"
import { ReportControllerService } from "../../controllers/report/report.controller.service"
import { authMiddleware } from "../../middlewares/auth.moddleware"
import { tenantMiddleware } from "../../middlewares/tenant.middleware"
import { checkPermission } from "../../middlewares/permission.middleware"

export class ReportRoutes {
  constructor(
    private readonly router: Router,
    private readonly controller: ReportControllerService
  ) {}

  initRoutes() {
    this.router.get(
      "/daily-summary",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getDailySummary(req, res, next)
    )

    this.router.get(
      "/receivables",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getReceivables(req, res, next)
    )

    this.router.get(
      "/rentals",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getRentalsReport(req, res, next)
    )

    this.router.get(
      "/payments",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getPaymentsReport(req, res, next)
    )

    this.router.get(
      "/vehicles",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getVehiclesReport(req, res, next)
    )

    return this.router
  }
}
