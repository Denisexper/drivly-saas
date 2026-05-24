import { Router, Request, Response } from "express"
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
      (req: Request, res: Response) => this.controller.getDailySummary(req, res)
    )

    this.router.get(
      "/receivables",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response) => this.controller.getReceivables(req, res)
    )

    this.router.get(
      "/rentals",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response) => this.controller.getRentalsReport(req, res)
    )

    this.router.get(
      "/payments",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response) => this.controller.getPaymentsReport(req, res)
    )

    this.router.get(
      "/vehicles",
      authMiddleware,
      tenantMiddleware,
      checkPermission("reports:read"),
      (req: Request, res: Response) => this.controller.getVehiclesReport(req, res)
    )

    return this.router
  }
}
