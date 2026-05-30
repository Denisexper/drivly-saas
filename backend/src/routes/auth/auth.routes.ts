import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AuthControllerService } from "../../controllers/auth/auth.controller.service";
import { LoginInput, RegisterInput, CompanyRegisterInput } from "../../types/auth/auth.type";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema, companyRegisterSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } from "../../schemas/auth.schema";
import { authMiddleware } from "../../middlewares/auth.moddleware";
import { authorizeRoles } from "../../middlewares/role.moddleware";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de login, espera 1 minuto." },
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
        this.router.post("/forgot-password", validate(forgotPasswordSchema), (req, res, next) => this.controller.forgotPassword(req, res, next));
        this.router.post("/reset-password", validate(resetPasswordSchema), (req, res, next) => this.controller.resetPassword(req, res, next));
        this.router.post("/verify-email", validate(verifyEmailSchema), (req, res, next) => this.controller.verifyEmail(req, res, next));
        this.router.post("/resend-verification", validate(resendVerificationSchema), (req, res, next) => this.controller.resendVerification(req, res, next));
        this.router.post("/logout", authMiddleware, (req, res, next) => this.controller.logout(req, res, next));
        this.router.post("/impersonate/:tenantId", authMiddleware, authorizeRoles("SuperAdmin"), (req: Request<{ tenantId: string }>, res: Response, next: NextFunction) => this.controller.impersonate(req, res, next));

        return this.router;
    }
}