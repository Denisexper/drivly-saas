import { Request, Response, NextFunction } from "express";
import { LoginInput, RegisterInput } from "../../types/auth/auth.type";
import { EncryptService } from "../../services/encrypt.service";
import { generateToken } from "../../utils/generateToken";
import { AuthRepository } from "../../repositories/auth/auth.repository";
import { TenantRepositoryInterface } from "../../interfaces/tenant/tenant.repository.interface";


export class AuthControllerService {
    private authRepo: AuthRepository;
    private tenantRepo: TenantRepositoryInterface;

    constructor(authRepo: AuthRepository, tenantRepo: TenantRepositoryInterface) {
        this.authRepo = authRepo;
        this.tenantRepo = tenantRepo;
    }

    async impersonate(req: Request<{ tenantId: string }>, res: Response, next: NextFunction) {
        const { tenantId } = req.params;

        try {
            const tenant = await this.tenantRepo.getById(tenantId);

            if (!tenant) return next({ status: 404, message: "Empresa no encontrada" });
            if (!tenant.active) return next({ status: 403, message: "Esta empresa está inactiva" });

            const token = generateToken({
                id: req.user!.id,
                tenantId: tenant.id,
                role: req.user!.role,
                email: req.user!.email,
                isImpersonating: true,
            });

            return res.status(200).json({
                msj: "Impersonación exitosa",
                token,
                data: {
                    id: req.user!.id,
                    email: req.user!.email,
                    tenantId: tenant.id,
                    role: req.user!.role,
                    tenantName: tenant.name,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async register(req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) {
        const { name, email, password, tenantId } = req.body;

        try {
            const userExist = await this.authRepo.findByEmail(email);

            if (userExist) {
                return next({ status: 400, message: "Email already exist" });
            }

            const hashedPass = await EncryptService.hashPassword(password);

            const newUser = await this.authRepo.register({
                name,
                email,
                password: hashedPass,
                tenantId,
            });

            return res.status(201).json({
                msj: "User created Successfully",
                data: {
                    name: newUser.name,
                    email: newUser.email,
                    tenantId: newUser.tenantId,
                    role: newUser.role,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) {
        const { email, password, slug } = req.body;

        try {
            const userExist = await this.authRepo.findByEmail(email);

            if (!userExist) {
                return next({ status: 401, message: "Credenciales incorrectas" });
            }

            const isPasswordValid = await EncryptService.comparePassword(password, userExist.password);

            if (!isPasswordValid) {
                return next({ status: 401, message: "Credenciales incorrectas" });
            }

            if (slug) {
                if (slug === "superadmin") {
                    if (userExist.role !== "SuperAdmin") {
                        return next({ status: 403, message: "Acceso denegado" });
                    }
                } else {
                    const tenant = await this.tenantRepo.getBySlug(slug);
                    if (!tenant) {
                        return next({ status: 404, message: "Empresa no encontrada" });
                    }
                    if (!tenant.active) {
                        return next({ status: 403, message: "Esta empresa está inactiva. Contacta al administrador." });
                    }
                    if (userExist.tenantId !== tenant.id) {
                        return next({ status: 403, message: "Credenciales incorrectas" });
                    }
                }
            }

            const token = generateToken({
                id: userExist.id,
                tenantId: userExist.tenantId,
                role: userExist.role,
                email: userExist.email,
            });

            return res.status(200).json({
                msj: "Bienvenido al sistema",
                token,
                data: {
                    id: userExist.id,
                    name: userExist.name,
                    email: userExist.email,
                    tenantId: userExist.tenantId,
                    role: userExist.role,
                    slug: slug ?? null,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}