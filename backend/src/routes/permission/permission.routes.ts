import { Router, Request, Response, NextFunction } from "express";
import { PermissionControllerService } from "../../controllers/permission/permission.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { authorizeRoles } from "../../middlewares/role.moddleware";

export class PermissionRoutes {
  private router: Router;
  private controller: PermissionControllerService;

  constructor(router: Router, controller: PermissionControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/me",
      authMiddleware,
      (req: Request, res: Response, next: NextFunction) => this.controller.getMyPermissions(req, res, next)
    );

    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getAll(req, res, next)
    );

    this.router.get(
      "/base-roles/:role",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ role: string }>, res: Response, next: NextFunction) => this.controller.getBaseRolePermissions(req, res, next)
    );

    this.router.post(
      "/base-roles/:role",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ role: string }>, res: Response, next: NextFunction) => this.controller.assignToBaseRole(req, res, next)
    );

    this.router.delete(
      "/base-roles/:role/:key",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ role: string; key: string }>, res: Response, next: NextFunction) => this.controller.revokeFromBaseRole(req, res, next)
    );

    this.router.get(
      "/custom-roles/:id",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.getCustomRolePermissions(req, res, next)
    );

    this.router.post(
      "/custom-roles/:id",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.assignToCustomRole(req, res, next)
    );

    this.router.delete(
      "/custom-roles/:id/:key",
      authMiddleware,
      authorizeRoles("Admin", "SuperAdmin"),
      (req: Request<{ id: string; key: string }>, res: Response, next: NextFunction) => this.controller.revokeFromCustomRole(req, res, next)
    );

    return this.router;
  }
}
