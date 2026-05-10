import { Router, Request, Response } from "express";
import { PaymentControllerService } from "../../controllers/payment/payment.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createPaymentSchema } from "../../schemas/payment.schema";

export class PaymentRoutes {
  private router: Router;
  private controller: PaymentControllerService;

  constructor(router: Router, controller: PaymentControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("payments:read"),
      (req: Request, res: Response) => this.controller.getAll(req, res)
    );
    this.router.get(
      "/:id/pdf-receipt",
      authMiddleware,
      tenantMiddleware,
      checkPermission("payments:read"),
      (req: Request<{ id: string }>, res: Response) => this.controller.getPdfReceipt(req, res)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("payments:read"),
      (req: Request<{ id: string }>, res: Response) => this.controller.getById(req, res)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("payments:create"),
      validate(createPaymentSchema),
      (req: Request, res: Response) => this.controller.create(req, res)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("payments:delete"),
      (req: Request<{ id: string }>, res: Response) => this.controller.delete(req, res)
    );

    return this.router;
  }
}
