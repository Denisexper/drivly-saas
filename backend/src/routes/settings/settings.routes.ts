import { Router, Request, Response, NextFunction } from "express";
import { SettingsControllerService } from "../../controllers/settings/settings.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { authorizeRoles } from "../../middlewares/role.moddleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateSettingsSchema } from "../../schemas/settings.schema";

export class SettingsRoutes {
  private router: Router;
  private controller: SettingsControllerService;

  constructor(router: Router, controller: SettingsControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("Admin"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getMySettings(req, res, next)
    );

    this.router.patch(
      "/",
      authMiddleware,
      authorizeRoles("Admin"),
      validate(updateSettingsSchema),
      (req: Request, res: Response, next: NextFunction) => this.controller.updateMySettings(req, res, next)
    );

    return this.router;
  }
}
