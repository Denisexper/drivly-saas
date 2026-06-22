import { Router, Request, Response, NextFunction } from "express";
import { UserControllerService } from "../../controllers/user/user.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createUserSchema, updateUserSchema } from "../../schemas/user.schema";

export class UserRoutes {
  private router: Router;
  private controller: UserControllerService;

  constructor(router: Router, controller: UserControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("users:read"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getAll(req, res, next)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("users:read"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.getById(req, res, next)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("users:create"),
      validate(createUserSchema),
      (req: Request, res: Response, next: NextFunction) => this.controller.create(req, res, next)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("users:update"),
      validate(updateUserSchema),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.update(req, res, next)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("users:delete"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.delete(req, res, next)
    );

    return this.router;
  }
}
