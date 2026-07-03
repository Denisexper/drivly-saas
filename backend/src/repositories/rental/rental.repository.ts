import { Rental, Vehicle, Client, PrismaClient } from "@prisma/client";
import { RentalRepositoryInterface } from "../../interfaces/rental/rental.repository.interface";
import {
  CreateRentalInput,
  UpdateRentalInput,
  ReturnRentalInput,
  RentalWithDetails,
} from "../../types/rental/rental.types";

export class RentalRepository implements RentalRepositoryInterface {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string): Promise<Rental | null> {
    return this.prisma.rental.findUnique({
      where: { id },
      include: { vehicle: true, client: true, user: true, payments: true },
    });
  }

  async getByIdWithDetails(id: string): Promise<RentalWithDetails | null> {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true, slug: true } },
        client: { select: { firstName: true, lastName: true, email: true, phone: true, idType: true, idNumber: true, address: true, licenseNum: true, licenseExp: true } },
        vehicle: { select: { brand: true, model: true, year: true, plate: true, color: true, category: true, transmission: true, seats: true, fuelType: true } },
        user: { select: { name: true } },
      },
    });

    if (!rental) return null;

    return {
      id: rental.id,
      startDate: rental.startDate,
      endDate: rental.endDate,
      dailyRate: rental.dailyRate.toString(),
      totalDays: rental.totalDays,
      subtotal: rental.subtotal.toString(),
      discount: rental.discount.toString(),
      extraCharges: rental.extraCharges.toString(),
      totalAmount: rental.totalAmount.toString(),
      deposit: rental.deposit.toString(),
      mileageStart: rental.mileageStart,
      fuelOut: rental.fuelOut,
      notes: rental.notes,
      createdAt: rental.createdAt,
      status: rental.status,
      tenant: rental.tenant,
      client: rental.client,
      vehicle: rental.vehicle,
      user: rental.user,
    };
  }

  async getAll(tenantId?: string, status?: string): Promise<Rental[]> {
    return this.prisma.rental.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: { vehicle: true, client: true, user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateRentalInput): Promise<Rental> {
    const { depositMethod, ...rentalData } = data;

    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.create({ data: rentalData });

      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: "Rented" },
      });

      // Si se registró un depósito al crear el alquiler, crear el pago automáticamente
      if (Number(data.deposit) > 0) {
        await tx.payment.create({
          data: {
            rentalId: rental.id,
            amount: data.deposit,
            method: depositMethod ?? "Cash",
            type: "Deposito",
            notes: "Depósito registrado al crear el alquiler",
          },
        });
      }

      return rental;
    });
  }

  async update(id: string, data: UpdateRentalInput): Promise<Rental> {
    return this.prisma.rental.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Rental> {
    return this.prisma.rental.delete({ where: { id } });
  }

  async forceDelete(id: string): Promise<Rental> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id } });
      if (!rental) throw Object.assign(new Error("Rental not found"), { status: 404 });

      if (rental.status === "Active") {
        await tx.vehicle.update({
          where: { id: rental.vehicleId },
          data: { status: "Available" },
        });
      }

      await tx.rentalPhoto.deleteMany({ where: { rentalId: id } });

      return tx.rental.delete({ where: { id } });
    });
  }

  async findVehicle(vehicleId: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findFirst({ where: { id: vehicleId, deletedAt: null } });
  }

  async findClient(clientId: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
  }

  async hasDateConflict(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string
  ): Promise<boolean> {
    const conflict = await this.prisma.rental.findFirst({
      where: {
        vehicleId,
        id: excludeRentalId ? { not: excludeRentalId } : undefined,
        status: { in: ["Reserved", "Active"] },
        // Se solapan si: startDate < endDate existente AND endDate > startDate existente
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } },
        ],
      },
    });
    return conflict !== null;
  }

  async cancelRental(rentalId: string, notes?: string): Promise<Rental> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: rentalId } });

      if (!rental) throw Object.assign(new Error("Rental not found"), { status: 404 });

      const cancelled = await tx.rental.update({
        where: { id: rentalId },
        data: {
          status: "Cancelled",
          notes: notes ?? rental.notes,
        },
      });

      // Solo liberar el vehiculo si estaba activo o reservado
      if (rental.status === "Active" || rental.status === "Reserved") {
        await tx.vehicle.update({
          where: { id: rental.vehicleId },
          data: { status: "Available" },
        });
      }

      return cancelled;
    });
  }

  async returnVehicle(rentalId: string, data: ReturnRentalInput): Promise<Rental> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: rentalId } });

      if (!rental) throw Object.assign(new Error("Rental not found"), { status: 404 });

      const subtotal = Number(rental.subtotal);
      const discount = Number(rental.discount);
      const extraCharges = data.extraCharges ?? Number(rental.extraCharges);
      const newTotal = subtotal - discount + extraCharges;

      const updated = await tx.rental.update({
        where: { id: rentalId },
        data: {
          status: "Completed",
          actualReturn: data.actualReturn ?? new Date(),
          mileageEnd: data.mileageEnd,
          fuelIn: data.fuelIn,
          extraCharges: extraCharges,
          totalAmount: newTotal,
          notes: data.notes ?? rental.notes,
        },
      });

      await tx.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: "Available" },
      });

      return updated;
    });
  }
}
