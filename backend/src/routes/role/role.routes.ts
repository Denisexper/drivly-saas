import { Router, Request, Response, NextFunction } from "express";
import { CustomRoleControllerService } from "../../controllers/role/role.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createCustomRoleSchema, updateCustomRoleSchema } from "../../schemas/role.schema";

export class CustomRoleRoutes {
  private router: Router;
  private controller: CustomRoleControllerService;

  constructor(router: Router, controller: CustomRoleControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("roles:manage"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getAll(req, res, next)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("roles:manage"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.getById(req, res, next)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("roles:manage"),
      validate(createCustomRoleSchema),
      (req: Request, res: Response, next: NextFunction) => this.controller.create(req, res, next)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("roles:manage"),
      validate(updateCustomRoleSchema),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.update(req, res, next)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("roles:manage"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.delete(req, res, next)
    );

    return this.router;
  }
}
