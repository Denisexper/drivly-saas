import { Router, Request, Response, NextFunction } from "express";
import { TenantControllerService } from "../../controllers/tenant/tenant.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { authorizeRoles } from "../../middlewares/role.moddleware";

export class TenantRoutes {
  private router: Router;
  private controller: TenantControllerService;

  constructor(router: Router, controller: TenantControllerService) {
    this.router = router;
    this.controller = controller;
  }

  initRoutes() {
    this.router.get(
      "/stats",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getStats(req, res, next)
    );
    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request, res: Response, next: NextFunction) => this.controller.getAll(req, res, next)
    );
    this.router.get(
      "/by-slug/:slug",
      (req: Request<{ slug: string }>, res: Response, next: NextFunction) => this.controller.getPublicBySlug(req, res, next)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.getById(req, res, next)
    );
    this.router.post(
      "/",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request, res: Response, next: NextFunction) => this.controller.create(req, res, next)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.update(req, res, next)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      authorizeRoles("SuperAdmin"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.controller.delete(req, res, next)
    );

    return this.router;
  }
}
