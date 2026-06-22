import { Router, Request, Response, NextFunction } from "express";
import { ClienteControllerService } from "../../controllers/client/client.controller.service";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { tenantMiddleware } from "../../middlewares/tenant.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createClientSchema, updateClientSchema } from "../../schemas/client.schema";

export class ClientRoutes {
  private router: Router;
  private ClientController: ClienteControllerService;

  constructor(router: Router, ClientController: ClienteControllerService) {
    this.router = router;
    this.ClientController = ClientController;
  }

  initRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("clients:read"),
      (req: Request, res: Response, next: NextFunction) => this.ClientController.getAll(req, res, next)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("clients:read"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.ClientController.getById(req, res, next)
    );
    this.router.post(
      "/",
      authMiddleware,
      tenantMiddleware,
      checkPermission("clients:create"),
      validate(createClientSchema),
      (req: Request, res: Response, next: NextFunction) => this.ClientController.create(req, res, next)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("clients:update"),
      validate(updateClientSchema),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.ClientController.update(req, res, next)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      tenantMiddleware,
      checkPermission("clients:delete"),
      (req: Request<{ id: string }>, res: Response, next: NextFunction) => this.ClientController.delete(req, res, next)
    );

    return this.router;
  }
}
