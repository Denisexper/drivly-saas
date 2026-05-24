import { Rental, Vehicle, Client } from "@prisma/client";
import type {
  CreateRentalInput,
  UpdateRentalInput,
  ReturnRentalInput,
  RentalWithDetails,
} from "../../types/rental/rental.types";

export interface RentalRepositoryInterface {
  getById(id: string): Promise<Rental | null>;
  getByIdWithDetails(id: string): Promise<RentalWithDetails | null>;
  getAll(tenantId?: string, status?: string): Promise<Rental[]>;
  create(data: CreateRentalInput): Promise<Rental>;
  update(id: string, data: UpdateRentalInput): Promise<Rental>;
  delete(id: string): Promise<Rental>;
  forceDelete(id: string): Promise<Rental>;

  // Helpers para validaciones de negocio
  findVehicle(vehicleId: string): Promise<Vehicle | null>;
  findClient(clientId: string): Promise<Client | null>;
  hasDateConflict(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string
  ): Promise<boolean>;

  // Devolucion del vehiculo (transaccion: rental Completed + vehicle Available)
  returnVehicle(rentalId: string, data: ReturnRentalInput): Promise<Rental>;

  // Cancelacion del alquiler (transaccion: rental Cancelled + vehicle Available)
  cancelRental(rentalId: string, notes?: string): Promise<Rental>;
}
