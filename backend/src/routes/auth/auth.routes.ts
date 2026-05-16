import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AuthControllerService } from "../../controllers/auth/auth.controller.service";
import { LoginInput, RegisterInput, CompanyRegisterInput } from "../../types/auth/auth.type";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema, companyRegisterSchema } from "../../schemas/auth.schema";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { authorizeRoles } from "../../middlewares/role.moddleware";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msj: "Demasiados intentos de login, espera 1 minuto." },
});

export class AuthRoutes {
    private router: Router;
    private controller: AuthControllerService;

    constructor (
        router: Router,
        controller: AuthControllerService
    ){
        this.router = router,
        this.controller = controller
    }

    initRoutes () {
        this.router.post("/login", loginLimiter, validate(loginSchema), (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => this.controller.login(req, res, next));
        this.router.post("/register", validate(registerSchema), (req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) => this.controller.register(req, res, next));
        this.router.post("/register-company", validate(companyRegisterSchema), (req: Request<{}, {}, CompanyRegisterInput>, res: Response, next: NextFunction) => this.controller.registerCompany(req, res, next));
        this.router.post("/impersonate/:tenantId", authMiddleware, authorizeRoles("SuperAdmin"), (req: Request<{ tenantId: string }>, res: Response, next: NextFunction) => this.controller.impersonate(req, res, next));

        return this.router;
    }
}