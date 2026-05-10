import { Payment } from "@prisma/client";

export type CreatePaymentInput = Omit<Payment, 'id' | 'createdAt'> & {
    type?: Payment['type']
}

export interface PaymentSummary {
    rentalId: string
    totalAcordado: number
    totalPagado: number
    saldoPendiente: number
    totalCobrosExtra: number
    totalDevuelto: number
    totalFinal: number
    pagos: Payment[]
}

export interface PaymentWithDetails {
    id: string
    amount: string
    method: string
    type: string
    notes: string | null
    createdAt: Date
    rental: {
        id: string
        startDate: Date
        endDate: Date
        totalAmount: string
        tenant: {
            name: string
            slug: string
        }
        client: {
            firstName: string
            lastName: string
            email: string | null
            phone: string
            idNumber: string
        }
        vehicle: {
            plate: string
            brand: string
            model: string
        }
    }
}
