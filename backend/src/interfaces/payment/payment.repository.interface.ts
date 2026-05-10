import { Payment } from "@prisma/client";
import { CreatePaymentInput, PaymentSummary, PaymentWithDetails } from "../../types/payment/payment.types";

export interface PaymentRepositoryInterface {
    getById(id: string): Promise<Payment | null>
    getByIdWithDetails(id: string): Promise<PaymentWithDetails | null>
    getAll(tenantId?: string): Promise<Payment[]>
    create(data: CreatePaymentInput): Promise<Payment>
    delete(id: string): Promise<Payment>
    getPaymentSummary(rentalId: string): Promise<PaymentSummary>
}
