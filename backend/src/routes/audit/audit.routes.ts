import { Router, Request, Response, NextFunction } from "express";
import { AuditControllerService } from "../../controllers/audit/audit.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";

export class AuditRoutes {
  constructor(
    private readonly router: Router,
    private readonly controller: AuditControllerService,
  ) {}

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("audit:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getAll(req, res, next),
    );

    return this.router;
  }
}
