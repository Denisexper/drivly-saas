import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { LoginInput, RegisterInput, CompanyRegisterInput } from "../../types/auth/auth.type";
import { EncryptService } from "../../services/encrypt.service";
import { generateToken } from "../../utils/generateToken";
import { AuthRepository } from "../../repositories/auth/auth.repository";
import { TenantRepositoryInterface } from "../../interfaces/tenant/tenant.repository.interface";
import { slugify } from "../../utils/slugify";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "../../email/email.service";
import { seedTenantDefaultPermissions } from "../../permissions/sync";
import { logAction } from "../../utils/audit";


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

    async registerCompany(req: Request<{}, {}, CompanyRegisterInput>, res: Response, next: NextFunction) {
        const { companyName, ownerName, ownerEmail, ownerPassword } = req.body;

        try {
            const emailInUse = await this.authRepo.findByEmail(ownerEmail);
            if (emailInUse) return next({ status: 400, message: "Ya existe una cuenta con ese email" });

            const baseSlug = slugify(companyName);
            let slug = baseSlug;
            let attempt = 1;
            while (await this.authRepo.findBySlug(slug)) {
                slug = `${baseSlug}-${attempt++}`;
            }

            const hashedPassword = await EncryptService.hashPassword(ownerPassword);
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);

            const { tenant, user } = await this.authRepo.registerCompany({
                tenantName: companyName,
                slug,
                ownerName,
                ownerEmail,
                hashedPassword,
                trialEndsAt,
            });

            await seedTenantDefaultPermissions(tenant.id);

            const verifyToken = randomUUID();
            const verifyExpiresAt = new Date();
            verifyExpiresAt.setHours(verifyExpiresAt.getHours() + 24);
            await this.authRepo.setEmailVerifyToken(user.id, verifyToken, verifyExpiresAt);

            sendEmailVerificationEmail({
                userName: ownerName,
                userEmail: ownerEmail,
                verifyToken,
                tenantName: tenant.name,
                tenantSlug: tenant.slug,
            }).catch((err) => console.error("[Email] sendEmailVerificationEmail failed:", err));

            return res.status(201).json({
                msj: "Empresa creada exitosamente",
                data: {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    slug: tenant.slug,
                    trialEndsAt: tenant.trialEndsAt,
                    adminEmail: user.email,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        const { email } = req.body;

        try {
            const user = await this.authRepo.findByEmail(email);

            // Respuesta genérica para no revelar si el email existe
            if (!user) {
                return res.status(200).json({ msj: "Si ese email existe, recibirás instrucciones en breve." });
            }

            const token = randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await this.authRepo.setPasswordResetToken(user.id, token, expiresAt);

            sendPasswordResetEmail({
                userName: user.name,
                userEmail: user.email,
                resetToken: token,
            }).catch((err) => console.error("[Email] sendPasswordResetEmail failed:", err));

            return res.status(200).json({ msj: "Si ese email existe, recibirás instrucciones en breve." });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        const { token, newPassword } = req.body;

        try {
            const user = await this.authRepo.findByPasswordResetToken(token);

            if (!user) return next({ status: 400, message: "Token inválido o expirado" });

            const hashedPassword = await EncryptService.hashPassword(newPassword);
            await this.authRepo.resetPassword(user.id, hashedPassword);

            return res.status(200).json({ msj: "Contraseña actualizada exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            logAction({
                req,
                action: "LOGOUT",
                entity: "Auth",
                entityId: req.user!.id,
                after: { role: req.user!.role },
            });

            return res.status(200).json({ msj: "Sesión cerrada" });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        const { token } = req.body;

        try {
            const user = await this.authRepo.findByEmailVerifyToken(token);

            if (!user) return next({ status: 400, message: "TOKEN_INVALID_OR_EXPIRED" });

            await this.authRepo.markEmailVerified(user.id);

            return res.status(200).json({ msj: "Email verificado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async resendVerification(req: Request, res: Response, next: NextFunction) {
        const { email } = req.body;

        try {
            const user = await this.authRepo.findByEmail(email);

            if (!user || user.emailVerified) {
                return res.status(200).json({ msj: "Si ese email existe y no está verificado, recibirás un correo en breve." });
            }

            const tenant = await this.tenantRepo.getById(user.tenantId);

            const verifyToken = randomUUID();
            const verifyExpiresAt = new Date();
            verifyExpiresAt.setHours(verifyExpiresAt.getHours() + 24);
            await this.authRepo.setEmailVerifyToken(user.id, verifyToken, verifyExpiresAt);

            sendEmailVerificationEmail({
                userName: user.name,
                userEmail: user.email,
                verifyToken,
                tenantName: tenant?.name ?? "",
                tenantSlug: tenant?.slug ?? "",
            }).catch((err) => console.error("[Email] resendVerification failed:", err));

            return res.status(200).json({ msj: "Si ese email existe y no está verificado, recibirás un correo en breve." });
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

            if (!userExist.emailVerified) {
                return next({ status: 403, message: "EMAIL_NOT_VERIFIED" });
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

            logAction({
                req,
                action: "LOGIN",
                entity: "Auth",
                entityId: userExist.id,
                userOverride: { id: userExist.id, email: userExist.email, tenantId: userExist.tenantId },
                after: { role: userExist.role, slug: slug ?? null },
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