import { Router, Request, Response } from "express";
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
      (req: Request, res: Response) => this.controller.getMySettings(req, res)
    );

    this.router.patch(
      "/",
      authMiddleware,
      authorizeRoles("Admin"),
      validate(updateSettingsSchema),
      (req: Request, res: Response) => this.controller.updateMySettings(req, res)
    );

    return this.router;
  }
}
