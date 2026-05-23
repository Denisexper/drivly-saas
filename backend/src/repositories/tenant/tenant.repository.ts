import { Tenant, PrismaClient } from "@prisma/client";
import { TenantRepositoryInterface, SuperAdminStats, TenantWithAdmin } from "../../interfaces/tenant/tenant.repository.interface";
import { CreateTenantInput, UpdateTenantInput } from "../../types/tenant/tenant.types";

export class TenantRepository implements TenantRepositoryInterface {

    private prisma: PrismaClient;

    constructor (
        prisma: PrismaClient
    ){
        this.prisma = prisma
    }

    async getBySlug(slug: string): Promise<Tenant | null> {
        try {
            return await this.prisma.tenant.findUnique({ where: { slug } });
        } catch (error) {
            throw new Error(`${error}`);
        }
    }

    async createWithAdmin(
        tenantData: { name: string; slug: string; plan?: Tenant['plan']; active?: boolean },
        adminData: { name: string; email: string; password: string }
    ): Promise<TenantWithAdmin> {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({ data: tenantData });
                const { password, ...admin } = await tx.user.create({
                    data: {
                        tenantId: tenant.id,
                        name: adminData.name,
                        email: adminData.email,
                        password: adminData.password,
                        role: 'Admin',
                        active: true,
                    },
                });
                return { tenant, admin };
            });
        } catch (error) {
            throw new Error(`${error}`);
        }
    }

    async getById(id: string): Promise<Tenant | null> {
        try {
            
            const response = await this.prisma.tenant.findUnique({
                where: { id }
            })
            return response

        } catch (error) {
            
            throw new Error (`${error}`)
        }
    }
    async getAll(): Promise<Tenant[]> {
        try {
          
            const response = await this.prisma.tenant.findMany();

            return response;
        } catch (error) {
            
            throw new Error (`${error}`);
        }
    }
    async getStats(): Promise<SuperAdminStats> {
        try {
            const [tenantsTotal, tenantsActive, usersTotal, vehiclesTotal, rentalsTotal] =
                await Promise.all([
                    this.prisma.tenant.count(),
                    this.prisma.tenant.count({ where: { active: true } }),
                    this.prisma.user.count(),
                    this.prisma.vehicle.count(),
                    this.prisma.rental.count(),
                ]);

            return { tenantsTotal, tenantsActive, usersTotal, vehiclesTotal, rentalsTotal };
        } catch (error) {
            throw new Error(`${error}`);
        }
    }

    async create(data: CreateTenantInput): Promise<Tenant> {
        try {
            
            const response = await this.prisma.tenant.create({
                data: data
            });

            return response;
        } catch (error) {
            
            throw new Error (`${error}`);
        }
    }
    async update(id: string, data: UpdateTenantInput): Promise<Tenant> {
        try {
            
            const response = await this.prisma.tenant.update({
                where: { id },
                data: data
            });

            return response;
        } catch (error) {
            
            throw new Error (`${error}`);
        }
    }
    async delete(id: string): Promise<Tenant> {
        return this.prisma.$transaction(async (tx) => {
            // Desconectar usuarios de custom roles antes de borrarlos
            await tx.user.updateMany({ where: { tenantId: id }, data: { customRoleId: null } });

            // Fotos → Pagos → Alquileres
            await tx.rentalPhoto.deleteMany({ where: { rental: { tenantId: id } } });
            await tx.payment.deleteMany({ where: { rental: { tenantId: id } } });
            await tx.rental.deleteMany({ where: { tenantId: id } });

            // Vehículos y clientes
            await tx.vehicle.deleteMany({ where: { tenantId: id } });
            await tx.client.deleteMany({ where: { tenantId: id } });

            // Permisos de roles personalizados → custom roles → role permissions base
            await tx.customRolePermission.deleteMany({ where: { customRole: { tenantId: id } } });
            await tx.customRole.deleteMany({ where: { tenantId: id } });
            await tx.rolePermission.deleteMany({ where: { tenantId: id } });

            // Usuarios
            await tx.user.deleteMany({ where: { tenantId: id } });

            return tx.tenant.delete({ where: { id } });
        });
    }

}