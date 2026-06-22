import { Router, Request, Response, NextFunction } from "express";
import { VehicleControllerService } from "../../controllers/vehicle/vehicle.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createVehicleSchema, updateVehicleSchema } from "../../schemas/vehicle.schema";

export class VehicleRoutes {
  private router: Router;
  private controller: VehicleControllerService;

  constructor(router: Router, controller: VehicleControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("vehicles:read"),
      (req: Request<{}, {}, {}, { tenantId: string }>, res: Response, next: NextFunction) => this.controller.getAll(req, res, next)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("vehicles:read"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.getById(req, res, next)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("vehicles:create"),
      validate(createVehicleSchema),
      (req: Request, res: Response, next: NextFunction) => this.controller.create(req, res, next)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("vehicles:update"),
      validate(updateVehicleSchema),
      (req: Request<{ id: string }, {}, {}, { tenantId: string }>, res: Response, next: NextFunction) => this.controller.update(req, res, next)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("vehicles:delete"),
      (req: Request<{ id: string }, {}, {}, { tenantId: string }>, res: Response, next: NextFunction) => this.controller.delete(req, res, next)
    );

    return this.router;
  }
}
