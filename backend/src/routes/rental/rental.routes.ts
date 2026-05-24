import { Router, Request, Response, NextFunction } from "express";
import { RentalControllerService } from "../../controllers/rental/rental.controller.service";
import { RentalPhotoControllerService } from "../../controllers/rental/rental-photo.controller.service";
import { PaymentControllerService } from "../../controllers/payment/payment.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission, checkPermissionAny } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadPhotos } from "../../middlewares/upload.middleware";
import { createRentalSchema, updateRentalSchema } from "../../schemas/rental.schema";

export class RentalRoutes {
  private router: Router;
  private controller: RentalControllerService;
  private photoController: RentalPhotoControllerService;
  private paymentController: PaymentControllerService;

  constructor(
    router: Router,
    controller: RentalControllerService,
    photoController: RentalPhotoControllerService,
    paymentController: PaymentControllerService
  ) {
    this.router = router;
    this.controller = controller;
    this.photoController = photoController;
    this.paymentController = paymentController;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermissionAny("rentals:read", "payments:create", "payments:read"),
      (req: Request, res: Response) => this.controller.getAll(req, res)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:read"),
      (req: Request<{ id: string }>, res: Response) => this.controller.getById(req, res)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:create"),
      validate(createRentalSchema),
      (req: Request, res: Response) => this.controller.create(req, res)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:update"),
      validate(updateRentalSchema),
      (req: Request<{ id: string }>, res: Response) => this.controller.update(req, res)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:delete"),
      (req: Request<{ id: string }>, res: Response) => this.controller.delete(req, res)
    );
    this.router.delete(
      "/:id/force",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:delete"),
      (req: Request<{ id: string }>, res: Response) => this.controller.forceDelete(req, res)
    );

    // Photos
    this.router.post(
      "/:id/photos",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:update"),
      (req: Request, res: Response, next: NextFunction) => uploadPhotos(req, res, next),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.photoController.upload(req, res, next)
    );
    this.router.get(
      "/:id/photos",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:read"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.photoController.list(req, res, next)
    );

    // PDF contrato
    this.router.get(
      "/:id/pdf-contract",
      authMiddleware,
      tenantMiddleware,
      checkPermission("rentals:read"),
      (req: Request<{ id: string }>, res: Response) => this.controller.getPdfContract(req, res)
    );

    // Payment summary
    this.router.get(
      "/:id/payment-summary",
      authMiddleware,
      tenantMiddleware,
      checkPermissionAny("rentals:read", "payments:read"),
      (req: Request<{ id: string }>, res: Response) => this.paymentController.getPaymentSummary(req, res)
    );

    return this.router;
  }
}
