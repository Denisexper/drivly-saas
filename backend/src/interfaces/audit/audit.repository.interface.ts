import { AuditLogEntry, GetAuditLogsFilter } from "../../types/audit/audit.types";

export interface AuditRepositoryInterface {
  getAll(filter: GetAuditLogsFilter): Promise<{ data: AuditLogEntry[]; total: number }>;
}
