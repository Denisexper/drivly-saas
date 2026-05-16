import { LoginInput, RegisterInput } from "../../types/auth/auth.type";
import { PrismaClient, User, Tenant } from "@prisma/client";

export class AuthRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async register(data: RegisterInput): Promise<User> {
    try {
      const response = await this.prisma.user.create({
        data: { ...data, role: "Operator" },
      });
      return response;
    } catch (error) {
      throw new Error(`Error en el registro ${error}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      throw new Error(`Error buscando usuario: ${error}`);
    }
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async registerCompany(data: {
    tenantName: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    hashedPassword: string;
    trialEndsAt: Date;
  }): Promise<{ tenant: Tenant; user: User }> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.slug,
          trialActive: true,
          trialEndsAt: data.trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.ownerName,
          email: data.ownerEmail,
          password: data.hashedPassword,
          role: "Admin",
        },
      });

      return { tenant, user };
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
