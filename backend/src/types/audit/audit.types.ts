export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RETURN"
  | "CANCEL"
  | "UPLOAD_PHOTOS"
  | "LOGIN";

export type AuditEntity =
  | "Vehicle"
  | "Client"
  | "Rental"
  | "Payment"
  | "User"
  | "Tenant"
  | "Auth";

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  resource: string;
  method: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface GetAuditLogsFilter {
  tenantId?: string;
  entity?: string;
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}
